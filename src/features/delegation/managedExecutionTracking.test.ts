const mockAddPendingTransaction = jest.fn();

jest.mock('@/state/pendingTransactions', () => ({
  pendingTransactionsActions: {
    addPendingTransaction: (...args: unknown[]) => mockAddPendingTransaction(...args),
  },
}));

import { TransactionStatus } from '@/entities/transactions';
import { trackManagedCallsExecution } from './managedExecutionTracking';

describe('managedExecutionTracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a managed relay swap immediately under relayExecutionId identity', () => {
    trackManagedCallsExecution({
      address: '0x123',
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

    expect(mockAddPendingTransaction).toHaveBeenCalledWith({
      address: '0x123',
      pendingTransaction: expect.objectContaining({
        relayExecutionId: 'execution-1',
        hash: 'execution-1',
        nonce: 7,
        status: TransactionStatus.pending,
        title: 'swap.pending',
      }),
    });
  });
});
