import { BigNumber, type BigNumberish } from '@ethersproject/bignumber';
import { hexlify, type BytesLike } from '@ethersproject/bytes';

export type ReplayableCall = {
  to: string;
  data: string;
  value: string;
};

export type ReplayableTransaction = {
  to?: string | null;
  data?: BytesLike;
  value?: BigNumberish;
};

export type ReplayableExecution = {
  hash: string;
  nonce: number;
  replayableCall: ReplayableCall | null;
};

type ReplayableExecutionTransaction = ReplayableTransaction & {
  hash?: string | null;
  nonce?: number | null;
};

/**
 * Returns speed-up/cancel calldata from a transaction payload.
 * When provided, fallback fields fill missing primary fields.
 */
export function extractReplayableCall(transaction: ReplayableTransaction, fallback?: ReplayableTransaction | null): ReplayableCall | null {
  const to = transaction.to ?? fallback?.to;
  const data = transaction.data ?? fallback?.data;
  const value = transaction.value ?? fallback?.value;

  if (!to || data == null || value == null) return null;

  return {
    to,
    data: typeof data === 'string' ? data : hexlify(data),
    value: BigNumber.from(value).toString(),
  };
}

/**
 * Extracts replay metadata from a broadcast result when nonce/hash are present.
 */
export function extractReplayableExecution(
  transaction: ReplayableExecutionTransaction | null | undefined,
  fallback?: ReplayableTransaction | null
): ReplayableExecution | null {
  if (!transaction?.hash || transaction.nonce == null) return null;

  return {
    hash: transaction.hash,
    nonce: transaction.nonce,
    replayableCall: extractReplayableCall(transaction, fallback),
  };
}
