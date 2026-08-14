import { describe, expect, it } from '@jest/globals';
import type { Hash } from 'viem';

import { TransactionStatus, type RainbowTransaction } from '@/entities/transactions';
import { type RelayOnchainEvidence } from '@rainbow-me/sdk';

import { applyManagedExecutionStatus, getRelayEvmTransactions } from './managedExecutionStatus';

const INITIAL_HASH: Hash = '0x0101010101010101010101010101010101010101010101010101010101010101';
const ORIGIN_HASH: Hash = '0x0202020202020202020202020202020202020202020202020202020202020202';
const DESTINATION_HASH: Hash = '0x0303030303030303030303030303030303030303030303030303030303030303';

const ORIGIN_EVIDENCE: RelayOnchainEvidence = {
  scope: 'crosschain',
  observed: 'origin',
  transactions: {
    chainId: 8453,
    hashes: [ORIGIN_HASH],
    kind: 'evm',
  },
};

const DESTINATION_EVIDENCE: RelayOnchainEvidence = {
  scope: 'crosschain',
  observed: 'destination',
  transactions: {
    chainId: 10,
    hashes: [DESTINATION_HASH],
    kind: 'evm',
  },
};

describe('managedExecutionStatus', () => {
  it('applies origin-only EVM evidence to the tracked transaction hash', () => {
    const transaction = buildTransaction();

    const updatedTransaction = applyManagedExecutionStatus(transaction, { onchain: ORIGIN_EVIDENCE });

    expect(updatedTransaction.hash).toBe(ORIGIN_HASH);
    expect(updatedTransaction.relayDestinationTxHashes).toBeUndefined();
  });

  it('applies destination-only EVM evidence without replacing the tracked origin hash', () => {
    const transaction = buildTransaction();

    const updatedTransaction = applyManagedExecutionStatus(transaction, { onchain: DESTINATION_EVIDENCE });

    expect(updatedTransaction.hash).toBe(INITIAL_HASH);
    expect(updatedTransaction.relayDestinationTxHashes).toEqual([DESTINATION_HASH]);
  });

  it.each([ORIGIN_EVIDENCE, DESTINATION_EVIDENCE])('returns the observed EVM leg from partial crosschain evidence', evidence => {
    expect(getRelayEvmTransactions(evidence)).toEqual([evidence.transactions]);
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
