export type EscrowStatus = 'pending' | 'active' | 'completed' | 'refunded' | 'expired';

export type UserRole = 'buyer' | 'seller';

export interface EscrowDatum {
  id: string;
  buyer: string;
  seller: string;
  amount: number; // in ADA (lovelace / 1_000_000)
  deadline: Date;
  status: EscrowStatus;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  utxoTxHash?: string | null;
  scriptAddress?: string | null;
  onChainStatus?: string | null;
}

export interface EscrowTransaction {
  id: string;
  escrowId: string;
  type: 'created' | 'funded' | 'released' | 'refunded' | 'expired';
  from: string;
  to?: string;
  amount?: number;
  timestamp: Date;
  txHash: string;
}

export interface CreateEscrowParams {
  seller: string;
  amount: number;
  deadline: Date;
  description?: string;
}

export interface WalletInfo {
  name: string;
  icon: string;
  address: string;
  balance: number; // in ADA
  connected: boolean;
  networkId?: number; // 0 = testnet, 1 = mainnet
}

export interface InstalledWallet {
  name: string;
  icon: string;
  apiVersion: string;
  isEnabled: boolean;
}

// Type for wallet options shown in the connect modal
export type CardanoWalletName = 'nami' | 'lace' | 'eternl' | 'flint' | 'yoroi' | 'typhon' | 'gerowallet';
