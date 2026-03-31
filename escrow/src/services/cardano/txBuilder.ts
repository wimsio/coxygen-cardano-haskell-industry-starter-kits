// ============================================================================
// Transaction Builder Service – Native Script escrow via edge function
// ============================================================================

import { supabase } from '@/integrations/supabase/client';

/** Result from the edge-function tx builder */
export interface TxBuildResult {
  success: boolean;
  txCbor?: string;
  originalWitnessCbor?: string;
  error?: string;
  scriptAddress?: string;
  scriptOutputIndex?: number;
}

// ============================================================================
// CIP-30 wallet shape (subset we need)
// ============================================================================

interface WalletApi {
  getUtxos: (amount?: string) => Promise<string[] | null>;
  getCollateral?: () => Promise<string[] | null>;
  getChangeAddress: () => Promise<string>;
  signTx: (tx: string, partialSign?: boolean) => Promise<string>;
  submitTx: (tx: string) => Promise<string>;
}

// ============================================================================
// Low-level: call the edge function
// ============================================================================

async function callTxBuilder(params: Record<string, unknown>): Promise<TxBuildResult> {
  const { data, error } = await supabase.functions.invoke('cardano-tx-builder', {
    body: params,
  });

  if (error) {
    console.error('[TxBuilder] Edge function error:', error);
    const parts: string[] = [];
    if (error.message) parts.push(error.message);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyErr = error as any;
    if (anyErr.details) parts.push(String(anyErr.details));
    if (anyErr.status) parts.push(`status=${anyErr.status}`);

    return { success: false, error: parts.filter(Boolean).join(' — ') || 'Edge function error' };
  }

  return data as TxBuildResult;
}

// ============================================================================
// Slot conversion – Preprod genesis parameters
// ============================================================================

// Preprod shelley genesis: slot 0 = 2022-04-01T00:00:00Z, 1 slot = 1 second
const PREPROD_SHELLEY_START_UNIX_MS = 1654041600000; // 2022-06-01T00:00:00Z (shelley start on preprod)
const PREPROD_SHELLEY_START_SLOT = 0;
const SLOT_LENGTH_MS = 1000;

/**
 * Convert a JS Date to a Cardano Preprod slot number.
 */
function dateToSlot(date: Date): number {
  const diffMs = date.getTime() - PREPROD_SHELLEY_START_UNIX_MS;
  return PREPROD_SHELLEY_START_SLOT + Math.floor(diffMs / SLOT_LENGTH_MS);
}

// ============================================================================
// FUND – buyer sends ADA to the escrow script
// ============================================================================

export async function executeEscrowFund(
  walletApi: WalletApi,
  params: {
    buyerAddress: string;
    sellerAddress: string;
    amount: bigint;
    deadline: Date;
  }
): Promise<{ success: boolean; txHash?: string; outputIndex?: number; scriptAddress?: string; error?: string }> {
  try {
    const deadlineSlot = dateToSlot(params.deadline);

    const buildResult = await callTxBuilder({
      action: 'buildFundTx',
      buyerAddress: params.buyerAddress,
      sellerAddress: params.sellerAddress,
      amount: params.amount.toString(),
      deadlineSlot,
    });

    if (!buildResult.success || !buildResult.txCbor) {
      return { success: false, error: buildResult.error || 'Failed to build transaction' };
    }

    const txHash = await signAndSubmit(walletApi, buildResult.txCbor, false, undefined);
    return {
      success: true,
      txHash,
      outputIndex: buildResult.scriptOutputIndex ?? 0,
      scriptAddress: buildResult.scriptAddress,
    };
  } catch (error) {
    console.error('[TxBuilder] Fund error:', error);
    return { success: false, error: errorMsg(error) };
  }
}

// ============================================================================
// RELEASE – Step 1: Buyer initiates, signs partially, returns witness
// ============================================================================

export async function initiateEscrowRelease(
  walletApi: WalletApi,
  params: {
    buyerAddress: string;
    sellerAddress: string;
    deadline: Date;
    escrowUtxoTxHash: string;
    escrowUtxoIndex: number;
  }
): Promise<{ success: boolean; unsignedTxCbor?: string; buyerWitness?: string; scriptWitness?: string; error?: string }> {
  try {
    const deadlineSlot = dateToSlot(params.deadline);

    const buildResult = await callTxBuilder({
      action: 'buildReleaseTx',
      buyerAddress: params.buyerAddress,
      sellerAddress: params.sellerAddress,
      escrowUtxoTxHash: params.escrowUtxoTxHash,
      escrowUtxoIndex: params.escrowUtxoIndex,
      deadlineSlot,
    });

    if (!buildResult.success || !buildResult.txCbor) {
      return { success: false, error: buildResult.error || 'Failed to build transaction' };
    }

    // Buyer signs partially
    const buyerWitness = await walletApi.signTx(buildResult.txCbor, true);

    return {
      success: true,
      unsignedTxCbor: buildResult.txCbor,
      buyerWitness,
      scriptWitness: buildResult.originalWitnessCbor,
    };
  } catch (error) {
    console.error('[TxBuilder] Initiate release error:', error);
    return { success: false, error: errorMsg(error) };
  }
}

// ============================================================================
// RELEASE – Step 2: Seller co-signs and submits
// ============================================================================

export async function completeEscrowRelease(
  walletApi: WalletApi,
  params: {
    unsignedTxCbor: string;
    buyerWitness: string;
    scriptWitness: string;
  }
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    // Seller signs partially
    const sellerWitness = await walletApi.signTx(params.unsignedTxCbor, true);

    // Merge all witnesses: buyer vkeys + seller vkeys + script witnesses
    const mergedWalletWitness = mergeVkeyWitnesses(params.buyerWitness, sellerWitness);
    const signedTxHex = assembleTx(params.unsignedTxCbor, mergedWalletWitness, params.scriptWitness);

    const txHash = await walletApi.submitTx(signedTxHex);
    return { success: true, txHash };
  } catch (error) {
    console.error('[TxBuilder] Complete release error:', error);
    return { success: false, error: errorMsg(error) };
  }
}

// Legacy single-step release (kept for compatibility)
export async function executeEscrowRelease(
  walletApi: WalletApi,
  params: {
    buyerAddress: string;
    sellerAddress: string;
    deadline: Date;
    escrowUtxoTxHash: string;
    escrowUtxoIndex: number;
  }
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  return executeSpend(walletApi, params, 'buildReleaseTx');
}

// ============================================================================
// REFUND – buyer reclaims funds after deadline
// ============================================================================

export async function executeEscrowRefund(
  walletApi: WalletApi,
  params: {
    buyerAddress: string;
    sellerAddress: string;
    deadline: Date;
    escrowUtxoTxHash: string;
    escrowUtxoIndex: number;
  }
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  return executeSpend(walletApi, params, 'buildRefundTx');
}

// ============================================================================
// Shared spend logic (release / refund)
// ============================================================================

async function executeSpend(
  walletApi: WalletApi,
  params: {
    buyerAddress: string;
    sellerAddress: string;
    deadline: Date;
    escrowUtxoTxHash: string;
    escrowUtxoIndex: number;
  },
  action: 'buildReleaseTx' | 'buildRefundTx'
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const deadlineSlot = dateToSlot(params.deadline);

    const buildResult = await callTxBuilder({
      action,
      buyerAddress: params.buyerAddress,
      sellerAddress: params.sellerAddress,
      escrowUtxoTxHash: params.escrowUtxoTxHash,
      escrowUtxoIndex: params.escrowUtxoIndex,
      deadlineSlot,
    });

    if (!buildResult.success || !buildResult.txCbor) {
      return { success: false, error: buildResult.error || 'Failed to build transaction' };
    }

    const partialSign = action === 'buildReleaseTx';
    const txHash = await signAndSubmit(walletApi, buildResult.txCbor, partialSign, buildResult.originalWitnessCbor);
    return { success: true, txHash };
  } catch (error) {
    console.error('[TxBuilder] Spend error:', error);
    return { success: false, error: errorMsg(error) };
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Merge two CIP-30 vkey witness sets.
 * Each witness is: a1 00 <cbor array of vkey witnesses>
 * Each vkey witness item is: 82 5820 <32B pubkey> 5840 <64B sig> = 198 hex chars
 */
function mergeVkeyWitnesses(witness1Hex: string, witness2Hex: string): string {
  // Extract vkey array hex (skip "a1" map header + "00" key)
  const arr1Hex = witness1Hex.slice(4);
  const arr2Hex = witness2Hex.slice(4);

  const vkeys1 = extractCborArrayItems(arr1Hex);
  const vkeys2 = extractCborArrayItems(arr2Hex);
  const allVkeys = [...vkeys1, ...vkeys2];

  // Rebuild: a1 00 <definite array>
  const arrayHeader = (0x80 + allVkeys.length).toString(16).padStart(2, '0');
  return 'a1' + '00' + arrayHeader + allVkeys.join('');
}

function extractCborArrayItems(arrayHex: string): string[] {
  const items: string[] = [];
  const header = parseInt(arrayHex.slice(0, 2), 16);

  if ((header & 0xf0) === 0x80) {
    const count = header & 0x0f;
    let offset = 2;
    for (let i = 0; i < count; i++) {
      items.push(arrayHex.slice(offset, offset + 198));
      offset += 198;
    }
  } else if (header === 0x9f) {
    let offset = 2;
    while (arrayHex.slice(offset, offset + 2) !== 'ff') {
      items.push(arrayHex.slice(offset, offset + 198));
      offset += 198;
    }
  }
  return items;
}

/**
 * CIP-30 signTx returns only the witness set (not a full tx).
 * Splice it into the original unsigned tx via raw hex manipulation.
 */
function assembleTx(unsignedCborHex: string, witnessSetHex: string, originalWitnessCbor?: string): string {
  const tail = 'a0f5f6';
  if (!unsignedCborHex.endsWith(tail)) {
    throw new Error('Unexpected unsigned tx CBOR format');
  }
  const prefix = unsignedCborHex.slice(0, -tail.length);

  if (!originalWitnessCbor) {
    return prefix + witnessSetHex + 'f5f6';
  }

  const walletMapCount = parseInt(witnessSetHex.slice(0, 2), 16) - 0xa0;
  const origMapCount = parseInt(originalWitnessCbor.slice(0, 2), 16) - 0xa0;
  const totalCount = walletMapCount + origMapCount;
  const mergedHeader = (0xa0 + totalCount).toString(16).padStart(2, '0');
  const mergedWitness = mergedHeader + witnessSetHex.slice(2) + originalWitnessCbor.slice(2);

  return prefix + mergedWitness + 'f5f6';
}

/**
 * Sign with wallet, assemble, and submit. Returns the tx hash.
 */
async function signAndSubmit(
  walletApi: WalletApi,
  unsignedCborHex: string,
  partialSign: boolean,
  nativeScriptsCbor?: string,
): Promise<string> {
  const witnessSetHex = await walletApi.signTx(unsignedCborHex, partialSign);
  const signedTxHex = assembleTx(unsignedCborHex, witnessSetHex, nativeScriptsCbor);
  return await walletApi.submitTx(signedTxHex);
}

function errorMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Transaction failed';
}

export const txBuilderService = {
  executeEscrowFund,
  executeEscrowRelease,
  executeEscrowRefund,
  initiateEscrowRelease,
  completeEscrowRelease,
};
