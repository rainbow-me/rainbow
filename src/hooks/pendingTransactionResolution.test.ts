const mockFetchRawTransaction = jest.fn();
const mockGetStatus = jest.fn();

jest.mock('@/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
  RainbowError: class RainbowError extends Error {},
}));

jest.mock('@/resources/transactions/transaction', () => ({
  fetchRawTransaction: (...args: unknown[]) => mockFetchRawTransaction(...args),
}));

jest.mock('@/features/delegation/relayService', () => ({
  relayService: {
    getStatus: (...args: unknown[]) => mockGetStatus(...args),
  },
}));

import { TransactionStatus } from '@/entities/transactions';
import { logger } from '@/logger';
import { resolvePendingTransaction } from './pendingTransactionResolution';

describe('pendingTransactionResolution', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('tracks a managed transaction by relay status even after an onchain hash appears', async () => {
    mockGetStatus.mockResolvedValue(
      buildRelayStatus({
        status: 'PENDING',
        txHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
      })
    );
    mockFetchRawTransaction.mockResolvedValue({
      ...buildManagedPendingTransaction(),
      hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
      status: TransactionStatus.pending,
    });

    const resolution = await resolvePendingTransaction({
      abortController: null,
      address: '0x123',
      currency: 'ETH',
      transaction: buildManagedPendingTransaction(),
    });

    expect(resolution).toEqual({
      kind: 'pending',
      transaction: expect.objectContaining({
        hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
        relayExecutionId: 'execution-1',
      }),
    });
    expect(mockFetchRawTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        address: '0x123',
        chainId: 8453,
        currency: 'ETH',
        hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
      })
    );
  });

  it('emits a failed toast transaction when relay fails before an onchain hash exists', async () => {
    mockGetStatus.mockResolvedValue(
      buildRelayStatus({
        status: 'FAILED',
      })
    );

    const resolution = await resolvePendingTransaction({
      abortController: null,
      address: '0x123',
      currency: 'ETH',
      transaction: buildManagedPendingTransaction(),
    });

    expect(resolution).toEqual({
      kind: 'toast',
      transaction: expect.objectContaining({
        hash: 'execution-1',
        relayExecutionId: 'execution-1',
        status: TransactionStatus.failed,
        title: 'swap.failed',
      }),
    });
  });

  it('emits a failed toast transaction when relay fails after an onchain hash exists', async () => {
    mockGetStatus.mockResolvedValue(
      buildRelayStatus({
        status: 'FAILED',
        txHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
      })
    );

    const resolution = await resolvePendingTransaction({
      abortController: null,
      address: '0x123',
      currency: 'ETH',
      transaction: {
        ...buildManagedPendingTransaction(),
        hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
      },
    });

    expect(resolution).toEqual({
      kind: 'toast',
      transaction: expect.objectContaining({
        hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
        relayExecutionId: 'execution-1',
        status: TransactionStatus.failed,
        title: 'swap.failed',
      }),
    });
    expect(mockFetchRawTransaction).not.toHaveBeenCalled();
  });

  it('drops a managed placeholder once relay reports confirmed without onchain evidence', async () => {
    mockGetStatus.mockResolvedValue(
      buildRelayStatus({
        status: 'CONFIRMED',
      })
    );

    const resolution = await resolvePendingTransaction({
      abortController: null,
      address: '0x123',
      currency: 'ETH',
      transaction: buildManagedPendingTransaction(),
    });

    expect(resolution).toEqual({
      kind: 'toast',
      transaction: expect.objectContaining({
        hash: 'execution-1',
        relayExecutionId: 'execution-1',
        status: TransactionStatus.confirmed,
        title: 'swap.confirmed',
      }),
    });
    expect(logger.warn).toHaveBeenCalledWith(
      '[resolvePendingTransaction]: managed relay execution finished without onchain transaction evidence',
      expect.objectContaining({
        executionId: 'execution-1',
        status: 'CONFIRMED',
      })
    );
  });

  it('treats a fetched confirmed onchain transaction as mined', async () => {
    mockFetchRawTransaction.mockResolvedValue({
      ...buildOnchainPendingTransaction(),
      blockNumber: 1,
      confirmations: 1,
      hash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      minedAt: 100,
      status: TransactionStatus.confirmed,
    });

    const resolution = await resolvePendingTransaction({
      abortController: null,
      address: '0x123',
      currency: 'ETH',
      transaction: buildOnchainPendingTransaction(),
    });

    expect(resolution).toEqual({
      kind: 'mined',
      transaction: expect.objectContaining({
        blockNumber: 1,
        confirmations: 1,
        hash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        minedAt: 100,
        status: TransactionStatus.confirmed,
        title: 'swap.confirmed',
      }),
    });
    expect(mockFetchRawTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        address: '0x123',
        chainId: 8453,
        currency: 'ETH',
        hash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      })
    );
  });
});

function buildManagedPendingTransaction() {
  return {
    asset: null,
    chainId: 8453,
    from: null,
    hash: 'execution-1',
    network: 'Base',
    nonce: 7,
    relayExecutionId: 'execution-1',
    status: TransactionStatus.pending,
    title: 'swap.pending',
    to: null,
    type: 'swap' as const,
  };
}

function buildOnchainPendingTransaction() {
  return {
    asset: null,
    chainId: 8453,
    from: null,
    hash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    network: 'Base',
    nonce: 7,
    status: TransactionStatus.pending,
    title: 'swap.pending',
    to: null,
    type: 'swap' as const,
  };
}

function buildRelayStatus({ status, txHash }: { status: 'PENDING' | 'FAILED' | 'CONFIRMED'; txHash?: `0x${string}` }) {
  return {
    status: {
      status,
      updatedAtMs: 0,
      onchain: txHash
        ? {
            type: 'singlechain' as const,
            origin: {
              chainId: 8453,
              txHashes: [txHash],
            },
          }
        : undefined,
    },
  };
}
