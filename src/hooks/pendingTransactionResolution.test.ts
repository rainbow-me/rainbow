import { TransactionDirection, TransactionStatus } from '@/entities/transactions';
import { logger } from '@/logger';

import { resolveTrackedTransaction } from './pendingTransactionResolution';

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

jest.mock('@/features/delegation/utils/relayService', () => ({
  relayService: {
    getStatus: (...args: unknown[]) => mockGetStatus(...args),
  },
}));

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

    const resolution = await resolveTrackedTransaction({
      abortController: null,
      address: '0x123',
      currency: 'ETH',
      transaction: buildManagedPendingTransaction(),
    });

    expect(resolution).toMatchObject({
      kind: 'pending',
      transaction: expect.objectContaining({
        hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
        relayExecutionId: 'execution-1',
      }),
    });
    expect(resolution.relayStatus?.status).toBe('PENDING');
    expect(mockFetchRawTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        address: '0x123',
        chainId: 8453,
        currency: 'ETH',
        hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
      })
    );
  });

  it('keeps an unchanged onchain pending transaction while the backend has not indexed it yet', async () => {
    const transaction = buildOnchainPendingTransaction();
    mockFetchRawTransaction.mockResolvedValue(null);

    const resolution = await resolveTrackedTransaction({
      abortController: null,
      address: '0x123',
      currency: 'ETH',
      transaction,
    });

    expect(resolution).toMatchObject({
      kind: 'pending',
      transaction,
    });
    expect(resolution.transaction).toBe(transaction);
  });

  it('keeps a managed pending transaction unchanged while relay is still working and no hash exists', async () => {
    const transaction = buildManagedPendingTransaction();
    mockGetStatus.mockResolvedValue(
      buildRelayStatus({
        status: 'PENDING',
      })
    );

    const resolution = await resolveTrackedTransaction({
      abortController: null,
      address: '0x123',
      currency: 'ETH',
      transaction,
    });

    expect(resolution).toMatchObject({
      kind: 'pending',
      transaction,
    });
    expect(resolution.transaction).toBe(transaction);
    expect(mockFetchRawTransaction).not.toHaveBeenCalled();
  });

  it('keeps a confirmed managed transaction settled when relay refresh fails', async () => {
    mockGetStatus.mockRejectedValue(new Error('relay unavailable'));

    const resolution = await resolveTrackedTransaction({
      abortController: null,
      address: '0x123',
      currency: 'ETH',
      transaction: buildManagedConfirmedTransaction(),
    });

    expect(resolution).toMatchObject({
      kind: 'settled',
      transaction: expect.objectContaining({
        hash: 'execution-1',
        relayExecutionId: 'execution-1',
        status: TransactionStatus.confirmed,
        title: 'swap.confirmed',
      }),
    });
  });

  it('keeps a confirmed managed transaction settled while relay exposes a late origin hash', async () => {
    mockGetStatus.mockResolvedValue(
      buildRelayStatus({
        status: 'PENDING',
        txHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
      })
    );

    const resolution = await resolveTrackedTransaction({
      abortController: null,
      address: '0x123',
      currency: 'ETH',
      transaction: buildManagedConfirmedTransaction(),
    });

    expect(resolution).toMatchObject({
      kind: 'settled',
      transaction: expect.objectContaining({
        hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
        relayExecutionId: 'execution-1',
        status: TransactionStatus.confirmed,
        title: 'swap.confirmed',
      }),
    });
    expect(mockFetchRawTransaction).not.toHaveBeenCalled();
  });

  it('settles a managed failure before an onchain hash exists', async () => {
    mockGetStatus.mockResolvedValue(
      buildRelayStatus({
        status: 'FAILED',
      })
    );

    const resolution = await resolveTrackedTransaction({
      abortController: null,
      address: '0x123',
      currency: 'ETH',
      transaction: buildManagedPendingTransaction(),
    });

    expect(resolution).toMatchObject({
      kind: 'settled',
      transaction: expect.objectContaining({
        hash: 'execution-1',
        relayExecutionId: 'execution-1',
        status: TransactionStatus.failed,
        title: 'swap.failed',
      }),
    });
  });

  it('resolves a relay-confirmed managed transaction immediately once an onchain hash exists', async () => {
    mockGetStatus.mockResolvedValue(
      buildRelayStatus({
        status: 'CONFIRMED',
        txHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
      })
    );

    const resolution = await resolveTrackedTransaction({
      abortController: null,
      address: '0x123',
      currency: 'ETH',
      transaction: buildManagedPendingTransaction(),
    });

    expect(resolution).toMatchObject({
      kind: 'settled',
      transaction: expect.objectContaining({
        hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
        relayExecutionId: 'execution-1',
        status: TransactionStatus.confirmed,
        title: 'swap.confirmed',
      }),
    });
    expect(mockFetchRawTransaction).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('resolves a plain confirmed transaction even before mined metadata arrives', async () => {
    const asset = {
      address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      chainId: 8453,
      decimals: 18,
      name: 'Token A',
      network: 'Base',
      symbol: 'TKNA',
      uniqueId: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa_8453',
    };

    const originalTransaction = {
      ...buildOnchainPendingTransaction(),
      changes: [
        {
          asset,
          direction: TransactionDirection.OUT,
        },
      ],
    };

    mockFetchRawTransaction.mockResolvedValue({
      ...buildOnchainPendingTransaction(),
      changes: [],
      status: TransactionStatus.confirmed,
    });

    const resolution = await resolveTrackedTransaction({
      abortController: null,
      address: '0x123',
      currency: 'ETH',
      transaction: originalTransaction,
    });

    expect(resolution).toEqual({
      kind: 'settled',
      transaction: expect.objectContaining({
        changes: originalTransaction.changes,
        hash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        status: TransactionStatus.confirmed,
        title: 'swap.confirmed',
      }),
    });
  });

  it('settles a managed failure after an onchain hash exists', async () => {
    mockGetStatus.mockResolvedValue(
      buildRelayStatus({
        status: 'FAILED',
        txHash: '0x2222222222222222222222222222222222222222222222222222222222222222',
      })
    );

    const resolution = await resolveTrackedTransaction({
      abortController: null,
      address: '0x123',
      currency: 'ETH',
      transaction: buildManagedPendingTransaction(),
    });

    expect(resolution).toMatchObject({
      kind: 'settled',
      transaction: expect.objectContaining({
        hash: '0x2222222222222222222222222222222222222222222222222222222222222222',
        relayExecutionId: 'execution-1',
        status: TransactionStatus.failed,
        title: 'swap.failed',
      }),
    });
    expect(mockFetchRawTransaction).not.toHaveBeenCalled();
  });

  it('trusts relay confirmation even when onchain evidence has not been attached yet', async () => {
    mockGetStatus.mockResolvedValue(
      buildRelayStatus({
        status: 'CONFIRMED',
      })
    );

    const resolution = await resolveTrackedTransaction({
      abortController: null,
      address: '0x123',
      currency: 'ETH',
      transaction: buildManagedPendingTransaction(),
    });

    expect(resolution).toMatchObject({
      kind: 'settled',
      transaction: expect.objectContaining({
        hash: 'execution-1',
        relayExecutionId: 'execution-1',
        status: TransactionStatus.confirmed,
        title: 'swap.confirmed',
      }),
    });
    expect(logger.warn).toHaveBeenCalledWith(
      '[resolveTrackedTransaction]: managed relay execution finished without onchain transaction evidence',
      expect.objectContaining({
        executionId: 'execution-1',
        status: 'CONFIRMED',
      })
    );
  });

  it('preserves mined metadata when the fetched onchain transaction is fully indexed', async () => {
    mockFetchRawTransaction.mockResolvedValue({
      ...buildOnchainPendingTransaction(),
      blockNumber: 1,
      confirmations: 1,
      hash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      minedAt: 100,
      status: TransactionStatus.confirmed,
    });

    const resolution = await resolveTrackedTransaction({
      abortController: null,
      address: '0x123',
      currency: 'ETH',
      transaction: buildOnchainPendingTransaction(),
    });

    expect(resolution).toMatchObject({
      kind: 'settled',
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

  it('resolves through the onchain owner when relay is still pending but mined metadata already exists', async () => {
    mockGetStatus.mockResolvedValue(
      buildRelayStatus({
        status: 'PENDING',
        txHash: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      })
    );
    mockFetchRawTransaction.mockResolvedValue({
      ...buildOnchainPendingTransaction(),
      blockNumber: 1,
      confirmations: 1,
      hash: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      minedAt: 100,
      status: TransactionStatus.confirmed,
    });

    const resolution = await resolveTrackedTransaction({
      abortController: null,
      address: '0x123',
      currency: 'ETH',
      transaction: buildManagedPendingTransaction(),
    });

    expect(resolution).toMatchObject({
      kind: 'settled',
      transaction: expect.objectContaining({
        blockNumber: 1,
        confirmations: 1,
        hash: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        minedAt: 100,
        relayExecutionId: 'execution-1',
        status: TransactionStatus.confirmed,
        title: 'swap.confirmed',
      }),
    });
    expect(mockFetchRawTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        address: '0x123',
        chainId: 8453,
        currency: 'ETH',
        hash: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      })
    );
    expect(logger.warn).not.toHaveBeenCalled();
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

function buildManagedConfirmedTransaction() {
  return {
    ...buildManagedPendingTransaction(),
    status: TransactionStatus.confirmed,
    title: 'swap.confirmed',
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
