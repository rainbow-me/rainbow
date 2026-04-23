import type { Hash } from 'viem';

import { type RainbowTransaction } from '@/entities/transactions';
import { type RelayStatusSnapshot } from '@rainbow-me/delegation';

/**
 * Applies relay onchain hashes onto a local managed transaction overlay.
 */
export function applyManagedExecutionStatus<T extends RainbowTransaction>(transaction: T, status: Pick<RelayStatusSnapshot, 'onchain'>): T {
  const originTxHash = status.onchain?.origin.txHashes[0];
  const nextHash = originTxHash ?? transaction.hash;
  const nextDestinationTxHashes = readDestinationTxHashes(status.onchain) ?? transaction.relayDestinationTxHashes;

  if (nextHash === transaction.hash && areDestinationTxHashesEqual(nextDestinationTxHashes, transaction.relayDestinationTxHashes)) {
    return transaction;
  }

  return {
    ...transaction,
    hash: nextHash,
    relayDestinationTxHashes: nextDestinationTxHashes,
  };
}

/**
 * Equality check that compares relay destination chain transaction
 * hashes. Assumes consistent hash sorting within arrays.
 */
export function areDestinationTxHashesEqual(
  currentTxHashes: readonly Hash[] | undefined,
  nextTxHashes: readonly Hash[] | undefined
): boolean {
  if (currentTxHashes === nextTxHashes) return true;

  if (!currentTxHashes || !nextTxHashes || currentTxHashes.length !== nextTxHashes.length) {
    return false;
  }

  return currentTxHashes.every((hash, index) => hash === nextTxHashes[index]);
}

function readDestinationTxHashes(onchain: RelayStatusSnapshot['onchain']): readonly Hash[] | undefined {
  if (!onchain || onchain.type !== 'crosschain' || onchain.destination.txHashes.length === 0) return undefined;
  return onchain.destination.txHashes;
}
