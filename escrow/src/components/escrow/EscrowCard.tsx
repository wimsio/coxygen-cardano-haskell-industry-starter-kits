import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ArrowRight, User, Coins, Link2, Link2Off } from 'lucide-react';
import { EscrowDatum, UserRole } from '@/types/escrow';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, isPast } from 'date-fns';

interface EscrowCardProps {
  escrow: EscrowDatum;
  userRole: UserRole;
  index?: number;
}

const statusConfig = {
  pending: { label: 'Pending', class: 'status-pending' },
  active: { label: 'Active', class: 'status-active' },
  completed: { label: 'Completed', class: 'status-completed' },
  refunded: { label: 'Refunded', class: 'status-refunded' },
  expired: { label: 'Expired', class: 'status-refunded' },
};

const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const EscrowCard: React.FC<EscrowCardProps> = ({ escrow, userRole, index = 0 }) => {
  const status = statusConfig[escrow.status];
  const isDeadlinePassed = isPast(escrow.deadline);
  const counterparty = userRole === 'buyer' ? escrow.seller : escrow.buyer;
  const isFundedOnChain = !!escrow.utxoTxHash;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link
        to={`/escrow/${escrow.id}`}
        className="block glass-card p-5 hover:border-primary/50 transition-all duration-300 group"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={status.class}>
              {status.label}
            </Badge>
            <Badge variant="outline" className={isFundedOnChain ? 'status-completed' : 'status-pending'}>
              {isFundedOnChain ? <Link2 className="h-3 w-3 mr-1" /> : <Link2Off className="h-3 w-3 mr-1" />}
              {isFundedOnChain ? 'On-Chain' : 'Unfunded'}
            </Badge>
            <Badge variant="outline" className="text-muted-foreground border-border">
              {userRole === 'buyer' ? '🛒 Buyer' : '💰 Seller'}
            </Badge>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>

        <div className="space-y-3">
          {/* Amount */}
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold gradient-text">{escrow.amount.toLocaleString()} ₳</span>
          </div>

          {/* Description */}
          {escrow.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {escrow.description}
            </p>
          )}

          {/* Counterparty */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{userRole === 'buyer' ? 'Seller' : 'Buyer'}:</span>
            <span className="font-mono text-foreground">{formatAddress(counterparty)}</span>
          </div>

          {/* Deadline */}
          <div className="flex items-center gap-2 text-sm">
            <Clock className={`h-4 w-4 ${isDeadlinePassed ? 'text-destructive' : 'text-warning'}`} />
            <span className={isDeadlinePassed ? 'text-destructive' : 'text-muted-foreground'}>
              {isDeadlinePassed
                ? `Expired ${formatDistanceToNow(escrow.deadline)} ago`
                : `Expires in ${formatDistanceToNow(escrow.deadline)}`}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
