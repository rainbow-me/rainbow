import { RainbowError } from '@/logger';

import { requireSolanaAddress, type SolanaAddress } from '../../address';
import { type SolanaInstruction } from './instruction';

/**
 * The System Program's address: 32 zero bytes, which encode to 32 `1` characters.
 *
 * Validated through the address guard rather than cast, so the constant cannot be
 * quietly wrong; the guard decodes it back to 32 bytes.
 */
export const SOLANA_SYSTEM_PROGRAM_ADDRESS: SolanaAddress = requireSolanaAddress(
  '11111111111111111111111111111111',
  '[solana/systemProgram]: the System Program address constant is malformed'
);

/**
 * `SystemInstruction::Transfer`'s variant index.
 *
 * Read from `anza-xyz/solana-sdk@58ca02e8` `system-interface/src/instruction.rs`:
 * `SystemInstruction` declares `CreateAccount`, then `Assign`, then
 * `Transfer { lamports: u64 }`, so Transfer is the third variant and its index is 2.
 */
const SYSTEM_INSTRUCTION_TRANSFER_INDEX = 2;

/**
 * The width of a bincode enum discriminant, in bytes.
 *
 * The instruction is serialized by `Instruction::new_with_bincode`
 * (`system-interface/src/instruction.rs:309`) and `bincode::serialize` writes an enum
 * discriminant as a four-byte little-endian tag, which is what makes a transfer's
 * payload twelve bytes rather than nine.
 *
 * This is the one part of the encoding primary source does not state: the sources read
 * name the serializer and fix the variant by position, but neither states bincode's tag
 * width. It is settled empirically instead, by a transfer that a real validator
 * executed. A wrong tag width would not have produced a lamport movement; it would have
 * produced `InvalidInstructionData` from the System Program, because the tag and the
 * payload share a twelve-byte buffer.
 */
const BINCODE_ENUM_TAG_BYTES = 4;

const LAMPORTS_U64_BYTES = 8;
const U64_MAX = (1n << 64n) - 1n;

/**
 * Builds a native SOL transfer instruction.
 *
 * Account order is fixed by the program and is not a convention this code chose:
 * `0. [WRITE, SIGNER] Funding account`, `1. [WRITE] Recipient account`, matching the
 * `transfer` helper at `system-interface/src/instruction.rs:902`, which builds exactly
 * `AccountMeta::new(from, true)` then `AccountMeta::new(to, false)`.
 *
 * **This does not validate the recipient beyond syntax, deliberately.** A recipient gate
 * is a network call or it does not exist: the System Program validates nothing whatsoever
 * about a transfer's destination and credits it unconditionally, and roughly half of all
 * single-character typos in a Solana address produce another valid, on-curve, perfectly
 * sendable address. A check added here would be exactly the gate that cannot work. The
 * recipient problem belongs to the address-input surface, in front of the user.
 */
export function createSolanaTransferInstruction(args: {
  readonly from: SolanaAddress;
  readonly to: SolanaAddress;
  readonly lamports: bigint;
}): SolanaInstruction {
  const { from, to, lamports } = args;

  if (lamports < 0n || lamports > U64_MAX) {
    throw new RainbowError(`[solana/systemProgram]: lamports must fit an unsigned 64-bit integer, received ${lamports}`);
  }

  const data = new Uint8Array(BINCODE_ENUM_TAG_BYTES + LAMPORTS_U64_BYTES);
  const view = new DataView(data.buffer);
  view.setUint32(0, SYSTEM_INSTRUCTION_TRANSFER_INDEX, true);
  view.setBigUint64(BINCODE_ENUM_TAG_BYTES, lamports, true);

  return {
    programId: SOLANA_SYSTEM_PROGRAM_ADDRESS,
    accounts: [
      { pubkey: from, isSigner: true, isWritable: true },
      { pubkey: to, isSigner: false, isWritable: true },
    ],
    data,
  };
}
