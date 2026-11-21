import { ed25519 } from '@noble/curves/ed25519';
import { HDKey } from 'micro-key-producer/slip10.js';

import { RainbowError } from '@/logger';

import { base58Encode, requireSolanaAddress, type SolanaAddress } from './address';

const PURPOSE_BIP44 = 44;

/** SLIP-0044's registered coin type for Solana. */
export const SOLANA_COIN_TYPE = 501;

const SEED_MIN_BYTES = 16;
const SEED_MAX_BYTES = 64;

/**
 * A private key and chain code at some point in a SLIP-0010 derivation. The
 * private key is a 32-byte ed25519 scalar seed, not a signature-ready expanded key.
 */
type Ed25519Node = {
  readonly privateKey: Uint8Array;
  readonly chainCode: Uint8Array;
};

/** Derive a Solana account at the cookbook's fully hardened BIP44 path. */
export function deriveSolanaAccountNode(seed: Uint8Array, accountIndex: number): Ed25519Node {
  if (seed.length < SEED_MIN_BYTES || seed.length > SEED_MAX_BYTES) {
    throw new RainbowError(`[solana/derivation]: seed must be ${SEED_MIN_BYTES}-${SEED_MAX_BYTES} bytes, received ${seed.length}`);
  }

  const node = HDKey.fromMasterSeed(seed).derive(`m/${PURPOSE_BIP44}'/${SOLANA_COIN_TYPE}'/${accountIndex}'/0'`);
  return { privateKey: node.privateKey, chainCode: node.chainCode };
}

/**
 * Derives the Solana address for one account of a wallet.
 *
 * The address is validated by decoding it back to 32 bytes rather than asserted,
 * so an encoding fault cannot leave this function as a `SolanaAddress`.
 */
export function deriveSolanaAddress(seed: Uint8Array, accountIndex: number): SolanaAddress {
  const publicKey = ed25519.getPublicKey(deriveSolanaAccountNode(seed, accountIndex).privateKey);
  return requireSolanaAddress(base58Encode(publicKey), '[solana/derivation]: derived public key did not encode to a Solana address');
}

/**
 * Signs with a derived Solana account key without handing that key out.
 *
 * The private key stays captured in the returned closure. JavaScript offers no way
 * to guarantee it is scrubbed afterwards, so the containment this provides is
 * against accidental copying, logging and persistence, and nothing stronger:
 * discard the signer when the operation that needed it is finished, and never put
 * one anywhere that outlives that operation.
 */
export type SolanaSigner = {
  readonly address: SolanaAddress;
  readonly sign: (message: Uint8Array) => Uint8Array;
};

export function deriveSolanaSigner(seed: Uint8Array, accountIndex: number): SolanaSigner {
  const { privateKey } = deriveSolanaAccountNode(seed, accountIndex);
  const publicKey = ed25519.getPublicKey(privateKey);

  return {
    address: requireSolanaAddress(base58Encode(publicKey), '[solana/derivation]: derived public key did not encode to a Solana address'),
    sign: (message: Uint8Array) => ed25519.sign(message, privateKey),
  };
}
