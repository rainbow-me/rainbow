import { HDKey } from 'micro-key-producer/slip10.js';

import { RainbowError } from '@/logger';

import { base58Encode, requireSolanaAddress, type SolanaAddress } from './address';

const PURPOSE_BIP44 = 44;

/** SLIP-0044's registered coin type for Solana. */
export const SOLANA_COIN_TYPE = 501;

const SEED_MIN_BYTES = 16;
const SEED_MAX_BYTES = 64;

/**
 * A derived Solana account with its raw Base58 address, private key and chain code. The
 * private key is a 32-byte ed25519 scalar seed, not a signature-ready expanded key.
 */
type Ed25519Node = {
  readonly address: SolanaAddress;
  readonly privateKey: Uint8Array;
  readonly chainCode: Uint8Array;
};

/** Derive a Solana account at the cookbook's fully hardened BIP44 path. */
export function deriveSolanaAccountNode(seed: Uint8Array, accountIndex: number): Ed25519Node {
  if (seed.length < SEED_MIN_BYTES || seed.length > SEED_MAX_BYTES) {
    throw new RainbowError(`[solana/derivation]: seed must be ${SEED_MIN_BYTES}-${SEED_MAX_BYTES} bytes, received ${seed.length}`);
  }

  const node = HDKey.fromMasterSeed(seed).derive(`m/${PURPOSE_BIP44}'/${SOLANA_COIN_TYPE}'/${accountIndex}'/0'`);
  return {
    address: requireSolanaAddress(
      base58Encode(node.publicKeyRaw),
      '[solana/derivation]: derived public key did not encode to a Solana address'
    ),
    privateKey: node.privateKey,
    chainCode: node.chainCode,
  };
}
