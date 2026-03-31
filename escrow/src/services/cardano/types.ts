// ============================================================================
// Cardano dApp Type Definitions - Production Grade
// ============================================================================

/** Supported Cardano networks */
export type CardanoNetwork = 'mainnet' | 'preprod' | 'preview';

/** Network IDs as returned by CIP-30 wallets */
export const NETWORK_IDS = {
  mainnet: 1,
  testnet: 0, // covers preprod, preview
} as const;

/** CIP-30 compliant wallet API */
export interface CIP30WalletAPI {
  getNetworkId(): Promise<number>;
  getUsedAddresses(): Promise<string[]>;
  getUnusedAddresses(): Promise<string[]>;
  getChangeAddress(): Promise<string>;
  getRewardAddresses(): Promise<string[]>;
  getBalance(): Promise<string>; // CBOR-encoded Value
  getUtxos(amount?: string, paginate?: { page: number; limit: number }): Promise<string[] | null>;
  getCollateral?(params?: { amount?: string }): Promise<string[] | null>;
  signTx(tx: string, partialSign?: boolean): Promise<string>;
  signData(addr: string, payload: string): Promise<{ signature: string; key: string }>;
  submitTx(tx: string): Promise<string>;
}

/** Wallet connection state */
export interface WalletState {
  connected: boolean;
  connecting: boolean;
  walletName: string | null;
  api: CIP30WalletAPI | null;
  address: string | null;
  stakeAddress: string | null;
  balance: bigint; // in lovelace
  networkId: number;
  error: string | null;
}

/** Transaction status from chain */
export interface TxStatus {
  confirmed: boolean;
  confirmations: number;
  block?: string;
  slot?: number;
  timestamp?: string;
}

/** UTxO structure */
export interface UTxO {
  txHash: string;
  outputIndex: number;
  address: string;
  lovelace: bigint;
  assets: Map<string, bigint>;
  datum?: string;
  datumHash?: string;
  scriptRef?: string;
}

/** Escrow datum matching Plutus contract */
export interface EscrowDatum {
  buyer: string; // PubKeyHash
  seller: string; // PubKeyHash
  deadline: bigint; // POSIXTime
}

/** Escrow redeemer actions */
export type EscrowRedeemer = 'Release' | 'Refund';

/** Protocol parameters subset for fee calculation */
export interface ProtocolParams {
  minFeeA: number;
  minFeeB: number;
  maxTxSize: number;
  coinsPerUtxoByte: bigint;
  collateralPercent: number;
  maxCollateralInputs: number;
  priceMem: number;
  priceStep: number;
}

/** Transaction building parameters */
export interface TxBuildParams {
  inputs: UTxO[];
  outputs: { address: string; lovelace: bigint; datum?: string }[];
  changeAddress: string;
  ttl?: number;
  metadata?: Record<string, unknown>;
}

/** Blockfrost API response types */
export interface BlockfrostUTxO {
  tx_hash: string;
  tx_index: number;
  output_index: number;
  amount: Array<{ unit: string; quantity: string }>;
  block: string;
  data_hash?: string;
  inline_datum?: string;
}

export interface BlockfrostTxInfo {
  hash: string;
  block: string;
  block_height: number;
  block_time: number;
  slot: number;
  index: number;
  output_amount: Array<{ unit: string; quantity: string }>;
  fees: string;
  deposit: string;
  size: number;
  invalid_before: string | null;
  invalid_hereafter: string | null;
  utxo_count: number;
  withdrawal_count: number;
  mir_cert_count: number;
  delegation_count: number;
  stake_cert_count: number;
  pool_update_count: number;
  pool_retire_count: number;
  asset_mint_or_burn_count: number;
  redeemer_count: number;
  valid_contract: boolean;
}

/** Installed wallet info */
export interface InstalledWallet {
  name: string;
  icon: string;
  apiVersion: string;
  isEnabled: boolean;
}

/** Network configuration */
export interface NetworkConfig {
  network: CardanoNetwork;
  blockfrostUrl: string;
  explorerUrl: string;
  networkMagic: number;
}

/** All network configurations */
export const NETWORK_CONFIGS: Record<CardanoNetwork, NetworkConfig> = {
  mainnet: {
    network: 'mainnet',
    blockfrostUrl: 'https://cardano-mainnet.blockfrost.io/api/v0',
    explorerUrl: 'https://cardanoscan.io',
    networkMagic: 764824073,
  },
  preprod: {
    network: 'preprod',
    blockfrostUrl: 'https://cardano-preprod.blockfrost.io/api/v0',
    explorerUrl: 'https://preprod.cardanoscan.io',
    networkMagic: 1,
  },
  preview: {
    network: 'preview',
    blockfrostUrl: 'https://cardano-preview.blockfrost.io/api/v0',
    explorerUrl: 'https://preview.cardanoscan.io',
    networkMagic: 2,
  },
};

/** Address validation result */
export interface AddressValidation {
  valid: boolean;
  network?: CardanoNetwork;
  type?: 'base' | 'enterprise' | 'pointer' | 'reward' | 'bootstrap';
  error?: string;
}

/** Transaction confirmation thresholds */
export const CONFIRMATION_THRESHOLDS = {
  /** Minimum confirmations for low-value transactions */
  LOW_VALUE: 3,
  /** Standard confirmations for medium-value */
  MEDIUM_VALUE: 10,
  /** High security for large transactions */
  HIGH_VALUE: 20,
  /** Ultra secure - near finality */
  CRITICAL: 40,
} as const;
