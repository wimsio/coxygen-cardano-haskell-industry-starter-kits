import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { 
  walletService, 
  WalletState, 
  InstalledWallet,
  lovelaceToAda,
  TARGET_NETWORK,
  CIP30WalletAPI,
} from '@/services/cardano';
import { toast } from 'sonner';

// Re-export types for compatibility
export type { WalletState, InstalledWallet };

/** Legacy WalletInfo for backward compatibility */
export interface WalletInfo {
  name: string;
  icon: string;
  address: string;
  balance: number; // in ADA
  connected: boolean;
  networkId: number;
}

interface WalletContextType {
  wallet: WalletInfo | null;
  walletApi: CIP30WalletAPI | null;
  walletState: WalletState;
  installedWallets: InstalledWallet[];
  isConnecting: boolean;
  connect: (walletName: string) => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  signTx: (txCbor: string, partialSign?: boolean) => Promise<string>;
  submitTx: (signedTxCbor: string) => Promise<string>;
  signData: (payload: string) => Promise<{ signature: string; key: string }>; 
}

const WalletContext = createContext<WalletContextType | null>(null);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [walletState, setWalletState] = useState<WalletState>(walletService.getState());
  const [installedWallets, setInstalledWallets] = useState<InstalledWallet[]>([]);

  // Subscribe to wallet service state changes
  useEffect(() => {
    const unsubscribe = walletService.subscribe(setWalletState);
    return unsubscribe;
  }, []);

  // Detect installed wallets on mount
  useEffect(() => {
    const detectWallets = () => {
      // Small delay to let wallet extensions inject
      setTimeout(() => {
        setInstalledWallets(walletService.getInstalledWallets());
      }, 100);
    };
    detectWallets();
    window.addEventListener('load', detectWallets);
    return () => window.removeEventListener('load', detectWallets);
  }, []);

  // Auto-reconnect on mount
  useEffect(() => {
    if (installedWallets.length > 0) {
      walletService.tryReconnect().catch(() => {
        // Silent fail for auto-reconnect
      });
    }
  }, [installedWallets]);

  const connect = useCallback(async (walletName: string) => {
    try {
      await walletService.connect(walletName);

      // Link wallet to profile if authenticated
      try {
        const { escrowApi } = await import('@/services/escrowApi');
        const state = walletService.getState();
        if (state.address) {
          await escrowApi.updateProfileWallet(state.address);
        }
      } catch {
        // Not critical — user may not be signed in
      }

      const networkName = TARGET_NETWORK.charAt(0).toUpperCase() + TARGET_NETWORK.slice(1);
      const balance = walletService.getBalanceAda();
      
      toast.success(`Connected to ${walletName}`, {
        description: `Network: ${networkName} | Balance: ${balance.toLocaleString()} ₳`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect wallet';
      toast.error('Connection Failed', { description: message });
      throw error;
    }
  }, []);

  const disconnect = useCallback(() => {
    walletService.disconnect();
    toast.info('Wallet disconnected');
  }, []);

  const refreshBalance = useCallback(async () => {
    await walletService.refreshBalance();
  }, []);

  const signTx = useCallback(async (txCbor: string, partialSign = false): Promise<string> => {
    return walletService.signTx(txCbor, partialSign);
  }, []);

  const submitTx = useCallback(async (signedTxCbor: string): Promise<string> => {
    return walletService.submitTx(signedTxCbor);
  }, []);

  const signData = useCallback(async (payload: string): Promise<{ signature: string; key: string }> => {
    return walletService.signData(payload);
  }, []);

  // Convert to legacy WalletInfo format for backward compatibility
  const wallet: WalletInfo | null = walletState.connected ? {
    name: walletState.walletName || '',
    icon: installedWallets.find(w => 
      w.name.toLowerCase() === walletState.walletName?.toLowerCase()
    )?.icon || '💳',
    address: walletState.address || '',
    balance: lovelaceToAda(walletState.balance),
    connected: true,
    networkId: walletState.networkId,
  } : null;

  return (
    <WalletContext.Provider
      value={{
        wallet,
        walletApi: walletState.api,
        walletState,
        installedWallets,
        isConnecting: walletState.connecting,
        connect,
        disconnect,
        refreshBalance,
        signTx,
        submitTx,
        signData,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
