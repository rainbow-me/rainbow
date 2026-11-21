import { ed25519 } from '@noble/curves/ed25519';
import { base58 } from '@scure/base';

import { base58Encode, requireSolanaAddress } from '@/features/solana/core/address';
import { type AccountPrivateKeyData } from '@/features/wallet/types';

/** Decode the persisted format and bind the key to its expected raw address. */
export function decodeSolanaKey(value: unknown, expectedAddress: string): Uint8Array {
  requireSolanaAddress(expectedAddress, 'Invalid Solana address');
  let bytes: Uint8Array | undefined;
  try {
    const { privateKey } = value as AccountPrivateKeyData;
    bytes = base58.decode(privateKey);
    if (bytes.length !== 32 || base58.encode(bytes) !== privateKey || base58Encode(ed25519.getPublicKey(bytes)) !== expectedAddress) {
      throw new Error('Invalid key');
    }
    return bytes;
  } catch {
    bytes?.fill(0);
    throw new Error('Solana key does not match its address.');
  }
}
