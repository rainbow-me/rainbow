import { TransactionStatus } from '@/entities/transactions';

import { trackManagedExecution } from './managedExecutionTracking';

jest.mock('@/resources/assets/assets', () => ({
  parseGoldskyAddressAsset: jest.fn(),
  parseGoldskyAsset: jest.fn(),
}));

const mockAddPendingTransaction = jest.fn();

jest.mock('@/state/pendingTransactions', () => ({
  pendingTransactionsActions: {
    addPendingTransaction: (...args: unknown[]) => mockAddPendingTransaction(...args),
  },
}));

describe('managedExecutionTracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a managed relay swap immediately under relayExecutionId identity', () => {
    trackManagedExecution({
      address: '0x123',
      executionId: 'execution-1',
      transaction: {
        asset: null,
        chainId: 8453,
        data: Uint8Array.from([0xab, 0xcd]),
        from: null,
        network: 'Base',
        nonce: 7,
        status: TransactionStatus.pending,
        to: null,
        type: 'swap',
        value: 5n,
      },
    });

    const pendingTransaction = mockAddPendingTransaction.mock.calls[0]?.[0]?.pendingTransaction;

    expect(mockAddPendingTransaction).toHaveBeenCalledWith({
      address: '0x123',
      pendingTransaction: expect.objectContaining({
        data: '0xabcd',
        relayExecutionId: 'execution-1',
        hash: 'execution-1',
        nonce: 7,
        status: TransactionStatus.pending,
        title: 'swap.pending',
        value: '5',
      }),
    });
    expect(() => JSON.stringify(pendingTransaction)).not.toThrow();
  });
});
