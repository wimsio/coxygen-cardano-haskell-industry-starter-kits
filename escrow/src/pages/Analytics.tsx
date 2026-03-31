import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Coins,
  CheckCircle,
  RotateCcw,
  Clock,
  ArrowRight,
  Loader2,
  Wallet,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import { WalletConnectModal } from '@/components/wallet/WalletConnectModal';
import { escrowApi } from '@/services/escrowApi';
import { lovelaceToAda } from '@/services/lucidService';
import { format, subDays, startOfDay, isWithinInterval } from 'date-fns';

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
}

type TimeRange = '7d' | '30d' | '90d' | 'all';

const COLORS = {
  active: 'hsl(var(--primary))',
  completed: 'hsl(var(--success))',
  refunded: 'hsl(var(--warning))',
  disputed: 'hsl(var(--destructive))',
};

export const Analytics: React.FC = () => {
  const { wallet } = useWallet();
  const { user } = useAuth();
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [escrows, setEscrows] = useState<DbEscrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const data = await escrowApi.getEscrows();
        setEscrows(data);
      } catch (error) {
        console.error('Failed to fetch escrows:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const filteredEscrows = useMemo(() => {
    if (timeRange === 'all') return escrows;

    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = startOfDay(subDays(new Date(), days));

    return escrows.filter(e => new Date(e.created_at) >= startDate);
  }, [escrows, timeRange]);

  const stats = useMemo(() => {
    const totalVolume = filteredEscrows.reduce(
      (sum, e) => sum + lovelaceToAda(BigInt(e.amount)),
      0
    );
    const completed = filteredEscrows.filter(e => e.status === 'completed');
    const refunded = filteredEscrows.filter(e => e.status === 'refunded');
    const active = filteredEscrows.filter(e => e.status === 'active');

    const completedVolume = completed.reduce(
      (sum, e) => sum + lovelaceToAda(BigInt(e.amount)),
      0
    );

    const successRate = filteredEscrows.length > 0
      ? (completed.length / (completed.length + refunded.length)) * 100 || 0
      : 0;

    const avgAmount = filteredEscrows.length > 0
      ? totalVolume / filteredEscrows.length
      : 0;

    return {
      totalEscrows: filteredEscrows.length,
      totalVolume,
      completedVolume,
      activeCount: active.length,
      completedCount: completed.length,
      refundedCount: refunded.length,
      successRate,
      avgAmount,
    };
  }, [filteredEscrows]);

  const chartData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayEscrows = escrows.filter(e =>
        isWithinInterval(new Date(e.created_at), { start: dayStart, end: dayEnd })
      );

      const volume = dayEscrows.reduce(
        (sum, e) => sum + lovelaceToAda(BigInt(e.amount)),
        0
      );

      data.push({
        date: format(date, timeRange === '7d' ? 'EEE' : 'MMM d'),
        volume,
        count: dayEscrows.length,
      });
    }

    return data;
  }, [escrows, timeRange]);

  const pieData = useMemo(() => [
    { name: 'Active', value: stats.activeCount, color: COLORS.active },
    { name: 'Completed', value: stats.completedCount, color: COLORS.completed },
    { name: 'Refunded', value: stats.refundedCount, color: COLORS.refunded },
  ].filter(d => d.value > 0), [stats]);

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
              <BarChart3 className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-4">
              {!user ? 'Sign In Required' : 'Connect Your Wallet'}
            </h1>
            <p className="text-muted-foreground mb-6">
              {!user
                ? 'Sign in to view your escrow analytics.'
                : 'Connect a Cardano wallet to view your analytics.'}
            </p>
            {!user ? (
              <Link to="/auth">
                <Button className="btn-gradient gap-2">Sign In</Button>
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
          <p className="text-muted-foreground">Loading analytics...</p>
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
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              Analytics
            </h1>
            <p className="text-muted-foreground">Track your escrow performance</p>
          </div>

          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <TabsList className="bg-muted/50">
              <TabsTrigger value="7d">7 Days</TabsTrigger>
              <TabsTrigger value="30d">30 Days</TabsTrigger>
              <TabsTrigger value="90d">90 Days</TabsTrigger>
              <TabsTrigger value="all">All Time</TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Coins className="h-4 w-4" />
                Total Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold gradient-text">
                {stats.totalVolume.toLocaleString()} ₳
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalEscrows} escrows
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-success">
                {stats.completedVolume.toLocaleString()} ₳
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.completedCount} successful
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {stats.successRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Completion rate
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">
                {stats.activeCount}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                In progress
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Volume Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Volume Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="date"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickFormatter={(v) => `${v}₳`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [`${value.toLocaleString()} ₳`, 'Volume']}
                      />
                      <Area
                        type="monotone"
                        dataKey="volume"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#volumeGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Status Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass-card h-full">
              <CardHeader>
                <CardTitle className="text-lg">Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
                <div className="flex justify-center gap-4 mt-4">
                  {pieData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {entry.name} ({entry.value})
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 glass-card p-6"
        >
          <h3 className="font-semibold mb-4">Quick Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Coins className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Escrow Size</p>
                <p className="font-semibold">{stats.avgAmount.toFixed(2)} ₳</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
              <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="font-semibold">{stats.completedCount} escrows</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
              <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
                <RotateCcw className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Refunded</p>
                <p className="font-semibold">{stats.refundedCount} escrows</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Analytics;
