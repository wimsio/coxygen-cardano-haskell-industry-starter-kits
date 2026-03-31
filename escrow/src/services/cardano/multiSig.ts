 // ============================================================================
 // Multi-Signature Escrow Service
 // ============================================================================
 
 import { supabase } from '@/integrations/supabase/client';
 
 /** Multi-sig status for an escrow */
 export interface MultiSigStatus {
   escrowId: string;
   requiresMultiSig: boolean;
   buyerSigned: boolean;
   sellerSigned: boolean;
   buyerSignedAt?: string;
   sellerSignedAt?: string;
   canRelease: boolean;
 }
 
 /** Signature submission result */
 export interface SignatureResult {
   success: boolean;
   signatureCount: number;
   canRelease: boolean;
   error?: string;
 }
 
 /**
  * Get multi-sig status for an escrow
  */
 export async function getMultiSigStatus(escrowId: string): Promise<MultiSigStatus | null> {
   const { data: escrow, error } = await supabase
     .from('escrows')
     .select('id, requires_multi_sig, buyer_signed_at, seller_signed_at')
     .eq('id', escrowId)
     .maybeSingle();
   
   if (error || !escrow) {
     console.error('[MultiSig] Error fetching escrow:', error);
     return null;
   }
   
   const buyerSigned = !!escrow.buyer_signed_at;
   const sellerSigned = !!escrow.seller_signed_at;
   const requiresMultiSig = escrow.requires_multi_sig ?? false;
   
   return {
     escrowId,
     requiresMultiSig,
     buyerSigned,
     sellerSigned,
     buyerSignedAt: escrow.buyer_signed_at ?? undefined,
     sellerSignedAt: escrow.seller_signed_at ?? undefined,
     canRelease: requiresMultiSig ? (buyerSigned && sellerSigned) : buyerSigned,
   };
 }
 
 /**
  * Record a party's signature for multi-sig release
  */
 export async function recordSignature(
   escrowId: string,
   signerAddress: string,
   role: 'buyer' | 'seller'
 ): Promise<SignatureResult> {
   try {
     // Get current escrow state
     const { data: escrow, error: fetchError } = await supabase
       .from('escrows')
       .select('*')
       .eq('id', escrowId)
       .maybeSingle();
     
     if (fetchError || !escrow) {
       return { success: false, signatureCount: 0, canRelease: false, error: 'Escrow not found' };
     }
     
     // Verify signer is the correct party
     const expectedAddress = role === 'buyer' ? escrow.buyer_address : escrow.seller_address;
     if (signerAddress !== expectedAddress) {
       return { 
         success: false, 
         signatureCount: 0, 
         canRelease: false, 
         error: `Signer address doesn't match ${role} address` 
       };
     }
     
     // Update signature timestamp
     const updateField = role === 'buyer' ? 'buyer_signed_at' : 'seller_signed_at';
     const now = new Date().toISOString();
     
     const { error: updateError } = await supabase
       .from('escrows')
       .update({ [updateField]: now })
       .eq('id', escrowId);
     
     if (updateError) {
       return { success: false, signatureCount: 0, canRelease: false, error: 'Failed to record signature' };
     }
     
     // Calculate new state
     const buyerSigned = role === 'buyer' ? true : !!escrow.buyer_signed_at;
     const sellerSigned = role === 'seller' ? true : !!escrow.seller_signed_at;
     const signatureCount = (buyerSigned ? 1 : 0) + (sellerSigned ? 1 : 0);
     const canRelease = escrow.requires_multi_sig ? (buyerSigned && sellerSigned) : buyerSigned;
     
     return {
       success: true,
       signatureCount,
       canRelease,
     };
   } catch (error) {
     console.error('[MultiSig] Error recording signature:', error);
     return {
       success: false,
       signatureCount: 0,
       canRelease: false,
       error: error instanceof Error ? error.message : 'Unknown error',
     };
   }
 }
 
 /**
  * Check if release is authorized (both parties signed for multi-sig)
  */
 export async function isReleaseAuthorized(escrowId: string): Promise<boolean> {
   const status = await getMultiSigStatus(escrowId);
   return status?.canRelease ?? false;
 }
 
 /**
  * Enable multi-sig requirement on an escrow
  */
 export async function enableMultiSig(escrowId: string): Promise<boolean> {
   const { error } = await supabase
     .from('escrows')
     .update({ requires_multi_sig: true })
     .eq('id', escrowId);
   
   return !error;
 }
 
 /**
  * Clear all signatures (for re-signing)
  */
 export async function clearSignatures(escrowId: string): Promise<boolean> {
   const { error } = await supabase
     .from('escrows')
     .update({ 
       buyer_signed_at: null, 
       seller_signed_at: null 
     })
     .eq('id', escrowId);
   
   return !error;
 }
 
 export const multiSigService = {
   getMultiSigStatus,
   recordSignature,
   isReleaseAuthorized,
   enableMultiSig,
   clearSignatures,
 };