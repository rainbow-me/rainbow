import { RainbowError } from '@/logger';

import { requireSolanaAddress, type SolanaAddress } from '../../address';
import { type SolanaInstruction } from './instruction';

/**
 * The Compute Budget program's address, validated through the address guard rather than
 * cast.
 */
export const SOLANA_COMPUTE_BUDGET_PROGRAM_ADDRESS: SolanaAddress = requireSolanaAddress(
  'ComputeBudget111111111111111111111111111111',
  '[solana/computeBudget]: the Compute Budget program address constant is malformed'
);

/**
 * Discriminators for the two instructions this module builds, verified against primary
 * source. Unlike the System Program's bincode encoding, these are a single
 * discriminator byte followed by a little-endian value, with no accounts at all.
 */
const SET_COMPUTE_UNIT_LIMIT_DISCRIMINATOR = 2;
const SET_COMPUTE_UNIT_PRICE_DISCRIMINATOR = 3;

const U32_MAX = 0xffffffff;
const U64_MAX = (1n << 64n) - 1n;

/**
 * Requests a compute-unit limit for the transaction.
 *
 * **The fee is charged on this requested limit, not on what the transaction consumes**
 * which is the opposite of the EVM intuition that unused gas returns.
 * So this number is a price, not a safety margin.
 */
export function createSetComputeUnitLimitInstruction(units: number): SolanaInstruction {
  if (!Number.isInteger(units) || units < 0 || units > U32_MAX) {
    throw new RainbowError(`[solana/computeBudget]: compute unit limit must be an integer in [0, ${U32_MAX}], received ${units}`);
  }

  const data = new Uint8Array(1 + 4);
  data[0] = SET_COMPUTE_UNIT_LIMIT_DISCRIMINATOR;
  new DataView(data.buffer).setUint32(1, units, true);
  return { programId: SOLANA_COMPUTE_BUDGET_PROGRAM_ADDRESS, accounts: [], data };
}

/** Sets the priority fee, in micro-lamports per compute unit. */
export function createSetComputeUnitPriceInstruction(microLamports: bigint): SolanaInstruction {
  if (microLamports < 0n || microLamports > U64_MAX) {
    throw new RainbowError(`[solana/computeBudget]: compute unit price must fit an unsigned 64-bit integer, received ${microLamports}`);
  }

  const data = new Uint8Array(1 + 8);
  data[0] = SET_COMPUTE_UNIT_PRICE_DISCRIMINATOR;
  new DataView(data.buffer).setBigUint64(1, microLamports, true);
  return { programId: SOLANA_COMPUTE_BUDGET_PROGRAM_ADDRESS, accounts: [], data };
}
