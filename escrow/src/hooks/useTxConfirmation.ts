// ============================================================================
// Transaction Confirmation Hook - Real-time tracking in React
// ============================================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  trackTransaction, 
  TxTrackingState, 
  TrackingOptions,
  getConfirmationText,
  estimateTimeToConfirmation,
  CONFIRMATION_THRESHOLDS,
} from '@/services/cardano';

export interface UseTxConfirmationOptions {
  requiredConfirmations?: number;
  pollIntervalMs?: number;
  maxPollTimeMs?: number;
  onConfirmed?: (state: TxTrackingState) => void;
  onError?: (error: string) => void;
}

export interface UseTxConfirmationReturn {
  /** Current tracking state */
  state: TxTrackingState | null;
  /** Whether currently tracking a transaction */
  isTracking: boolean;
  /** Start tracking a transaction */
  track: (txHash: string) => Promise<TxTrackingState>;
  /** Stop tracking */
  stop: () => void;
  /** Reset state */
  reset: () => void;
  /** Get human-readable confirmation text */
  getStatusText: () => string;
  /** Estimated seconds to confirmation */
  estimatedTimeSeconds: number;
}

/**
 * Hook for tracking transaction confirmations
 */
export function useTxConfirmation(
  options: UseTxConfirmationOptions = {}
): UseTxConfirmationReturn {
  const {
    requiredConfirmations = CONFIRMATION_THRESHOLDS.LOW_VALUE,
    pollIntervalMs = 5000,
    maxPollTimeMs = 300000,
    onConfirmed,
    onError,
  } = options;

  const [state, setState] = useState<TxTrackingState | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsTracking(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setState(null);
  }, [stop]);

  const track = useCallback(async (txHash: string): Promise<TxTrackingState> => {
    // Stop any existing tracking
    stop();

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    setIsTracking(true);

    const trackingOptions: TrackingOptions = {
      requiredConfirmations,
      pollIntervalMs,
      maxPollTimeMs,
      onUpdate: (newState) => {
        // Check if aborted
        if (abortControllerRef.current?.signal.aborted) return;
        
        setState(newState);

        // Call callbacks
        if (newState.level === 'confirmed' && onConfirmed) {
          onConfirmed(newState);
        }
        if (newState.error && onError) {
          onError(newState.error);
        }
      },
    };

    try {
      const finalState = await trackTransaction(txHash, trackingOptions);
      setIsTracking(false);
      return finalState;
    } catch (error) {
      setIsTracking(false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onError?.(errorMessage);
      throw error;
    }
  }, [requiredConfirmations, pollIntervalMs, maxPollTimeMs, onConfirmed, onError, stop]);

  const getStatusText = useCallback((): string => {
    if (!state) return 'Not tracking';
    return getConfirmationText(
      state.status.confirmations,
      state.requiredConfirmations
    );
  }, [state]);

  const estimatedTimeSeconds = state
    ? estimateTimeToConfirmation(
        state.status.confirmations,
        state.requiredConfirmations
      )
    : 0;

  return {
    state,
    isTracking,
    track,
    stop,
    reset,
    getStatusText,
    estimatedTimeSeconds,
  };
}
