import React from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, RotateCcw, Clock, Coins, ExternalLink } from 'lucide-react';
import { EscrowTransaction } from '@/types/escrow';
import { format } from 'date-fns';

interface TransactionTimelineProps {
  transactions: EscrowTransaction[];
}

const transactionConfig = {
  created: { icon: Coins, color: 'text-muted-foreground', bg: 'bg-muted' },
  funded: { icon: Coins, color: 'text-primary', bg: 'bg-primary/20' },
  released: { icon: Check, color: 'text-success', bg: 'bg-success/20' },
  refunded: { icon: RotateCcw, color: 'text-warning', bg: 'bg-warning/20' },
  expired: { icon: Clock, color: 'text-destructive', bg: 'bg-destructive/20' },
};

const formatAddress = (address: string) => {
  if (address === 'escrow_script') return 'Escrow Contract';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const TransactionTimeline: React.FC<TransactionTimelineProps> = ({ transactions }) => {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No transactions yet
      </div>
    );
  }

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="space-y-4">
      {sortedTransactions.map((tx, index) => {
        const config = transactionConfig[tx.type];
        const Icon = config.icon;

        return (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex gap-4"
          >
            {/* Icon */}
            <div className={`flex-shrink-0 h-10 w-10 rounded-full ${config.bg} flex items-center justify-center`}>
              <Icon className={`h-5 w-5 ${config.color}`} />
            </div>

            {/* Content */}
            <div className="flex-1 glass-card p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold capitalize">{tx.type}</h4>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(tx.timestamp), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
                {tx.amount && (
                  <span className={`font-semibold ${tx.type === 'refunded' ? 'text-warning' : 'text-primary'}`}>
                    {tx.type === 'refunded' ? '+' : ''}{tx.amount.toLocaleString()} ₳
                  </span>
                )}
              </div>

              {/* From/To */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-mono">{formatAddress(tx.from)}</span>
                {tx.to && (
                  <>
                    <ArrowRight className="h-4 w-4" />
                    <span className="font-mono">{formatAddress(tx.to)}</span>
                  </>
                )}
              </div>

              {/* Tx Hash */}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Tx:</span>
                <a
                  href={`https://preprod.cardanoscan.io/transaction/${tx.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-primary hover:underline flex items-center gap-1"
                >
                  {tx.txHash.slice(0, 16)}...
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
