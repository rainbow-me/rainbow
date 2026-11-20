import { ed25519 } from '@noble/curves/ed25519';
import { mnemonicToSeedSync } from 'bip39';
import { describe, expect, it } from 'vitest';

import { base58Decode } from '@/features/solana/core/address';
import { deriveSolanaAddress } from '@/features/solana/core/derivation';

import { decodeSolanaKey, solanaKeyFromSeed } from './solanaAccount';

const seed = mnemonicToSeedSync('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');

describe('Solana persisted key format', () => {
  it('round trips indices 0, 1, 2 and produces verifiable signatures', () => {
    const addresses = new Set();
    for (const index of [0, 1, 2]) {
      const record = solanaKeyFromSeed(seed, index);
      expect(record.address).toBe(deriveSolanaAddress(seed, index));
      const key = decodeSolanaKey(record, record.address);
      const message = new Uint8Array([1, 2, 3]);
      expect(ed25519.verify(ed25519.sign(message, key), message, base58Decode(record.address)!)).toBe(true);
      addresses.add(record.address);
      key.fill(0);
    }
    expect(addresses.size).toBe(3);
  });

  it('rejects wrong versions, formats, malformed keys, mismatched addresses and invalid indices', () => {
    const record = solanaKeyFromSeed(seed, 0);
    for (const change of [
      { version: 2 },
      { format: 'secp256k1-private-key-hex' },
      { privateKey: 'bad' },
      { privateKey: Buffer.alloc(32).toString('base64') },
      { address: solanaKeyFromSeed(seed, 1).address },
    ]) {
      expect(() => decodeSolanaKey({ ...record, ...change }, record.address)).toThrow();
    }
    for (const index of [-1, 1.1, 2 ** 31]) expect(() => solanaKeyFromSeed(seed, index)).toThrow();
  });
});
