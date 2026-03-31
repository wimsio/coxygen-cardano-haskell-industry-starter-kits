// ============================================================================
// Network Safety Guard - Prevents mainnet/testnet mismatches
// ============================================================================

import { CardanoNetwork, NETWORK_IDS, AddressValidation } from './types';

/** Current app target network - should match backend configuration */
export const TARGET_NETWORK: CardanoNetwork = 'preprod' as CardanoNetwork;

/** Check if we're targeting testnet */
export const isTestnet = (): boolean => TARGET_NETWORK !== 'mainnet';

/**
 * Validate that a CIP-30 wallet's network matches our target
 */
export function validateWalletNetwork(walletNetworkId: number): { 
  valid: boolean; 
  expected: CardanoNetwork;
  actual: string;
  message?: string;
} {
  const isWalletMainnet = walletNetworkId === NETWORK_IDS.mainnet;
  const isAppMainnet = TARGET_NETWORK === 'mainnet';

  if (isWalletMainnet !== isAppMainnet) {
    return {
      valid: false,
      expected: TARGET_NETWORK,
      actual: isWalletMainnet ? 'mainnet' : 'testnet',
      message: `Network mismatch: App is configured for ${TARGET_NETWORK}, but wallet is on ${isWalletMainnet ? 'mainnet' : 'testnet'}. Please switch your wallet network.`,
    };
  }

  return {
    valid: true,
    expected: TARGET_NETWORK,
    actual: TARGET_NETWORK,
  };
}

/**
 * Validate Cardano address format and network
 */
export function validateAddress(address: string): AddressValidation {
  if (!address || typeof address !== 'string') {
    return { valid: false, error: 'Address is required' };
  }

  const trimmed = address.trim();

  // Bech32 mainnet (addr1...)
  if (/^addr1[a-z0-9]{53,}$/i.test(trimmed)) {
    if (TARGET_NETWORK !== 'mainnet') {
      return { 
        valid: false, 
        network: 'mainnet',
        error: `Mainnet address detected, but app is on ${TARGET_NETWORK}` 
      };
    }
    return { valid: true, network: 'mainnet', type: 'base' };
  }

  // Bech32 testnet (addr_test1...)
  if (/^addr_test1[a-z0-9]{53,}$/i.test(trimmed)) {
    if (TARGET_NETWORK === 'mainnet') {
      return { 
        valid: false, 
        network: 'preprod',
        error: 'Testnet address detected, but app is on mainnet' 
      };
    }
    return { valid: true, network: TARGET_NETWORK, type: 'base' };
  }

  // Hex-encoded address (CIP-30 raw format)
  if (/^[0-9a-fA-F]{56,}$/.test(trimmed)) {
    // First byte determines network
    const networkByte = parseInt(trimmed.substring(0, 2), 16);
    const networkNibble = networkByte & 0x0F;
    
    // 0x0X = testnet, 0x1X = mainnet for Shelley addresses
    const isMainnetAddress = networkNibble === 1;
    
    if (isMainnetAddress && TARGET_NETWORK !== 'mainnet') {
      return {
        valid: false,
        network: 'mainnet',
        error: `Mainnet address detected, but app is on ${TARGET_NETWORK}`,
      };
    }
    
    if (!isMainnetAddress && TARGET_NETWORK === 'mainnet') {
      return {
        valid: false,
        network: 'preprod',
        error: 'Testnet address detected, but app is on mainnet',
      };
    }
    
    return { 
      valid: true, 
      network: isMainnetAddress ? 'mainnet' : TARGET_NETWORK,
      type: 'base',
    };
  }

  return { valid: false, error: 'Invalid Cardano address format' };
}

/**
 * Validate transaction hash format
 */
export function validateTxHash(hash: string): boolean {
  return /^[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Get explorer URL for current network
 */
export function getExplorerUrl(type: 'tx' | 'address' | 'block', hash: string): string {
  const baseUrls: Record<CardanoNetwork, string> = {
    mainnet: 'https://cardanoscan.io',
    preprod: 'https://preprod.cardanoscan.io',
    preview: 'https://preview.cardanoscan.io',
  };

  const base = baseUrls[TARGET_NETWORK];
  
  switch (type) {
    case 'tx':
      return `${base}/transaction/${hash}`;
    case 'address':
      return `${base}/address/${hash}`;
    case 'block':
      return `${base}/block/${hash}`;
    default:
      return base;
  }
}

/**
 * Format lovelace to ADA with proper decimals
 */
export function lovelaceToAda(lovelace: bigint): number {
  return Number(lovelace) / 1_000_000;
}

/**
 * Convert ADA to lovelace
 */
export function adaToLovelace(ada: number): bigint {
  return BigInt(Math.floor(ada * 1_000_000));
}

/**
 * Format ADA amount for display
 */
export function formatAda(lovelace: bigint, decimals = 2): string {
  const ada = lovelaceToAda(lovelace);
  return `${ada.toLocaleString(undefined, { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  })} ₳`;
}
