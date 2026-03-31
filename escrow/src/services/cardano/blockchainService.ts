// ============================================================================
// Blockchain Service - Handles all chain interactions via edge function
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import { 
  UTxO, 
  TxStatus, 
  ProtocolParams, 
  BlockfrostUTxO,
  CONFIRMATION_THRESHOLDS,
} from './types';
import { TARGET_NETWORK, getExplorerUrl } from './networkGuard';

/** Edge function endpoint */
const EDGE_FUNCTION = 'cardano-blockchain';

/** API response wrapper */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Call the Cardano blockchain edge function
 */
async function callBlockchain<T>(
  action: string, 
  params: Record<string, unknown> = {}
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(EDGE_FUNCTION, {
    body: { action, ...params },
  });

  if (error) {
    console.error(`[Blockchain] ${action} error:`, error);
    throw new Error(error.message || 'Blockchain API error');
  }

  const response = data as ApiResponse<T>;
  
  if (!response.success) {
    throw new Error(response.error || 'Unknown blockchain error');
  }

  return response.data as T;
}

/**
 * Blockchain service for Cardano interactions
 */
export const blockchainService = {
  /**
   * Get UTxOs for an address
   */
  async getUtxos(address: string): Promise<UTxO[]> {
    const utxos = await callBlockchain<BlockfrostUTxO[]>('getUtxos', { address });
    
    return utxos.map(utxo => ({
      txHash: utxo.tx_hash,
      outputIndex: utxo.output_index,
      address,
      lovelace: BigInt(utxo.amount.find(a => a.unit === 'lovelace')?.quantity || '0'),
      assets: new Map(
        utxo.amount
          .filter(a => a.unit !== 'lovelace')
          .map(a => [a.unit, BigInt(a.quantity)])
      ),
      datum: utxo.inline_datum,
      datumHash: utxo.data_hash,
    }));
  },

  /**
   * Get current protocol parameters
   */
  async getProtocolParams(): Promise<ProtocolParams> {
    const params = await callBlockchain<Record<string, unknown>>('getProtocolParams');
    
    return {
      minFeeA: Number(params.min_fee_a),
      minFeeB: Number(params.min_fee_b),
      maxTxSize: Number(params.max_tx_size),
      coinsPerUtxoByte: BigInt(String(params.coins_per_utxo_size || params.coins_per_utxo_word || '4310')),
      collateralPercent: Number(params.collateral_percent || 150),
      maxCollateralInputs: Number(params.max_collateral_inputs || 3),
      priceMem: Number(params.price_mem || 0.0577),
      priceStep: Number(params.price_step || 0.0000721),
    };
  },

  /**
   * Get transaction status and confirmations
   */
  async getTxStatus(txHash: string): Promise<TxStatus> {
    try {
      const result = await callBlockchain<{
        found: boolean;
        block?: string;
        block_height?: number;
        slot?: number;
        block_time?: number;
      }>('getTxInfo', { txHash });

      if (!result.found) {
        return { confirmed: false, confirmations: 0 };
      }

      // Get current tip to calculate confirmations
      const tipResult = await callBlockchain<{ height: number }>('getProtocolParams');
      const currentHeight = tipResult?.height || result.block_height || 0;
      const txHeight = result.block_height || 0;
      const confirmations = currentHeight - txHeight;

      return {
        confirmed: confirmations > 0,
        confirmations: Math.max(0, confirmations),
        block: result.block,
        slot: result.slot,
        timestamp: result.block_time 
          ? new Date(result.block_time * 1000).toISOString() 
          : undefined,
      };
    } catch (error) {
      console.error('[Blockchain] getTxStatus error:', error);
      return { confirmed: false, confirmations: 0 };
    }
  },

  /**
   * Submit a signed transaction
   */
  async submitTx(signedTxCbor: string): Promise<string> {
    const result = await callBlockchain<{ txHash: string }>('submitTx', { 
      txCbor: signedTxCbor 
    });
    return result.txHash;
  },

  /**
   * Get address balance
   */
  async getAddressBalance(address: string): Promise<bigint> {
    try {
      const result = await callBlockchain<{
        found: boolean;
        amount?: Array<{ unit: string; quantity: string }>;
      }>('getAddressInfo', { address });

      if (!result.found || !result.amount) {
        return 0n;
      }

      const lovelace = result.amount.find(a => a.unit === 'lovelace');
      return BigInt(lovelace?.quantity || '0');
    } catch {
      return 0n;
    }
  },

  /**
   * Wait for transaction confirmation with polling
   */
  async waitForConfirmation(
    txHash: string,
    requiredConfirmations = CONFIRMATION_THRESHOLDS.LOW_VALUE,
    maxAttempts = 60,
    intervalMs = 5000
  ): Promise<TxStatus> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.getTxStatus(txHash);
      
      if (status.confirmations >= requiredConfirmations) {
        return status;
      }

      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }

    throw new Error(`Transaction not confirmed after ${maxAttempts * intervalMs / 1000}s`);
  },

  /**
   * Get explorer URL for a transaction
   */
  getExplorerTxUrl(txHash: string): string {
    return getExplorerUrl('tx', txHash);
  },

  /**
   * Get explorer URL for an address
   */
  getExplorerAddressUrl(address: string): string {
    return getExplorerUrl('address', address);
  },

  /**
   * Get current network
   */
  getNetwork(): string {
    return TARGET_NETWORK;
  },
};
