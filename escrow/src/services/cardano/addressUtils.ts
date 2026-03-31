// ============================================================================
// Address Utilities - Hex to Bech32 Conversion
// ============================================================================

import { bech32 } from 'bech32';
import { TARGET_NETWORK } from './networkGuard';

/**
 * Convert hex-encoded Cardano address to bech32 format
 */
export function hexToBech32(hexAddress: string): string {
  if (!hexAddress || typeof hexAddress !== 'string') {
    return hexAddress;
  }

  // Already bech32 format
  if (hexAddress.startsWith('addr1') || hexAddress.startsWith('addr_test1')) {
    return hexAddress;
  }

  // Not a valid hex address
  if (!/^[0-9a-fA-F]+$/.test(hexAddress)) {
    return hexAddress;
  }

  try {
    // Convert hex string to bytes
    const bytes = new Uint8Array(hexAddress.length / 2);
    for (let i = 0; i < hexAddress.length; i += 2) {
      bytes[i / 2] = parseInt(hexAddress.substr(i, 2), 16);
    }

    // Determine prefix based on network byte (first nibble of first byte)
    const networkByte = bytes[0] & 0x0F;
    const isMainnet = networkByte === 1;
    
    // Use appropriate prefix
    const prefix = isMainnet ? 'addr' : 'addr_test';

    // Convert bytes to 5-bit words for bech32
    const words = bech32.toWords(bytes);
    
    // Encode with bech32 (use bech32 for addresses, limit is 1023 for long addresses)
    return bech32.encode(prefix, words, 1023);
  } catch (error) {
    console.warn('[Address] Failed to convert hex to bech32:', error);
    return hexAddress;
  }
}

/**
 * Convert bech32 address to hex format
 */
export function bech32ToHex(bech32Address: string): string {
  if (!bech32Address || typeof bech32Address !== 'string') {
    return bech32Address;
  }

  // Already hex format
  if (/^[0-9a-fA-F]+$/.test(bech32Address)) {
    return bech32Address;
  }

  try {
    const decoded = bech32.decode(bech32Address, 1023);
    const bytes = bech32.fromWords(decoded.words);
    return Array.from(new Uint8Array(bytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (error) {
    console.warn('[Address] Failed to convert bech32 to hex:', error);
    return bech32Address;
  }
}

/**
 * Truncate address for display (works with both formats)
 */
export function truncateAddress(address: string, startChars = 12, endChars = 8): string {
  if (!address) return '';
  
  // Convert to bech32 first for consistent display
  const displayAddress = hexToBech32(address);
  
  if (displayAddress.length <= startChars + endChars + 3) {
    return displayAddress;
  }
  
  return `${displayAddress.slice(0, startChars)}...${displayAddress.slice(-endChars)}`;
}

/**
 * Validate and normalize address to bech32
 */
export function normalizeAddress(address: string): string {
  return hexToBech32(address);
}

/**
 * Check if address matches current network
 */
export function isAddressForNetwork(address: string): boolean {
  const bech32Addr = hexToBech32(address);
  
  if (TARGET_NETWORK === 'mainnet') {
    return bech32Addr.startsWith('addr1');
  }
  
  return bech32Addr.startsWith('addr_test1');
}
