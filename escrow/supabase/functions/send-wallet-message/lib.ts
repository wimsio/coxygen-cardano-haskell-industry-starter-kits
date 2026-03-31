// @ts-nocheck — this file targets Deno edge runtime; skip Vite/tsc checks
// Shared verification helpers for send-wallet-message
// Works in both Deno (Edge Functions) and Node (tests) via dynamic imports.

export function hexToBytes(hex: string): Uint8Array {
  const clean = String(hex).startsWith('0x') ? String(hex).slice(2) : String(hex);
  const bytes = new Uint8Array(Math.ceil(clean.length / 2));
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substr(i, 2), 16);
  }
  return bytes;
}

type Ed25519Module = {
  verify: (signature: Uint8Array, message: Uint8Array, publicKey: Uint8Array) => Promise<boolean>;
};

type Blake2bModule = {
  blake2b: (input: Uint8Array, opts: { dkLen: number }) => Uint8Array;
};

type Bech32Like = {
  decode: (address: string, limit?: number) => { words: number[] };
  fromWords: (words: number[]) => number[];
};

async function importEd25519(): Promise<Ed25519Module> {
  if (typeof Deno !== 'undefined') {
    return await import('https://esm.sh/@noble/ed25519@1.7.1');
  }
  return await import('@noble/ed25519');
}

async function importBlake2b(): Promise<Blake2bModule> {
  if (typeof Deno !== 'undefined') {
    return await import('https://esm.sh/@noble/hashes@1.4.2/blake2b');
  }
  return await import('@noble/hashes/blake2b');
}

async function importBech32(): Promise<{ bech32?: Bech32Like } & Bech32Like> {
  if (typeof Deno !== 'undefined') {
    return await import('https://esm.sh/bech32@1.1.4');
  }
  const mod = await import('bech32');
  return (mod as any).bech32 ?? mod;
}

export async function verifySignature(payload: string | Uint8Array, signatureHex: string, pubKeyHex: string): Promise<boolean> {
  const ed = await importEd25519();
  const payloadBytes = typeof payload === 'string' ? new TextEncoder().encode(payload) : payload;
  const sig = hexToBytes(signatureHex);
  const pk = hexToBytes(pubKeyHex);
  try {
    return await ed.verify(sig, payloadBytes, pk);
  } catch {
    return false;
  }
}

export async function publicKeyMatchesAddress(pubKeyHex: string, address: string): Promise<boolean> {
  const { blake2b } = await importBlake2b();
  const bech32 = await importBech32();

  const pkBytes = hexToBytes(pubKeyHex);
  const pkHash = blake2b(pkBytes, { dkLen: 28 });

  // Convert provided address to raw bytes (support bech32 and hex)
  let addrBytes: Uint8Array | null = null;
  try {
    // try bech32 decode
    const decoded = bech32.bech32 ? bech32.bech32.decode(address, 1023) : bech32.decode(address, 1023);
    const words = decoded.words;
    const bytes = bech32.bech32 ? bech32.bech32.fromWords(words) : bech32.fromWords(words);
    addrBytes = new Uint8Array(bytes);
  } catch {
    // fallback to hex
    if (/^[0-9a-fA-F]+$/.test(address)) {
      addrBytes = hexToBytes(address);
    }
  }

  if (!addrBytes || addrBytes.length < 29) return false;

  const paymentHashInAddr = addrBytes.slice(1, 29);
  if (paymentHashInAddr.length !== pkHash.length) return false;

  for (let i = 0; i < pkHash.length; i++) {
    if (pkHash[i] !== paymentHashInAddr[i]) return false;
  }

  return true;
}
