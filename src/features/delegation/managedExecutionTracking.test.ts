jest.mock('@/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
  RainbowError: class RainbowError extends Error {},
}));

jest.mock('@/state/pendingTransactions', () => ({
  addNewTransaction: jest.fn(),
}));

const mockHandleTransaction = jest.fn();
const mockRelayGetStatus = jest.fn();

jest.mock('@/components/rainbow-toast/useRainbowToastsStore', () => ({
  useRainbowToastsStore: {
    getState: () => ({
      handleTransaction: mockHandleTransaction,
    }),
  },
}));

jest.mock('./relayService', () => ({
  relayService: {
    intentRelay: {
      transport: {
        getStatus: (...args: [string]) => mockRelayGetStatus(...args),
      },
    },
  },
}));

import { TransactionStatus } from '@/entities/transactions';
import { addNewTransaction } from '@/state/pendingTransactions';
import { type ManagedExecutionStatusUpdate, trackManagedCallsExecution, waitForManagedExecutionOnchain } from './managedExecutionTracking';

describe('managedExecutionTracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows a pending toast immediately and later stores the relay tx by execution id', async () => {
    mockRelayGetStatus.mockResolvedValue(
      buildStatusUpdate({
        status: 'PENDING',
        txHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
      })
    );

    trackManagedCallsExecution({
      address: '0x123',
      chainId: 8453,
      executionId: 'execution-1',
      transaction: {
        asset: null,
        chainId: 8453,
        from: null,
        network: 'Base',
        nonce: 7,
        status: TransactionStatus.pending,
        to: null,
        type: 'swap',
      },
    });

    expect(mockHandleTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        relayExecutionId: 'execution-1',
        hash: 'execution-1',
        status: TransactionStatus.pending,
      })
    );

    await Promise.resolve();
    await Promise.resolve();

    expect(addNewTransaction).toHaveBeenCalledWith({
      address: '0x123',
      chainId: 8453,
      transaction: expect.objectContaining({
        relayExecutionId: 'execution-1',
        hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
        nonce: 0,
      }),
    });
    expect(mockRelayGetStatus).toHaveBeenCalledWith('execution-1');
  });

  it('returns the first origin tx hash once relay status exposes onchain evidence', async () => {
    const getStatus = jest
      .fn<Promise<ManagedExecutionStatusUpdate>, [string]>()
      .mockResolvedValueOnce(buildStatusUpdate({ status: 'SUBMITTING' }))
      .mockResolvedValueOnce(
        buildStatusUpdate({
          status: 'PENDING',
          txHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
        })
      );
    const sleep = jest.fn<Promise<void>, [number]>().mockResolvedValue();

    const result = await waitForManagedExecutionOnchain({
      executionId: 'execution-1',
      getStatus,
      sleep,
      intervalMs: 1,
    });

    expect(result).toEqual({
      status: 'PENDING',
      txHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
    });
    expect(getStatus).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it('stops on terminal relay failure without onchain evidence', async () => {
    const getStatus = jest.fn<Promise<ManagedExecutionStatusUpdate>, [string]>().mockResolvedValue(buildStatusUpdate({ status: 'FAILED' }));
    const sleep = jest.fn<Promise<void>, [number]>().mockResolvedValue();

    const result = await waitForManagedExecutionOnchain({
      executionId: 'execution-2',
      getStatus,
      sleep,
      intervalMs: 1,
    });

    expect(result).toEqual({
      status: 'FAILED',
    });
    expect(sleep).not.toHaveBeenCalled();
  });

  it('returns the last observed status when no onchain evidence appears before timeout', async () => {
    const getStatus = jest
      .fn<Promise<ManagedExecutionStatusUpdate>, [string]>()
      .mockResolvedValue(buildStatusUpdate({ status: 'SUBMITTING' }));
    const sleep = jest.fn<Promise<void>, [number]>().mockResolvedValue();

    const result = await waitForManagedExecutionOnchain({
      executionId: 'execution-3',
      getStatus,
      sleep,
      maxAttempts: 2,
      intervalMs: 1,
    });

    expect(result).toEqual({
      status: 'SUBMITTING',
    });
    expect(getStatus).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });
});

function buildStatusUpdate({
  status,
  txHash,
}: {
  status: ManagedExecutionStatusUpdate['status']['status'];
  txHash?: `0x${string}`;
}): ManagedExecutionStatusUpdate {
  return {
    status: {
      status,
      updatedAtMs: 0,
      onchain: txHash
        ? {
            type: 'singlechain',
            origin: {
              chainId: 8453,
              txHashes: [txHash],
            },
          }
        : undefined,
    },
  };
}
