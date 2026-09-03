import { concatBytes } from '@noble/hashes/utils';

import { RainbowError } from '@/logger';

import { base58Decode, SOLANA_ADDRESS_BYTE_LENGTH, type SolanaAddress } from '../../address';
import { type SolanaBlockhash } from './blockhash';
import { encodeCompactU16 } from './compactU16';
import { type SolanaInstruction } from './instruction';

/**
 * The two live transaction formats. V1 is deliberately absent: it exists in the SDK
 * and the validator but is status `Review` with an unfilled
 * feature key rather than activated, and that SIMD-0385's own summary calls legacy and
 * v0 "the current live transaction formats". Build aware of it, not on it.
 */
export type SolanaMessageVersion = 'legacy' | 'v0';

/** The first byte of a versioned message is `0x80 | version`. Legacy has no prefix. */
const MESSAGE_VERSION_PREFIX = 0x80;

export type SolanaMessage = {
  readonly version: SolanaMessageVersion;
  readonly feePayer: SolanaAddress;
  readonly recentBlockhash: SolanaBlockhash;
  readonly instructions: readonly SolanaInstruction[];
};

/**
 * The three counts that tell the runtime how to read `accountKeys`, in wire order.
 *
 * They are counts rather than per-account flags, which is what forces the account-key
 * table into four contiguous groups: writable signers, readonly signers, writable
 * non-signers, readonly non-signers. There is no way to express a writable signer
 * after a readonly one.
 */
export type SolanaMessageHeader = {
  readonly numRequiredSignatures: number;
  readonly numReadonlySignedAccounts: number;
  readonly numReadonlyUnsignedAccounts: number;
};

/**
 * A compiled message: the bytes to sign, plus the two things a signer cannot recover
 * from them without re-implementing the compiler.
 *
 * The account-key table is an output rather than an internal detail because signature
 * placement depends on it: signature *i* belongs to
 * `accountKeys[i]`, so whoever places a signature has to know the ordering the
 * compiler chose. Returning only bytes would force the caller to re-derive that
 * ordering, and the two derivations could disagree.
 */
export type CompiledSolanaMessage = {
  readonly accountKeys: readonly SolanaAddress[];
  readonly header: SolanaMessageHeader;
  readonly bytes: Uint8Array;
};

type AccountRole = {
  isSigner: boolean;
  isWritable: boolean;
};

/**
 * Decodes one of the message's 32-byte base58 fields: an account key or the recent
 * blockhash. Both are branded types over base58 whose guards already checked this, so
 * a throw here means a branded value was produced by a cast rather than a guard.
 */
function decode32Bytes(value: string): Uint8Array {
  const bytes = base58Decode(value);
  if (bytes?.length !== SOLANA_ADDRESS_BYTE_LENGTH) {
    throw new RainbowError(`[solana/message]: message field did not decode to ${SOLANA_ADDRESS_BYTE_LENGTH} bytes`);
  }
  return bytes;
}

/**
 * Orders two addresses by their decoded bytes, which is the ordering the upstream
 * compiler produces and **not** the ordering of their base58 strings.
 *
 * The distinction is easy to get wrong and silent when wrong. Upstream collects keys
 * in a `BTreeMap<Address, _>` (`anza-xyz/solana-sdk@58ca02e8`
 * `message/src/compiled_keys.rs:57`) and `Address` derives `Ord` over its `[u8; 32]`
 * (`address/src/lib.rs:107-108`), so iteration is lexicographic over the raw key.
 * Base58 strings of the same 32 bytes vary in length between 32 and 44 characters, so
 * comparing them as strings is a different order.
 */
function compareAddressBytes(left: Uint8Array, right: Uint8Array): number {
  for (let index = 0; index < left.length; index++) {
    const difference = left[index] - right[index];
    if (difference !== 0) return difference;
  }
  return 0;
}

/**
 * Builds the account-key table and the header.
 *
 * This reproduces `CompiledKeys::compile` and `try_into_message_components` from
 * `anza-xyz/solana-sdk@58ca02e8` `message/src/compiled_keys.rs:57-137`, and the four
 * steps are in that order because each one is observable in the output:
 *
 * 1. Every instruction's program id enters the table, and every account meta unions
 *    its `isSigner` and `isWritable` into whatever is already recorded for that key.
 *    A program id enters with both flags false, so it lands among the readonly
 *    non-signers unless some instruction also names it as an account.
 * 2. The fee payer is forced to signer and writable, and is removed from the sorted
 *    body so it can be placed first unconditionally. Index 0 being the fee payer is
 *    what makes single-signer signature placement trivial.
 * 3. The remaining keys are grouped in wire order, sorted within each group.
 * 4. The header's three counts are read off the group sizes.
 *
 * Nonce accounts are not special-cased. Upstream marks them so that a durable-nonce
 * transaction's nonce account is never moved into an address lookup table; this
 * compiler emits no lookup tables at all, so the mark would have nothing to affect.
 */
function compileAccountKeys(message: SolanaMessage): { accountKeys: SolanaAddress[]; header: SolanaMessageHeader } {
  const roles = new Map<SolanaAddress, AccountRole>();

  const roleFor = (pubkey: SolanaAddress): AccountRole => {
    const existing = roles.get(pubkey);
    if (existing) return existing;
    const created: AccountRole = { isSigner: false, isWritable: false };
    roles.set(pubkey, created);
    return created;
  };

  for (const instruction of message.instructions) {
    roleFor(instruction.programId);
    for (const account of instruction.accounts) {
      const role = roleFor(account.pubkey);
      role.isSigner = role.isSigner || account.isSigner;
      role.isWritable = role.isWritable || account.isWritable;
    }
  }

  roles.delete(message.feePayer);

  const sorted = [...roles.entries()]
    .map(([pubkey, role]) => ({ pubkey, role, bytes: decode32Bytes(pubkey) }))
    .sort((left, right) => compareAddressBytes(left.bytes, right.bytes));

  const inGroup = (isSigner: boolean, isWritable: boolean) =>
    sorted.filter(entry => entry.role.isSigner === isSigner && entry.role.isWritable === isWritable).map(entry => entry.pubkey);

  const writableSigners = [message.feePayer, ...inGroup(true, true)];
  const readonlySigners = inGroup(true, false);
  const writableNonSigners = inGroup(false, true);
  const readonlyNonSigners = inGroup(false, false);

  const accountKeys = [...writableSigners, ...readonlySigners, ...writableNonSigners, ...readonlyNonSigners];

  if (accountKeys.length > 0xff) {
    throw new RainbowError(`[solana/message]: ${accountKeys.length} account keys exceeds the single-byte index space`);
  }

  return {
    accountKeys,
    header: {
      numRequiredSignatures: writableSigners.length + readonlySigners.length,
      numReadonlySignedAccounts: readonlySigners.length,
      numReadonlyUnsignedAccounts: readonlyNonSigners.length,
    },
  };
}

function serializeInstruction(instruction: SolanaInstruction, accountKeys: readonly SolanaAddress[]): Uint8Array {
  const indexOf = (pubkey: SolanaAddress): number => {
    const index = accountKeys.indexOf(pubkey);
    if (index < 0) throw new RainbowError('[solana/message]: instruction referenced a key absent from the compiled table');
    return index;
  };

  const accountIndexes = new Uint8Array(instruction.accounts.map(account => indexOf(account.pubkey)));

  return concatBytes(
    new Uint8Array([indexOf(instruction.programId)]),
    encodeCompactU16(accountIndexes.length),
    accountIndexes,
    encodeCompactU16(instruction.data.length),
    instruction.data
  );
}

/**
 * Compiles a message into the exact bytes that get signed.
 *
 * Wire layout, verified against `anza-xyz/solana-sdk@58ca02e8`. Legacy is
 * `message/src/legacy.rs:109-130`; v0 adds the `0x80` prefix
 * (`message/src/versions/mod.rs:42,248-252`) and a trailing address-table-lookup
 * array (`message/src/versions/v0/mod.rs:87-104`):
 *
 * ```
 * [0x80]                        v0 only
 * header                        3 bytes, in the order the type declares
 * account_keys                  compact-u16 count, then 32 bytes each
 * recent_blockhash              32 bytes
 * instructions                  compact-u16 count, then each:
 *                                 program_id_index  u8
 *                                 account_indexes   compact-u16 count, then u8 each
 *                                 data              compact-u16 count, then bytes
 * address_table_lookups         v0 only: compact-u16 count, always 0 here
 * ```
 *
 * **The v0 lookup array is always empty and that is a scope statement, not a stub.**
 * A v0 message with no lookups is a complete, valid v0 message and is what a wallet
 * sends when it has no table to draw on; address lookup tables are an optional feature
 * of the format that no type in this module expresses, so nothing here is half-built.
 */
export function compileSolanaMessage(message: SolanaMessage): CompiledSolanaMessage {
  if (message.instructions.length === 0) {
    throw new RainbowError('[solana/message]: a message must carry at least one instruction');
  }

  const { accountKeys, header } = compileAccountKeys(message);

  const parts: Uint8Array[] = [];
  if (message.version === 'v0') parts.push(new Uint8Array([MESSAGE_VERSION_PREFIX]));

  parts.push(
    new Uint8Array([header.numRequiredSignatures, header.numReadonlySignedAccounts, header.numReadonlyUnsignedAccounts]),
    encodeCompactU16(accountKeys.length),
    ...accountKeys.map(decode32Bytes),
    decode32Bytes(message.recentBlockhash),
    encodeCompactU16(message.instructions.length),
    ...message.instructions.map(instruction => serializeInstruction(instruction, accountKeys))
  );

  if (message.version === 'v0') parts.push(encodeCompactU16(0));

  return { accountKeys, header, bytes: concatBytes(...parts) };
}
