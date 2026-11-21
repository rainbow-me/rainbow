import { ed25519 } from '@noble/curves/ed25519';
import { base58 } from '@scure/base';

import { base58Encode, requireSolanaAddress } from '@/features/solana/core/address';

/** Decode the persisted format and bind the key to its expected raw address. */
export function decodeSolanaKey(value: unknown, expectedAddress: string): Uint8Array {
  requireSolanaAddress(expectedAddress, 'Invalid Solana address');
  if (
    !value ||
    typeof value !== 'object' ||
    !('address' in value) ||
    value.address !== expectedAddress ||
    !('privateKey' in value) ||
    typeof value.privateKey !== 'string' ||
    value.privateKey.length < 32 ||
    value.privateKey.length > 44
  )
    throw new Error('Invalid Solana key record.');
  let bytes: Uint8Array | undefined;
  try {
    bytes = base58.decode(value.privateKey);
    if (bytes.length !== 32 || base58.encode(bytes) !== value.privateKey || base58Encode(ed25519.getPublicKey(bytes)) !== expectedAddress) {
      throw new Error('Invalid key');
    }
    return bytes;
  } catch {
    bytes?.fill(0);
    throw new Error('Solana key does not match its address.');
  }
}
