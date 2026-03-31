 // ============================================================================
 // UTxO State Sync Service - Syncs on-chain state with database
 // ============================================================================
 
 import { supabase } from '@/integrations/supabase/client';
 import { blockchainService } from './blockchainService';
 import { isScriptDeployed } from './scriptRegistry';
 import { UTxO } from './types';
 
 /** Escrow on-chain state */
 export interface OnChainEscrowState {
   utxoTxHash: string;
   utxoOutputIndex: number;
   amount: bigint;
   datumHash?: string;
   inlineDatum?: unknown;
   isSpent: boolean;
 }
 
 /** Sync result for a single escrow */
 export interface SyncResult {
   escrowId: string;
   status: 'synced' | 'spent' | 'not_found' | 'error';
   onChainState?: OnChainEscrowState;
   error?: string;
 }
 
 /**
  * Find escrow UTxO at the script address
  */
 async function findEscrowUtxo(
   scriptAddress: string,
   expectedDatumHash?: string
 ): Promise<UTxO | null> {
   try {
     const utxos = await blockchainService.getUtxos(scriptAddress);
     
     if (!expectedDatumHash) {
       // Return largest UTxO if no datum hash specified
       return utxos.sort((a, b) => 
         Number(b.lovelace - a.lovelace)
       )[0] || null;
     }
     
     // Find UTxO with matching datum hash
     return utxos.find(u => u.datumHash === expectedDatumHash) || null;
   } catch (error) {
     console.error('[UTxO Sync] Error fetching UTxOs:', error);
     return null;
   }
 }
 
 /**
  * Check if a specific UTxO has been spent
  */
 async function isUtxoSpent(_txHash: string, _outputIndex: number): Promise<boolean> {
    // In native-script mode, each escrow has a unique script address.
    // Without that address we can't query on-chain. Rely on the sync flow.
    return false;
  }
 
 /**
  * Sync a single escrow's on-chain state with database
  */
 export async function syncEscrowState(escrowId: string): Promise<SyncResult> {
   try {
     // Fetch escrow from database
     const { data: escrow, error: fetchError } = await supabase
       .from('escrows')
       .select('*')
       .eq('id', escrowId)
       .maybeSingle();
     
     if (fetchError || !escrow) {
       return { escrowId, status: 'error', error: 'Escrow not found in database' };
     }
     
     // If escrow is already completed/refunded, no sync needed
     if (escrow.status !== 'active') {
       return { escrowId, status: 'synced' };
     }
     
      if (!isScriptDeployed()) {
        return { escrowId, status: 'error', error: 'Escrow not enabled on this network' };
      }
     
     // Check if we have a tracked UTxO
     if (escrow.utxo_tx_hash && escrow.utxo_output_index !== null) {
       const spent = await isUtxoSpent(escrow.utxo_tx_hash, escrow.utxo_output_index);
       
       if (spent) {
         // UTxO was spent - escrow is complete or refunded
         // Check transaction history to determine which
         const { data: txs } = await supabase
           .from('escrow_transactions')
           .select('tx_type')
           .eq('escrow_id', escrowId)
           .order('created_at', { ascending: false })
           .limit(1);
         
         const lastTxType = txs?.[0]?.tx_type;
         const newStatus = lastTxType === 'refunded' ? 'refunded' : 'completed';
         
         // Update database
         await supabase
           .from('escrows')
           .update({
             status: newStatus,
             on_chain_status: 'spent',
             last_synced_at: new Date().toISOString(),
           })
           .eq('id', escrowId);
         
         return { 
           escrowId, 
           status: 'spent',
           onChainState: {
             utxoTxHash: escrow.utxo_tx_hash,
             utxoOutputIndex: escrow.utxo_output_index,
             amount: BigInt(escrow.amount),
             isSpent: true,
           }
         };
       }
     }
     
      // In native-script mode, script_address is per-escrow (stored in DB)
      const scriptAddr = escrow.script_address;
      const utxo = scriptAddr ? await findEscrowUtxo(scriptAddr, escrow.datum_hash || undefined) : null;
     
     if (!utxo) {
       // No UTxO found - could be pending or already spent
       return { escrowId, status: 'not_found' };
     }
     
     // Update database with current on-chain state
     await supabase
       .from('escrows')
       .update({
         utxo_tx_hash: utxo.txHash,
         utxo_output_index: utxo.outputIndex,
         on_chain_status: 'active',
         last_synced_at: new Date().toISOString(),
       })
       .eq('id', escrowId);
     
     return {
       escrowId,
       status: 'synced',
       onChainState: {
         utxoTxHash: utxo.txHash,
         utxoOutputIndex: utxo.outputIndex,
         amount: utxo.lovelace,
         datumHash: utxo.datumHash,
         inlineDatum: utxo.datum,
         isSpent: false,
       }
     };
   } catch (error) {
     console.error('[UTxO Sync] Error syncing escrow:', error);
     return {
       escrowId,
       status: 'error',
       error: error instanceof Error ? error.message : 'Unknown error',
     };
   }
 }
 
 /**
  * Sync all active escrows
  */
 export async function syncAllActiveEscrows(): Promise<SyncResult[]> {
   const { data: escrows, error } = await supabase
     .from('escrows')
     .select('id')
     .eq('status', 'active');
   
   if (error || !escrows) {
     console.error('[UTxO Sync] Error fetching active escrows:', error);
     return [];
   }
   
   const results: SyncResult[] = [];
   
   // Sync sequentially to avoid rate limiting
   for (const escrow of escrows) {
     const result = await syncEscrowState(escrow.id);
     results.push(result);
     
     // Small delay between syncs
     await new Promise(r => setTimeout(r, 200));
   }
   
   return results;
 }
 
 /**
  * Start periodic sync (call on app initialization)
  */
 export function startPeriodicSync(intervalMs = 60000): () => void {
   const interval = setInterval(() => {
     syncAllActiveEscrows().catch(console.error);
   }, intervalMs);
   
   // Run immediately
   syncAllActiveEscrows().catch(console.error);
   
   // Return cleanup function
   return () => clearInterval(interval);
 }
 
 export const utxoSyncService = {
   syncEscrowState,
   syncAllActiveEscrows,
   startPeriodicSync,
   findEscrowUtxo,
   isUtxoSpent,
 };