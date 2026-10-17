import { ed25519 } from '@noble/curves/ed25519';
import { hmac } from '@noble/hashes/hmac';
import { sha512 } from '@noble/hashes/sha2';

import { RainbowError } from '@/logger';

import { base58Encode, requireSolanaAddress, type SolanaAddress } from './address';

/**
 * SLIP-0010 names the HMAC key for this curve, and the string is part of the
 * specification rather than a choice: change it and every derived address changes.
 */
const ED25519_SEED_KEY = new Uint8Array([0x65, 0x64, 0x32, 0x35, 0x35, 0x31, 0x39, 0x20, 0x73, 0x65, 0x65, 0x64]); // "ed25519 seed"

const HARDENED_OFFSET = 0x80000000;
const PURPOSE_BIP44 = 44;

/** SLIP-0044's registered coin type for Solana. */
export const SOLANA_COIN_TYPE = 501;

const SEED_MIN_BYTES = 16;
const SEED_MAX_BYTES = 64;
const PRIVATE_KEY_BYTES = 32;

/**
 * A private key and chain code at some point in a SLIP-0010 derivation. The
 * private key is a 32-byte ed25519 scalar seed, not a signature-ready expanded key.
 */
type Ed25519Node = {
  readonly privateKey: Uint8Array;
  readonly chainCode: Uint8Array;
};

/**
 * Every path component this module derives at, and every account index it renders,
 * goes through here, so the two cannot disagree about what a valid index is. The
 * upper bound is where the hardened bit lives: an index at or above it would set
 * that bit itself rather than being hardened by the derivation.
 */
function assertAccountIndex(index: number): void {
  if (!Number.isInteger(index) || index < 0 || index >= HARDENED_OFFSET) {
    throw new RainbowError(`[solana/derivation]: path index must be an integer in [0, 2^31), received ${index}`);
  }
}

/**
 * Derives a node by applying one hardened step per index, per SLIP-0010's
 * `CKDpriv` for ed25519.
 *
 * Every step is hardened, and that is structural rather than a default: SLIP-0010
 * states that non-hardened derivation "always fails for ed25519 and curve25519",
 * because on this curve the hash of the private key is the multiplier rather than
 * the private key itself, so the point arithmetic the non-hardened case needs does
 * not exist. Indices arrive un-offset and this function adds the hardened bit, so
 * a caller cannot express a derivation this curve cannot perform.
 *
 * The consequence for callers is a cost, not a correctness matter. The EVM pattern
 * of deriving one root and walking cheap non-hardened children by index has no
 * analogue here: each index is a separate walk from the seed, so each one needs the
 * seed again.
 *
 * Exported because SLIP-0010's own test vectors exercise paths that are not Solana
 * paths, and checking against them is the only authoritative correctness evidence
 * available for this machinery.
 */
export function deriveHardenedEd25519Node(seed: Uint8Array, path: readonly number[]): Ed25519Node {
  if (seed.length < SEED_MIN_BYTES || seed.length > SEED_MAX_BYTES) {
    throw new RainbowError(`[solana/derivation]: seed must be ${SEED_MIN_BYTES}-${SEED_MAX_BYTES} bytes, received ${seed.length}`);
  }

  const master = hmac(sha512, ED25519_SEED_KEY, seed);
  let node: Ed25519Node = { privateKey: master.slice(0, 32), chainCode: master.slice(32) };

  for (const index of path) {
    assertAccountIndex(index);

    // 0x00 pads the 32-byte private key to the 33 bytes the specification hashes.
    const data = new Uint8Array(1 + PRIVATE_KEY_BYTES + 4);
    data.set(node.privateKey, 1);
    const hardenedIndex = index + HARDENED_OFFSET;
    data[33] = (hardenedIndex >>> 24) & 0xff;
    data[34] = (hardenedIndex >>> 16) & 0xff;
    data[35] = (hardenedIndex >>> 8) & 0xff;
    data[36] = hardenedIndex & 0xff;

    const derived = hmac(sha512, node.chainCode, data);
    node = { privateKey: derived.slice(0, 32), chainCode: derived.slice(32) };
  }

  return node;
}

/**
 * The path a Rainbow Solana account derives at, `m/44'/501'/<account index>'/0'`.
 *
 * Rendered for records and debug output; nothing parses it back. Every component is
 * hardened, and the trailing one is worth naming because BIP-44 would normally
 * leave the change level non-hardened, as Rainbow's own EVM path `m/44'/60'/0'/0`
 * does.
 *
 * The two spellings are not interchangeable, which matters when comparing this
 * path against another wallet's documentation. A non-hardened component is not
 * derivable on ed25519 at all, so `m/44'/501'/0'/0` does not denote a key that some
 * other implementation reaches by a different route: `ed25519-hd-key`, the
 * SLIP-0010 library the Solana ecosystem generally uses, matches paths against
 * `^m(\/[0-9]+')+$` and throws `Invalid derivation path` for that string rather
 * than hardening it. Treat a path written without the trailing apostrophe as a
 * documentation shorthand for this one, never as a second candidate to try.
 */
export function solanaDerivationPath(accountIndex: number): string {
  assertAccountIndex(accountIndex);
  return `m/${PURPOSE_BIP44}'/${SOLANA_COIN_TYPE}'/${accountIndex}'/0'`;
}

function deriveAccountNode(seed: Uint8Array, accountIndex: number): Ed25519Node {
  return deriveHardenedEd25519Node(seed, [PURPOSE_BIP44, SOLANA_COIN_TYPE, accountIndex, 0]);
}

/**
 * Derives the Solana address for one account of a wallet.
 *
 * The address is validated by decoding it back to 32 bytes rather than asserted,
 * so an encoding fault cannot leave this function as a `SolanaAddress`.
 */
export function deriveSolanaAddress(seed: Uint8Array, accountIndex: number): SolanaAddress {
  const publicKey = ed25519.getPublicKey(deriveAccountNode(seed, accountIndex).privateKey);
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
  const { privateKey } = deriveAccountNode(seed, accountIndex);
  const publicKey = ed25519.getPublicKey(privateKey);

  return {
    address: requireSolanaAddress(base58Encode(publicKey), '[solana/derivation]: derived public key did not encode to a Solana address'),
    sign: (message: Uint8Array) => ed25519.sign(message, privateKey),
  };
}
