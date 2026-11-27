import { ed25519 } from '@noble/curves/ed25519';
import { mnemonicToSeedSync } from 'bip39';
import { describe, expect, it } from 'vitest';

import { base58Decode, base58Encode } from '@/features/solana/core/address';
import { deriveSolanaAccountNode } from '@/features/solana/core/derivation';
import { type AccountPrivateKeyData } from '@/features/wallet/types';

import { decodeSolanaKey } from './solanaAccount';

const seed = mnemonicToSeedSync('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');

describe('Solana persisted key format', () => {
  it('round trips indices 0, 1, 2 and produces verifiable signatures', () => {
    const addresses = new Set();
    for (const index of [0, 1, 2]) {
      const node = deriveSolanaAccountNode(seed, index);
      const record: AccountPrivateKeyData = {
        address: node.address,
        privateKey: base58Encode(node.privateKey),
        format: 'ed25519-seed-base58',
        version: 1,
      };
      expect(record.address).toBe(deriveSolanaAccountNode(seed, index).address);
      const key = decodeSolanaKey(record, record.address);
      expect(key).toEqual(node.privateKey);
      const message = new Uint8Array([1, 2, 3]);
      expect(ed25519.verify(ed25519.sign(message, key), message, base58Decode(record.address)!)).toBe(true);
      addresses.add(record.address);
      key.fill(0);
    }
    expect(addresses.size).toBe(3);
  });

  it('rejects malformed keys and mismatched addresses', () => {
    const node = deriveSolanaAccountNode(seed, 0);
    const record: AccountPrivateKeyData = {
      address: node.address,
      privateKey: base58Encode(node.privateKey),
      format: 'ed25519-seed-base58',
      version: 1,
    };
    for (const change of [
      { privateKey: 'bad' },
      { privateKey: '0'.repeat(44) },
      { privateKey: base58Encode(new Uint8Array(31)) },
      { privateKey: base58Encode(new Uint8Array(33)) },
      { privateKey: base58Encode(new Uint8Array(64)) },
      { privateKey: base58Encode(new Uint8Array(32)) },
    ]) {
      expect(() => decodeSolanaKey({ ...record, ...change }, record.address)).toThrow();
    }
    expect(() => decodeSolanaKey(record, deriveSolanaAccountNode(seed, 1).address)).toThrow();
  });

  it.each([
    { bytes: new Uint8Array(32), length: 32 },
    { bytes: new Uint8Array(32).fill(1), length: 43 },
    { bytes: new Uint8Array(32).fill(255), length: 44 },
  ])('decodes a 32-byte seed encoded in $length Base58 characters', ({ bytes, length }) => {
    const address = base58Encode(ed25519.getPublicKey(bytes));
    const record: AccountPrivateKeyData = { address, privateKey: base58Encode(bytes), format: 'ed25519-seed-base58', version: 1 };
    expect(record.privateKey).toHaveLength(length);
    expect(decodeSolanaKey(record, address)).toEqual(bytes);
  });

  it('binds the key to the expected address without checking record metadata', () => {
    const node = deriveSolanaAccountNode(seed, 0);
    const record = { privateKey: base58Encode(node.privateKey) };
    for (const value of [record, { ...record, address: 'unused-address', version: 2, format: 'unused-format' }]) {
      // @ts-expect-error Exercise persisted records with missing or different metadata.
      expect(decodeSolanaKey(value, node.address)).toEqual(node.privateKey);
    }
  });

  it('catches malformed records without exposing their contents', () => {
    const address = deriveSolanaAccountNode(seed, 0).address;
    for (const value of [
      undefined,
      null,
      false,
      42,
      'not-a-record',
      {},
      { privateKey: undefined },
      { privateKey: null },
      { privateKey: 42 },
      { privateKey: new Uint8Array(32) },
      { privateKey: 'invalid-secret-data' },
    ]) {
      // @ts-expect-error Exercise malformed data that can arrive from JSON parsing.
      expect(() => decodeSolanaKey(value, address)).toThrow('Solana key does not match its address.');
    }
  });

  it('rejects legacy Base64 records instead of guessing their encoding', () => {
    const node = deriveSolanaAccountNode(seed, 0);
    const record = {
      address: node.address,
      privateKey: Buffer.from(node.privateKey).toString('base64'),
      format: 'ed25519-seed-base64',
      version: 1,
    };
    // @ts-expect-error Exercise the previously persisted Base64 format.
    expect(() => decodeSolanaKey(record, node.address)).toThrow();
  });
});
