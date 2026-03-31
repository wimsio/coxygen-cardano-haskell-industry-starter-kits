// ============================================================================
// Transaction Confirmation UI Component
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, CheckCircle, Loader2, AlertCircle, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { TxTrackingState, ConfirmationLevel } from '@/services/cardano';

interface TxConfirmationCardProps {
  state: TxTrackingState;
  onClose?: () => void;
}

const levelConfig: Record<ConfirmationLevel, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  label: string;
}> = {
  pending: {
    icon: Clock,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
    label: 'Pending',
  },
  submitted: {
    icon: Loader2,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    label: 'Submitted',
  },
  confirmed: {
    icon: CheckCircle,
    color: 'text-success',
    bgColor: 'bg-success/10',
    label: 'Confirmed',
  },
  finalized: {
    icon: CheckCircle,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    label: 'Finalized',
  },
};

export const TxConfirmationCard: React.FC<TxConfirmationCardProps> = ({
  state,
  onClose,
}) => {
  const config = levelConfig[state.level];
  const Icon = config.icon;
  const isAnimating = state.level === 'submitted' || state.level === 'pending';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="glass-card p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${config.bgColor}`}>
            <Icon 
              className={`h-4 w-4 ${config.color} ${isAnimating ? 'animate-spin' : ''}`} 
            />
          </div>
          <div>
            <p className="font-medium">{config.label}</p>
            <p className="text-xs text-muted-foreground font-mono">
              {state.txHash.slice(0, 16)}...{state.txHash.slice(-8)}
            </p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => window.open(state.explorerUrl, '_blank')}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {state.status.confirmations}/{state.requiredConfirmations} confirmations
          </span>
          <span>{state.progress}%</span>
        </div>
        <Progress value={state.progress} className="h-2" />
      </div>

      {/* Block info */}
      {state.status.block && (
        <p className="text-xs text-muted-foreground">
          Block: {state.status.block.slice(0, 16)}...
        </p>
      )}

      {/* Error */}
      {state.error && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{state.error}</span>
        </div>
      )}

      {/* Close button when confirmed */}
      {(state.level === 'confirmed' || state.level === 'finalized') && onClose && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onClose}
        >
          Close
        </Button>
      )}
    </motion.div>
  );
};

/** Inline confirmation badge */
export const TxConfirmationBadge: React.FC<{
  confirmations: number;
  required: number;
}> = ({ confirmations, required }) => {
  const isConfirmed = confirmations >= required;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
      isConfirmed 
        ? 'bg-success/10 text-success' 
        : 'bg-warning/10 text-warning'
    }`}>
      {isConfirmed ? (
        <>
          <CheckCircle className="h-3 w-3" />
          Confirmed
        </>
      ) : (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          {confirmations}/{required}
        </>
      )}
    </span>
  );
};
