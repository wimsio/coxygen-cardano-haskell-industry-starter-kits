// ============================================================================
// Cardano Escrow Service - Production-grade Blockfrost integration
// Re-exports from new modular architecture for backward compatibility
// ============================================================================

import { 
  blockchainService,
  walletService,
  adaToLovelace as _adaToLovelace,
  lovelaceToAda as _lovelaceToAda,
  TARGET_NETWORK,
  CIP30WalletAPI,
  UTxO,
} from './cardano';

// Import Plutus script configuration
import { 
  getScriptBase64, 
  getScriptAddress, 
  getScriptVerificationStatus,
  isScriptDeployed,
} from './cardano/scriptRegistry';

// Re-export types
export type { CIP30WalletAPI, UTxO };

// Re-export script utilities
export { 
  getScriptBase64, 
  getScriptAddress, 
  getScriptVerificationStatus,
  isScriptDeployed,
};

export interface LucidConfig {
  network: 'Mainnet' | 'Preprod' | 'Preview';
  blockfrostApiKey?: string;
  blockfrostUrl?: string;
}

export const PREPROD_CONFIG: LucidConfig = {
  network: 'Preprod',
  blockfrostUrl: 'https://cardano-preprod.blockfrost.io/api/v0',
};

export interface EscrowParams {
  sellerAddress: string;
  amount: bigint;
  deadline: Date;
}

export interface EscrowDatum {
  buyer: string;
  seller: string;
  deadline: bigint;
}

/**
 * @deprecated Use blockchainService and walletService directly
 */
class LucidService {
  private initialized = false;
  private connectedAddress: string | null = null;
  private walletApi: CIP30WalletAPI | null = null;
  private network: 'Mainnet' | 'Preprod' | 'Preview' = 'Preprod';

  async initialize(config: LucidConfig): Promise<void> {
    console.log(`[LucidService] Initializing for ${config.network}...`);
    this.network = config.network;
    this.initialized = true;
  }

  async connectWallet(walletApi: unknown): Promise<string> {
    this.walletApi = walletApi as CIP30WalletAPI;
    
    try {
      const addresses = await this.walletApi.getUsedAddresses();
      const changeAddress = await this.walletApi.getChangeAddress();
      this.connectedAddress = addresses[0] || changeAddress;
      
      console.log('[LucidService] Connected to wallet:', this.connectedAddress?.slice(0, 20) + '...');
      return this.connectedAddress;
    } catch (error) {
      console.error('[LucidService] Wallet connection error:', error);
      throw error;
    }
  }

  async getUtxos(address: string): Promise<UTxO[]> {
    const utxos = await blockchainService.getUtxos(address);
    // Map to legacy format
    return utxos.map(u => ({
      txHash: u.txHash,
      outputIndex: u.outputIndex,
      address: u.address,
      lovelace: u.lovelace,
      assets: u.assets,
      datum: u.datum,
    }));
  }

  async getProtocolParams() {
    return blockchainService.getProtocolParams();
  }

  async createEscrow(params: EscrowParams): Promise<string> {
    if (!this.walletApi || !this.connectedAddress) {
      throw new Error('Wallet not connected');
    }

    console.log('[LucidService] Creating escrow:', {
      seller: params.sellerAddress.slice(0, 20) + '...',
      amount: `${Number(params.amount) / 1_000_000} ADA`,
      deadline: params.deadline.toISOString(),
    });

    // Note: Full escrow tx building requires Cardano serialization libraries
    // The wallet connection and Blockfrost integration are ready
    throw new Error(
      'Full escrow transaction building requires Cardano serialization libraries. ' +
      'The wallet connection and Blockfrost integration are ready. ' +
      'To complete this, integrate @emurgo/cardano-serialization-lib-browser or similar.'
    );
  }

  async submitTransaction(signedTxCbor: string): Promise<string> {
    if (!this.walletApi) {
      throw new Error('Wallet not connected');
    }

    try {
      // Try wallet first
      const txHash = await this.walletApi.submitTx(signedTxCbor);
      return txHash;
    } catch {
      // Fall back to Blockfrost
      return blockchainService.submitTx(signedTxCbor);
    }
  }

  async releaseEscrow(_utxo: UTxO): Promise<string> {
    if (!this.walletApi) {
      throw new Error('Wallet not connected');
    }
    throw new Error('Release transaction requires Cardano serialization libraries for script interaction.');
  }

  async refundEscrow(_utxo: UTxO): Promise<string> {
    if (!this.walletApi) {
      throw new Error('Wallet not connected');
    }
    throw new Error('Refund transaction requires Cardano serialization libraries for script interaction.');
  }

  async getTransactionInfo(txHash: string) {
    return blockchainService.getTxStatus(txHash);
  }

  async getAddressBalance(address: string): Promise<bigint> {
    return blockchainService.getAddressBalance(address);
  }

  getScriptUtxos(): Promise<UTxO[]> {
    return Promise.resolve([]);
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getConnectedAddress(): string | null {
    return this.connectedAddress;
  }

  getNetwork(): string {
    return this.network;
  }

  getExplorerUrl(txHash: string): string {
    return blockchainService.getExplorerTxUrl(txHash);
  }
}

export const lucidService = new LucidService();

// Helper exports - use new functions from cardano module
export const adaToLovelace = (ada: number): bigint => _adaToLovelace(ada);
export const lovelaceToAda = (lovelace: bigint): number => _lovelaceToAda(lovelace);

// Generate a mock tx hash for simulation (deprecated - should use real txs)
export const generateMockTxHash = (): string => {
  const chars = 'abcdef0123456789';
  let hash = '';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
};
