import { RainbowError } from '@/logger';

/**
 * The per-signature base fee, in lamports. Fixed at 5,000 per signature.
 */
export const SOLANA_LAMPORTS_PER_SIGNATURE = 5_000n;

/** Micro-lamports per lamport: the unit the priority fee is quoted in. */
const MICRO_LAMPORTS_PER_LAMPORT = 1_000_000n;

/**
 * What a native SOL transfer built by `buildSolanaTransferMessage` actually consumes,
 * measured on a validator rather than assumed: **450 compute units** for its three
 * instructions, the two compute-budget ones plus the transfer.
 *
 * Recorded as a constant because the number is a trap for the next caller. A requested
 * limit of exactly 450 works and leaves **zero** headroom, so adding one instruction to
 * the message makes the transaction fail for exceeding its own budget while the fee is
 * unchanged. Size the request from this figure plus the cost of whatever else is added;
 * do not copy 450 forward.
 */
export const SOLANA_NATIVE_TRANSFER_COMPUTE_UNITS = 450;

/**
 * The largest compute-unit limit the runtime will honour, and therefore the largest it
 * will charge for. Read from `agave@00bf3c6` `program-runtime/src/execution_budget.rs:26`;
 * `runtime-transaction/src/transaction_meta.rs:170` is where the clamp is applied.
 */
export const SOLANA_MAX_COMPUTE_UNIT_LIMIT = 1_400_000;

const U32_MAX = 0xffffffff;
const U64_MAX = (1n << 64n) - 1n;

export type SolanaFeeParams = {
  /** u32. The limit requested through `SetComputeUnitLimit`. */
  readonly computeUnitLimit: number;
  /** u64. Micro-lamports per compute unit, through `SetComputeUnitPrice`. */
  readonly computeUnitPriceMicroLamports: bigint;
};

/**
 * The fee arithmetic: 5,000 lamports per signature, plus
 * `ceil(price x requested limit / 1e6)` for the priority component.
 *
 * **Charged on the requested limit rather than on consumption**, confirmed by
 * reproducing two real mainnet transactions' fees to the lamport. An EVM
 * reader should read that twice: there is no refund of the unused portion, so raising
 * the limit raises the fee.
 *
 * **The priority half prices the clamped limit, not the requested one.** The runtime caps
 * a requested limit at `MAX_COMPUTE_UNIT_LIMIT` and prices the capped value: agave's
 * `program-runtime/src/execution_budget.rs:26` declares the constant as 1,400,000 and
 * `runtime-transaction/src/transaction_meta.rs:170` applies `.min(MAX_COMPUTE_UNIT_LIMIT)`.
 * Pricing the raw request instead over-estimates for any limit above the cap, by 40% at
 * four million units, and the instruction builder accepts values that high because a `u32`
 * does.
 *
 * **This is a model, and the cluster is the authority.** Anything shown to a user is
 * read from `getFeeForMessage` on the compiled
 * message instead; this function exists for the estimate needed before a message
 * exists, which is the only case where there is nothing to ask the cluster about.
 */
export function solanaTransactionFeeLamports(args: { readonly signatureCount: number; readonly feeParams: SolanaFeeParams }): bigint {
  const { signatureCount, feeParams } = args;

  if (!Number.isInteger(signatureCount) || signatureCount < 1) {
    throw new RainbowError(`[solana/fee]: signature count must be a positive integer, received ${signatureCount}`);
  }
  // The same ranges the instruction builders enforce, so a value that reaches the wire
  // cannot be one this arithmetic silently mis-prices.
  if (!Number.isInteger(feeParams.computeUnitLimit) || feeParams.computeUnitLimit < 0 || feeParams.computeUnitLimit > U32_MAX) {
    throw new RainbowError(
      `[solana/fee]: compute unit limit must be an integer in [0, ${U32_MAX}], received ${feeParams.computeUnitLimit}`
    );
  }
  if (feeParams.computeUnitPriceMicroLamports < 0n || feeParams.computeUnitPriceMicroLamports > U64_MAX) {
    throw new RainbowError(
      `[solana/fee]: compute unit price must fit an unsigned 64-bit integer, received ${feeParams.computeUnitPriceMicroLamports}`
    );
  }

  const base = SOLANA_LAMPORTS_PER_SIGNATURE * BigInt(signatureCount);

  const chargeableUnits = Math.min(feeParams.computeUnitLimit, SOLANA_MAX_COMPUTE_UNIT_LIMIT);
  const priorityMicroLamports = feeParams.computeUnitPriceMicroLamports * BigInt(chargeableUnits);
  const priority =
    priorityMicroLamports === 0n ? 0n : (priorityMicroLamports + MICRO_LAMPORTS_PER_LAMPORT - 1n) / MICRO_LAMPORTS_PER_LAMPORT;

  return base + priority;
}
