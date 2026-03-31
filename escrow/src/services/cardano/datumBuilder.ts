// ============================================================================
// Datum Builder - Construct Plutus datums for escrow transactions
// ============================================================================

import { encode } from 'cbor-x';
import { bech32ToHex } from './addressUtils';

/**
 * Escrow datum structure matching the Plutus contract
 */
export interface EscrowDatum {
  /** Buyer's PubKeyHash (28 bytes hex) */
  buyer: string;
  /** Seller's PubKeyHash (28 bytes hex) */
  seller: string;
  /** Deadline as POSIX timestamp (milliseconds) */
  deadline: bigint;
}

/**
 * Escrow action (redeemer) matching the Plutus contract
 */
export enum EscrowAction {
  Release = 0,
  Refund = 1,
}

/**
 * Extract PubKeyHash from a Cardano address
 * 
 * Address format (Shelley base address):
 * - 1 byte header: network + address type
 * - 28 bytes payment credential (PubKeyHash or ScriptHash)
 * - 28 bytes stake credential
 */
export function extractPubKeyHash(address: string): string {
  // Convert to hex if bech32
  let hexAddress = address;
  if (address.startsWith('addr')) {
    hexAddress = bech32ToHex(address);
  }
  
  if (!hexAddress || hexAddress.length < 58) {
    throw new Error('Invalid address format');
  }
  
  // Skip the first byte (header) and take 28 bytes (56 hex chars)
  const pkh = hexAddress.slice(2, 58);
  
  // Validate it's a valid hex string
  if (!/^[0-9a-fA-F]{56}$/.test(pkh)) {
    throw new Error('Failed to extract PubKeyHash from address');
  }
  
  return pkh.toLowerCase();
}

/**
 * Create an escrow datum from addresses and deadline
 */
export function createEscrowDatum(
  buyerAddress: string,
  sellerAddress: string,
  deadlineMs: number | Date
): EscrowDatum {
  const deadline = typeof deadlineMs === 'number' 
    ? BigInt(deadlineMs)
    : BigInt(deadlineMs.getTime());
    
  return {
    buyer: extractPubKeyHash(buyerAddress),
    seller: extractPubKeyHash(sellerAddress),
    deadline,
  };
}

/**
 * Serialize datum to CBOR hex for on-chain submission
 * 
 * Plutus datum format (PlutusData):
 * - Constr 0 [buyer, seller, deadline]
 * - buyer/seller as ByteString
 * - deadline as Integer
 */
export function serializeDatum(datum: EscrowDatum): string {
  // Convert PubKeyHash hex strings to Uint8Array
  const buyerBytes = hexToBytes(datum.buyer);
  const sellerBytes = hexToBytes(datum.seller);
  
  // PlutusData Constr encoding:
  // Tag 121 + constructor index for Constr 0
  // Then array of fields
  const plutusData = {
    // CBOR tag 121 = Constr 0 in Plutus
    constructor: 0,
    fields: [
      buyerBytes,
      sellerBytes,
      datum.deadline,
    ],
  };
  
  // Encode as CBOR
  // Note: This is a simplified encoding. For production,
  // use cardano-serialization-lib or similar for proper PlutusData encoding
  const cborBytes = encode([
    121, // Tag for Constr 0
    [buyerBytes, sellerBytes, Number(datum.deadline)],
  ]);
  
  return bytesToHex(cborBytes);
}

/**
 * Serialize redeemer to CBOR hex
 */
export function serializeRedeemer(action: EscrowAction): string {
  // Redeemer is just an integer: 0 for Release, 1 for Refund
  const cborBytes = encode(action);
  return bytesToHex(cborBytes);
}

/**
 * Calculate datum hash (for datum-in-tx-body pattern)
 */
export async function hashDatum(datumCbor: string): Promise<string> {
  const bytes = hexToBytes(datumCbor);
  
  // Use Web Crypto API for SHA-256
  // Note: Cardano uses Blake2b-256, but for now we use SHA-256 as approximation
  // For production, use @emurgo/cardano-serialization-lib-browser
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes.buffer as ArrayBuffer);
  const hashArray = new Uint8Array(hashBuffer);
  
  return bytesToHex(hashArray);
}

/**
 * Validate a datum matches expected structure
 */
export function validateDatum(datum: unknown): datum is EscrowDatum {
  if (!datum || typeof datum !== 'object') return false;
  
  const d = datum as Record<string, unknown>;
  
  return (
    typeof d.buyer === 'string' &&
    typeof d.seller === 'string' &&
    (typeof d.deadline === 'bigint' || typeof d.deadline === 'number') &&
    /^[0-9a-fA-F]{56}$/.test(d.buyer) &&
    /^[0-9a-fA-F]{56}$/.test(d.seller)
  );
}

/**
 * Parse deadline from various formats
 */
export function parseDeadline(input: string | number | Date): bigint {
  if (input instanceof Date) {
    return BigInt(input.getTime());
  }
  
  if (typeof input === 'number') {
    // Assume milliseconds if > year 3000 in seconds
    if (input > 32503680000) {
      return BigInt(input);
    }
    // Otherwise assume seconds, convert to ms
    return BigInt(input * 1000);
  }
  
  // Try parsing as date string
  const parsed = Date.parse(input);
  if (!isNaN(parsed)) {
    return BigInt(parsed);
  }
  
  // Try as number string
  return BigInt(input);
}

// ============================================================================
// Utility functions
// ============================================================================

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
