import { describe, expect, it } from '@jest/globals';
import type { Hash } from 'viem';

import { TransactionStatus, type RainbowTransaction } from '@/entities/transactions';
import { type RelayOnchainEvidence } from '@rainbow-me/sdk';

import { applyManagedExecutionStatus, getRelayEvmTransactions } from './managedExecutionStatus';

const INITIAL_HASH: Hash = '0x0101010101010101010101010101010101010101010101010101010101010101';
const SOURCE_HASH: Hash = '0x0202020202020202020202020202020202020202020202020202020202020202';
const DESTINATION_HASH: Hash = '0x0303030303030303030303030303030303030303030303030303030303030303';

const SOURCE_EVIDENCE: RelayOnchainEvidence = {
  source: {
    chainId: 8453,
    hashes: [SOURCE_HASH],
    kind: 'evm',
  },
};

const DESTINATION_EVIDENCE: RelayOnchainEvidence = {
  destination: {
    chainId: 10,
    hashes: [DESTINATION_HASH],
    kind: 'evm',
  },
};

describe('managedExecutionStatus', () => {
  it('applies source-only EVM evidence to the tracked transaction hash', () => {
    const transaction = buildTransaction();

    const updatedTransaction = applyManagedExecutionStatus(transaction, { onchain: SOURCE_EVIDENCE });

    expect(updatedTransaction.hash).toBe(SOURCE_HASH);
    expect(updatedTransaction.relayDestinationTxHashes).toBeUndefined();
  });

  it('applies destination-only EVM evidence without replacing the tracked source hash', () => {
    const transaction = buildTransaction();

    const updatedTransaction = applyManagedExecutionStatus(transaction, { onchain: DESTINATION_EVIDENCE });

    expect(updatedTransaction.hash).toBe(INITIAL_HASH);
    expect(updatedTransaction.relayDestinationTxHashes).toEqual([DESTINATION_HASH]);
  });

  it('returns the observed EVM location from partial evidence', () => {
    expect(getRelayEvmTransactions(SOURCE_EVIDENCE)).toEqual([SOURCE_EVIDENCE.source]);
    expect(getRelayEvmTransactions(DESTINATION_EVIDENCE)).toEqual([DESTINATION_EVIDENCE.destination]);
  });
});

function buildTransaction(): RainbowTransaction {
  return {
    asset: null,
    chainId: 8453,
    from: null,
    hash: INITIAL_HASH,
    network: 'Base',
    nonce: 7,
    status: TransactionStatus.pending,
    title: 'swap.pending',
    to: null,
    type: 'swap',
  };
}
