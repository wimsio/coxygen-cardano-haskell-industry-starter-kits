import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Wallet, LayoutGrid, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import { EscrowCard } from '@/components/escrow/EscrowCard';
import { WalletConnectModal } from '@/components/wallet/WalletConnectModal';
import { escrowApi } from '@/services/escrowApi';
import { lovelaceToAda } from '@/services/lucidService';
import { UserRole } from '@/types/escrow';
import { useToast } from '@/hooks/use-toast';

type FilterTab = 'all' | 'buyer' | 'seller';
type StatusFilter = 'all' | 'active' | 'completed' | 'refunded';

interface DbEscrow {
  id: string;
  buyer_address: string;
  seller_address: string;
  amount: number;
  deadline: string;
  status: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  buyer_user_id: string | null;
  seller_user_id: string | null;
}

// Transform DB escrow to display format
const transformEscrow = (dbEscrow: DbEscrow) => ({
  id: dbEscrow.id,
  buyer: dbEscrow.buyer_address,
  seller: dbEscrow.seller_address,
  amount: lovelaceToAda(BigInt(dbEscrow.amount)),
  deadline: new Date(dbEscrow.deadline),
  status: dbEscrow.status as 'active' | 'completed' | 'refunded',
  description: dbEscrow.description || undefined,
  createdAt: new Date(dbEscrow.created_at),
  updatedAt: new Date(dbEscrow.updated_at),
});

export const Dashboard: React.FC = () => {
  const { wallet } = useWallet();
  const { user } = useAuth();
  const { toast } = useToast();
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<FilterTab>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [escrows, setEscrows] = useState<ReturnType<typeof transformEscrow>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEscrows = async () => {
      if (!user) {
        setEscrows([]);
        setLoading(false);
        return;
      }

      try {
        const data = await escrowApi.getEscrows();
        setEscrows(data.map(transformEscrow));
      } catch (error) {
        console.error('Failed to fetch escrows:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to load escrows',
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEscrows();
  }, [user, toast]);

  const filteredEscrows = useMemo(() => {
    return escrows.filter(escrow => {
      // Role filter
      if (roleFilter === 'buyer' && escrow.buyer !== wallet?.address) return false;
      if (roleFilter === 'seller' && escrow.seller !== wallet?.address) return false;
      
      // Status filter
      if (statusFilter !== 'all' && escrow.status !== statusFilter) return false;
      
      return true;
    });
  }, [escrows, roleFilter, statusFilter, wallet?.address]);

  const stats = useMemo(() => {
    const asBuyer = escrows.filter(e => e.buyer === wallet?.address);
    const asSeller = escrows.filter(e => e.seller === wallet?.address);
    const active = escrows.filter(e => e.status === 'active');
    const totalLocked = active.reduce((sum, e) => sum + e.amount, 0);

    return {
      total: escrows.length,
      asBuyer: asBuyer.length,
      asSeller: asSeller.length,
      active: active.length,
      totalLocked,
    };
  }, [escrows, wallet?.address]);

  const getUserRole = (escrow: ReturnType<typeof transformEscrow>): UserRole => {
    return escrow.buyer === wallet?.address ? 'buyer' : 'seller';
  };

  if (!wallet || !user) {
    return (
      <div className="min-h-screen pt-16">
        <div className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md mx-auto"
          >
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Wallet className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-4">
              {!user ? 'Sign In Required' : 'Connect Your Wallet'}
            </h1>
            <p className="text-muted-foreground mb-6">
              {!user 
                ? 'Sign in to view and manage your escrow contracts.'
                : 'Connect a Cardano wallet to view and manage your escrow contracts.'}
            </p>
            {!user ? (
              <Link to="/auth">
                <Button className="btn-gradient gap-2">
                  Sign In
                </Button>
              </Link>
            ) : (
              <Button
                onClick={() => setConnectModalOpen(true)}
                className="btn-gradient gap-2"
              >
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </Button>
            )}
          </motion.div>
        </div>
        <WalletConnectModal open={connectModalOpen} onOpenChange={setConnectModalOpen} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading escrows...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold">Escrow Dashboard</h1>
            <p className="text-muted-foreground">Manage your escrow contracts</p>
          </div>
          <Link to="/create">
            <Button className="btn-gradient gap-2">
              <Plus className="h-4 w-4" />
              Create Escrow
            </Button>
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="glass-card p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Escrows</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-sm text-muted-foreground mb-1">Active</p>
            <p className="text-2xl font-bold text-primary">{stats.active}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-sm text-muted-foreground mb-1">As Buyer</p>
            <p className="text-2xl font-bold">{stats.asBuyer}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Locked</p>
            <p className="text-2xl font-bold gradient-text">{stats.totalLocked.toLocaleString()} ₳</p>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6"
        >
          <Tabs value={roleFilter} onValueChange={(v) => setRoleFilter(v as FilterTab)}>
            <TabsList className="bg-muted/50">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="buyer">As Buyer</TabsTrigger>
              <TabsTrigger value="seller">As Seller</TabsTrigger>
            </TabsList>
          </Tabs>

          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <TabsList className="bg-muted/50">
              <TabsTrigger value="all">All Status</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="refunded">Refunded</TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Escrow List */}
        {filteredEscrows.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <LayoutGrid className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No escrows found</h3>
            <p className="text-muted-foreground mb-6">
              {escrows.length === 0
                ? "You haven't created or received any escrows yet."
                : "No escrows match your current filters."}
            </p>
            {escrows.length === 0 && (
              <Link to="/create">
                <Button className="btn-gradient gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Escrow
                </Button>
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEscrows.map((escrow, index) => (
              <EscrowCard
                key={escrow.id}
                escrow={escrow}
                userRole={getUserRole(escrow)}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
