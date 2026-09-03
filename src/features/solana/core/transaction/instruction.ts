import { type SolanaAddress } from '../../address';

/**
 * One account an instruction touches, with the two flags the runtime needs: whether
 * this account must sign the transaction, and whether the instruction may modify it.
 *
 * Both flags are per-instruction requests rather than properties of the account. The
 * message compiler takes the union across every instruction that names the same
 * account, so an account that is writable in one instruction and readonly in another
 * is writable in the compiled message.
 */
export type SolanaAccountMeta = {
  readonly pubkey: SolanaAddress;
  readonly isSigner: boolean;
  readonly isWritable: boolean;
};

/**
 * A single instruction: which program runs, which accounts it may touch, and the
 * opaque payload that program parses.
 *
 * This is the type `@rainbow-me/sdk`'s `Call` cannot express.
 * `{to: Address, data: Hex, value?: bigint}` has one destination and no field for an
 * ordered array of account metas carrying signer and writability flags, and the order
 * is load-bearing: a program addresses its accounts by position, not by name.
 *
 * `data` is `Uint8Array` and not a hex string: nine copies of `buffer` at
 * three major versions sit in this app's dependency tree, and every Solana production
 * file in it references `Buffer` zero times. Keep it that way.
 */
export type SolanaInstruction = {
  readonly programId: SolanaAddress;
  readonly accounts: readonly SolanaAccountMeta[];
  readonly data: Uint8Array;
};
