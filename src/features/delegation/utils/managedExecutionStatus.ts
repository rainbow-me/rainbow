import type { Hash } from 'viem';

import { type RainbowTransaction } from '@/entities/transactions';
import { type RelayOnchainEvidence, type RelayOnchainTransactions, type RelayStatusSnapshot } from '@rainbow-me/sdk';

type RelayEvmTransactions = Extract<RelayOnchainTransactions, { kind: 'evm' }>;

/**
 * Applies relay onchain hashes onto a local managed transaction overlay.
 */
export function applyManagedExecutionStatus<T extends RainbowTransaction>(transaction: T, status: Pick<RelayStatusSnapshot, 'onchain'>): T {
  const source = status.onchain?.source;
  const destination = status.onchain?.destination;
  const nextHash = (isRelayEvmTransactions(source) ? source.hashes[0] : undefined) ?? transaction.hash;
  const nextDestinationTxHashes = isRelayEvmTransactions(destination) ? destination.hashes : transaction.relayDestinationTxHashes;

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
 * Returns every EVM transaction group in relay evidence, ignoring unsupported
 * Solana evidence without projecting it into Rainbow's EVM transaction model.
 */
export function getRelayEvmTransactions(onchain: RelayOnchainEvidence): readonly RelayEvmTransactions[] {
  return [onchain.source, onchain.destination].filter(isRelayEvmTransactions);
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

function isRelayEvmTransactions(transactions: RelayOnchainTransactions | undefined): transactions is RelayEvmTransactions {
  return transactions?.kind === 'evm';
}
