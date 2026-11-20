import { ed25519 } from '@noble/curves/ed25519';
import { base64 } from '@scure/base';

import { base58Encode, requireSolanaAddress } from '@/features/solana/core/address';
import { deriveHardenedEd25519Node } from '@/features/solana/core/derivation';
import { type AccountPrivateKeyData } from '@/features/wallet/types';

export function solanaKeyFromSeed(seed: Uint8Array, index: number): AccountPrivateKeyData {
  const node = deriveHardenedEd25519Node(seed, [44, 501, index, 0]);
  try {
    return {
      address: base58Encode(ed25519.getPublicKey(node.privateKey)),
      privateKey: base64.encode(node.privateKey),
      format: 'ed25519-seed-base64',
      version: 1,
    };
  } finally {
    node.privateKey.fill(0);
    node.chainCode.fill(0);
  }
}

/** Decode the persisted format and bind the key to its expected raw address. */
export function decodeSolanaKey(value: unknown, expectedAddress: string): Uint8Array {
  requireSolanaAddress(expectedAddress, 'Invalid Solana address');
  if (
    !value ||
    typeof value !== 'object' ||
    !('version' in value) ||
    value.version !== 1 ||
    !('format' in value) ||
    value.format !== 'ed25519-seed-base64' ||
    !('address' in value) ||
    value.address !== expectedAddress ||
    !('privateKey' in value) ||
    typeof value.privateKey !== 'string' ||
    value.privateKey.length !== 44
  )
    throw new Error('Invalid Solana key record.');
  let bytes: Uint8Array | undefined;
  try {
    bytes = base64.decode(value.privateKey);
    if (bytes.length !== 32 || base64.encode(bytes) !== value.privateKey || base58Encode(ed25519.getPublicKey(bytes)) !== expectedAddress) {
      throw new Error('Invalid key');
    }
    return bytes;
  } catch {
    bytes?.fill(0);
    throw new Error('Solana key does not match its address.');
  }
}
