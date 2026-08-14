import type { Hash } from 'viem';

import { type RainbowTransaction } from '@/entities/transactions';
import { type RelayOnchainEvidence, type RelayOnchainTransactions, type RelayStatusSnapshot } from '@rainbow-me/sdk';

type RelayEvmTransactions = Extract<RelayOnchainTransactions, { kind: 'evm' }>;

/**
 * Applies relay onchain hashes onto a local managed transaction overlay.
 */
export function applyManagedExecutionStatus<T extends RainbowTransaction>(transaction: T, status: Pick<RelayStatusSnapshot, 'onchain'>): T {
  const originTxHash = readOriginEvmTransactions(status.onchain)?.hashes[0];
  const nextHash = originTxHash ?? transaction.hash;
  const nextDestinationTxHashes = readDestinationEvmTransactions(status.onchain)?.hashes ?? transaction.relayDestinationTxHashes;

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
  if (onchain.scope === 'singlechain' || onchain.observed !== 'both') {
    return isRelayEvmTransactions(onchain.transactions) ? [onchain.transactions] : [];
  }

  return [onchain.origin, onchain.destination].filter(isRelayEvmTransactions);
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

function readOriginEvmTransactions(onchain: RelayStatusSnapshot['onchain']): RelayEvmTransactions | undefined {
  if (!onchain) return undefined;

  if (onchain.scope === 'singlechain') {
    return isRelayEvmTransactions(onchain.transactions) ? onchain.transactions : undefined;
  }

  const origin = onchain.observed === 'both' ? onchain.origin : onchain.observed === 'origin' ? onchain.transactions : undefined;
  return origin && isRelayEvmTransactions(origin) ? origin : undefined;
}

function readDestinationEvmTransactions(onchain: RelayStatusSnapshot['onchain']): RelayEvmTransactions | undefined {
  if (!onchain || onchain.scope !== 'crosschain') return undefined;

  const destination =
    onchain.observed === 'both' ? onchain.destination : onchain.observed === 'destination' ? onchain.transactions : undefined;
  return destination && isRelayEvmTransactions(destination) ? destination : undefined;
}

function isRelayEvmTransactions(transactions: RelayOnchainTransactions): transactions is RelayEvmTransactions {
  return transactions.kind === 'evm';
}
