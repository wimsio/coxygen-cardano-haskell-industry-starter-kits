import { describe, it, expect } from 'vitest';
import { verifySignature, publicKeyMatchesAddress, hexToBytes } from '../../supabase/functions/send-wallet-message/lib';
import * as ed from '@noble/ed25519';
import { blake2b } from '@noble/hashes/blake2b';
import { bech32 } from 'bech32';

function toHex(buf: Uint8Array) {
  return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}

describe('send-wallet-message helpers', () => {
  it('verifies a valid signature', async () => {
    const priv = ed.utils.randomPrivateKey();
    const pub = await ed.getPublicKey(priv);

    const payload = JSON.stringify({ escrow_id: 'test', content: 'hello', ts: Date.now() });
    const sig = await ed.sign(new TextEncoder().encode(payload), priv);

    const ok = await verifySignature(payload, toHex(sig), toHex(pub));
    expect(ok).toBe(true);
  });

  it('rejects invalid signatures', async () => {
    const priv = ed.utils.randomPrivateKey();
    const pub = await ed.getPublicKey(priv);

    const payload = 'message';
    const sig = await ed.sign(new TextEncoder().encode(payload), priv);

    // tamper the signature
    const tampered = new Uint8Array(sig);
    tampered[0] ^= 0xff;

    const ok = await verifySignature(payload, toHex(tampered), toHex(pub));
    expect(ok).toBe(false);
  });

  it('matches public key to bech32 address (payment key hash)', async () => {
    const priv = ed.utils.randomPrivateKey();
    const pub = await ed.getPublicKey(priv);

    const pkHash = blake2b(pub, { dkLen: 28 });
    const addrBytes = new Uint8Array([0x01, ...pkHash, 0x00]); // header + payment key hash + trailing byte
    const words = bech32.toWords(addrBytes);
    const addr = bech32.encode('addr_test', words, 1023);

    const matches = await publicKeyMatchesAddress(toHex(pub), addr);
    expect(matches).toBe(true);
  });

  it('returns false for non-matching address', async () => {
    const priv = ed.utils.randomPrivateKey();
    const pub = await ed.getPublicKey(priv);

    // create a different fake address (random bytes)
    const otherBytes = new Uint8Array(29).fill(0x42);
    const words = bech32.toWords(otherBytes);
    const addr = bech32.encode('addr_test', words, 1023);

    const matches = await publicKeyMatchesAddress(toHex(pub), addr);
    expect(matches).toBe(false);
  });
});
