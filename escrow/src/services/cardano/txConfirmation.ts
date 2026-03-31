// ============================================================================
// Transaction Confirmation Service - Real-time tx tracking
// ============================================================================

import { blockchainService } from './blockchainService';
import { TxStatus, CONFIRMATION_THRESHOLDS } from './types';

/** Confirmation level names */
export type ConfirmationLevel = 'pending' | 'submitted' | 'confirmed' | 'finalized';

/** Transaction tracking state */
export interface TxTrackingState {
  txHash: string;
  status: TxStatus;
  level: ConfirmationLevel;
  requiredConfirmations: number;
  progress: number; // 0-100
  explorerUrl: string;
  error?: string;
}

/** Tracking options */
export interface TrackingOptions {
  requiredConfirmations?: number;
  onUpdate?: (state: TxTrackingState) => void;
  pollIntervalMs?: number;
  maxPollTimeMs?: number;
}

/**
 * Get confirmation level from confirmation count
 */
function getConfirmationLevel(
  confirmations: number,
  required: number
): ConfirmationLevel {
  if (confirmations === 0) return 'submitted';
  if (confirmations >= CONFIRMATION_THRESHOLDS.CRITICAL) return 'finalized';
  if (confirmations >= required) return 'confirmed';
  return 'submitted';
}

/**
 * Calculate progress percentage
 */
function calculateProgress(confirmations: number, required: number): number {
  if (confirmations >= required) return 100;
  return Math.min(99, Math.floor((confirmations / required) * 100));
}

/**
 * Track a transaction until it reaches required confirmations
 */
export async function trackTransaction(
  txHash: string,
  options: TrackingOptions = {}
): Promise<TxTrackingState> {
  const {
    requiredConfirmations = CONFIRMATION_THRESHOLDS.LOW_VALUE,
    onUpdate,
    pollIntervalMs = 5000,
    maxPollTimeMs = 300000, // 5 minutes max
  } = options;

  const explorerUrl = blockchainService.getExplorerTxUrl(txHash);
  const startTime = Date.now();

  let currentState: TxTrackingState = {
    txHash,
    status: { confirmed: false, confirmations: 0 },
    level: 'pending',
    requiredConfirmations,
    progress: 0,
    explorerUrl,
  };

  // Notify initial state
  onUpdate?.(currentState);

  while (Date.now() - startTime < maxPollTimeMs) {
    try {
      const status = await blockchainService.getTxStatus(txHash);
      const level = getConfirmationLevel(status.confirmations, requiredConfirmations);
      const progress = calculateProgress(status.confirmations, requiredConfirmations);

      currentState = {
        ...currentState,
        status,
        level,
        progress,
        error: undefined,
      };

      onUpdate?.(currentState);

      // Check if we've reached required confirmations
      if (status.confirmations >= requiredConfirmations) {
        currentState.level = 'confirmed';
        currentState.progress = 100;
        onUpdate?.(currentState);
        return currentState;
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));

    } catch (error) {
      currentState = {
        ...currentState,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      onUpdate?.(currentState);
      
      // Continue polling on error - tx might just not be visible yet
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }
  }

  // Timeout reached
  currentState.error = 'Transaction confirmation timeout';
  onUpdate?.(currentState);
  return currentState;
}

/**
 * Quick check if transaction is confirmed
 */
export async function isConfirmed(
  txHash: string,
  minConfirmations = 1
): Promise<boolean> {
  const status = await blockchainService.getTxStatus(txHash);
  return status.confirmations >= minConfirmations;
}

/**
 * Get human-readable confirmation status
 */
export function getConfirmationText(
  confirmations: number,
  required: number
): string {
  if (confirmations === 0) {
    return 'Waiting for confirmation...';
  }
  if (confirmations < required) {
    return `${confirmations}/${required} confirmations`;
  }
  if (confirmations >= CONFIRMATION_THRESHOLDS.CRITICAL) {
    return 'Finalized';
  }
  return 'Confirmed';
}

/**
 * Calculate estimated time to confirmation
 */
export function estimateTimeToConfirmation(
  currentConfirmations: number,
  requiredConfirmations: number,
  avgBlockTimeSeconds = 20 // Cardano ~20s block time
): number {
  const remaining = Math.max(0, requiredConfirmations - currentConfirmations);
  return remaining * avgBlockTimeSeconds;
}
