import { type SolanaAddress } from '../address';
import { type SolanaFeeParams } from './fee';
import { type SolanaBlockhash } from './transaction/blockhash';
import { createSetComputeUnitLimitInstruction, createSetComputeUnitPriceInstruction } from './transaction/computeBudget';
import { type SolanaMessage } from './transaction/message';
import { createSolanaTransferInstruction } from './transaction/systemProgram';

/**
 * Everything a native SOL transfer needs that does not come from the network.
 *
 * `to` is a `SolanaAddress`, which asserts syntax and nothing else. A recipient gate is
 * a network call or it does not exist, so this type
 * does not pretend to carry a checked destination; see `createSolanaTransferInstruction`
 * for the full reasoning.
 */
export type SolanaTransferIntent = {
  readonly from: SolanaAddress;
  readonly to: SolanaAddress;
  readonly lamports: bigint;
  readonly feeParams: SolanaFeeParams;
};

/**
 * Assembles the message for a transfer: the two compute-budget instructions, then the
 * transfer itself.
 *
 * Pure, and that is the point. Everything from here down is testable with no network,
 * no keychain, no React and no store, which is where the key layer's SLIP-0010 vectors
 * already put derivation.
 *
 * **The compute-budget instructions are attached here rather than in the orchestration.**
 * That placement ages better because SIMD-0385 would remove these instructions from the
 * protocol entirely, and when that lands the change is confined to this function.
 *
 * Instruction order is the conventional one, budget before the work. It is not
 * load-bearing for the runtime, which processes them in sequence with no interaction
 * between a budget request and a transfer, but the compiled account table depends on
 * instruction order, so keeping it stable keeps compiled messages comparable across
 * runs.
 */
export function buildSolanaTransferMessage(args: {
  readonly intent: SolanaTransferIntent;
  readonly blockhash: SolanaBlockhash;
  readonly version?: 'legacy' | 'v0';
}): SolanaMessage {
  const { intent, blockhash, version = 'legacy' } = args;

  return {
    version,
    feePayer: intent.from,
    recentBlockhash: blockhash,
    instructions: [
      createSetComputeUnitLimitInstruction(intent.feeParams.computeUnitLimit),
      createSetComputeUnitPriceInstruction(intent.feeParams.computeUnitPriceMicroLamports),
      createSolanaTransferInstruction({ from: intent.from, to: intent.to, lamports: intent.lamports }),
    ],
  };
}
