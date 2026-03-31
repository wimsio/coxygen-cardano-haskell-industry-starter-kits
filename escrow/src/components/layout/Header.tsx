import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wallet, ChevronDown, LogOut, Copy, Check, User, LogIn, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import { WalletConnectModal } from '@/components/wallet/WalletConnectModal';
import { useToast } from '@/hooks/use-toast';

const formatAddress = (address: string) => {
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
};

const formatAda = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const Header: React.FC = () => {
  const { wallet, disconnect: disconnectWallet } = useWallet();
  const { user, signOut, loading: authLoading } = useAuth();
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCopyAddress = () => {
    if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      toast({
        title: 'Address copied',
        description: 'Wallet address copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    disconnectWallet();
    toast({
      title: 'Signed out',
      description: 'You have been signed out successfully.',
    });
    navigate('/');
  };

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/create', label: 'Create Escrow' },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 glass-card border-t-0 rounded-t-none"
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">₳</span>
            </div>
            <span className="font-bold text-xl gradient-text">CardanoEscrow</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === link.path
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth & Wallet */}
          <div className="flex items-center gap-2">
            {/* Auth Status */}
            {!authLoading && (
              user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline text-xs truncate max-w-[100px]">
                        {user.email}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="glass-card">
                    <div className="px-2 py-1.5">
                      <p className="text-xs text-muted-foreground">Signed in as</p>
                      <p className="text-sm font-medium truncate">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <LogIn className="h-4 w-4" />
                    <span className="hidden sm:inline">Sign In</span>
                  </Button>
                </Link>
              )
            )}

            {/* Wallet Connection */}
            {wallet ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="glass-card gap-2 border-primary/30 hover:border-primary/50">
                    <div className="h-6 w-6 rounded overflow-hidden flex items-center justify-center">
                      {wallet.icon.startsWith('data:') || wallet.icon.startsWith('http') ? (
                        <img src={wallet.icon} alt={wallet.name} className="w-5 h-5" />
                      ) : (
                        <span className="text-lg">{wallet.icon}</span>
                      )}
                    </div>
                    <div className="text-left hidden sm:block">
                      <div className="text-xs text-muted-foreground capitalize">{wallet.name}</div>
                      <div className="text-sm font-mono">{formatAddress(wallet.address)}</div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="text-sm font-semibold text-primary">{formatAda(wallet.balance)} ₳</div>
                      {wallet.networkId !== undefined && (
                        <div className={`text-[10px] ${wallet.networkId === 1 ? 'text-success' : 'text-warning'}`}>
                          {wallet.networkId === 1 ? 'Mainnet' : 'Testnet'}
                        </div>
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass-card">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{wallet.name} Wallet</p>
                    <p className="text-xs text-muted-foreground font-mono">{formatAddress(wallet.address)}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleCopyAddress} className="cursor-pointer">
                    {copied ? (
                      <Check className="mr-2 h-4 w-4 text-success" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    Copy Address
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={disconnectWallet} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Disconnect Wallet
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => setConnectModalOpen(true)}
                className="btn-gradient gap-2"
              >
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">Connect Wallet</span>
              </Button>
            )}
          </div>
        </div>
      </motion.header>

      <WalletConnectModal open={connectModalOpen} onOpenChange={setConnectModalOpen} />
    </>
  );
};
