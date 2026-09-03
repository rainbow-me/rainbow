import { concatBytes } from '@noble/hashes/utils';

import { RainbowError } from '@/logger';

import { encodeCompactU16 } from './compactU16';
import { type CompiledSolanaMessage } from './message';
import { SOLANA_SIGNATURE_BYTE_LENGTH } from './signature';

/**
 * The maximum size of a serialized transaction, which is the network's packet size.
 *
 * `anza-xyz/solana-sdk@58ca02e8` asserts `PACKET_DATA_SIZE` equal to 1232 and derives
 * it as 1280 minus 40 minus 8, the IPv6 minimum MTU less its header and an 8-byte
 * fragment header. A single native transfer is nowhere near it; the
 * check exists because the failure it prevents is a truncated transaction reaching the
 * wire.
 */
export const SOLANA_PACKET_DATA_SIZE = 1232;

export type SignedSolanaTransaction = {
  readonly signatures: readonly Uint8Array[];
  readonly message: CompiledSolanaMessage;
};

/**
 * Serializes a signed transaction into the bytes `sendTransaction` takes.
 *
 * Layout: a compact-u16 signature count, then each 64-byte signature, then the
 * compiled message bytes verbatim.
 *
 * This is the only function in the module that produces submittable bytes, and it is
 * total: it throws rather than emitting anything a validator would reject for a reason
 * this code could have caught. Signature *i* must belong to `accountKeys[i]`,
 * which this function cannot verify — it checks the count, and the caller's
 * placement is what makes the correspondence true.
 */
export function serializeSignedTransaction(transaction: SignedSolanaTransaction): Uint8Array {
  const { signatures, message } = transaction;
  const required = message.header.numRequiredSignatures;

  if (signatures.length !== required) {
    throw new RainbowError(`[solana/transaction]: message requires ${required} signatures, received ${signatures.length}`);
  }

  for (const signature of signatures) {
    if (signature.length !== SOLANA_SIGNATURE_BYTE_LENGTH) {
      throw new RainbowError(`[solana/transaction]: signature must be ${SOLANA_SIGNATURE_BYTE_LENGTH} bytes, received ${signature.length}`);
    }
  }

  const bytes = concatBytes(encodeCompactU16(signatures.length), ...signatures, message.bytes);

  if (bytes.length > SOLANA_PACKET_DATA_SIZE) {
    throw new RainbowError(
      `[solana/transaction]: serialized transaction is ${bytes.length} bytes, over the ${SOLANA_PACKET_DATA_SIZE} limit`
    );
  }

  return bytes;
}
