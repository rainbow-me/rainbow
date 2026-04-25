import { type Address } from 'viem';

import { TransactionStatus } from '@/entities/transactions';
import { RelayExecutionStatus, type ExecuteCallsResult, type ExecutionResult } from '@rainbow-me/delegation';

import { trackCallsExecution } from './callsExecutionTracking';

jest.mock('@/resources/assets/assets', () => ({
  parseGoldskyAddressAsset: jest.fn(),
  parseGoldskyAsset: jest.fn(),
}));

const mockAddPendingTransaction = jest.fn();
const mockAddNewTransaction = jest.fn();

jest.mock('@/state/pendingTransactions', () => ({
  addNewTransaction: (...args: unknown[]) => mockAddNewTransaction(...args),
  pendingTransactionsActions: {
    addPendingTransaction: (...args: unknown[]) => mockAddPendingTransaction(...args),
  },
}));

const ADDRESS: Address = '0x1111111111111111111111111111111111111111';
const HASH = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

describe('callsExecutionTracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers managed exact-call execution under the relay execution id', () => {
    trackCallsExecution({
      address: ADDRESS,
      batch: true,
      chainId: 8453,
      execution: {
        executionId: 'execution-1',
        kind: 'calls.managed',
        status: RelayExecutionStatus.Pending,
      } satisfies ExecuteCallsResult,
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
      address: ADDRESS,
      pendingTransaction: expect.objectContaining({
        batch: true,
        data: '0xabcd',
        delegation: false,
        hash: 'execution-1',
        relayExecutionId: 'execution-1',
        title: 'swap.pending',
        value: '5',
      }),
    });
    expect(() => JSON.stringify(pendingTransaction)).not.toThrow();
  });

  it('registers wallet exact-call execution under the submitted transaction hash', () => {
    trackCallsExecution({
      address: ADDRESS,
      batch: false,
      chainId: 8453,
      execution: {
        hash: HASH,
        transaction: {
          data: '0x1234',
          gas: 21000n,
          maxFeePerGas: 2n,
          maxPriorityFeePerGas: 1n,
          nonce: 9,
          to: ADDRESS,
          value: 0n,
        },
        type: 'eip1559',
      } satisfies ExecutionResult,
      transaction: {
        asset: null,
        chainId: 8453,
        from: ADDRESS,
        network: 'Base',
        nonce: -1,
        status: TransactionStatus.pending,
        to: null,
        type: 'stake',
        value: 0,
      },
    });

    expect(mockAddNewTransaction).toHaveBeenCalledWith({
      address: ADDRESS,
      chainId: 8453,
      transaction: expect.objectContaining({
        data: '0x1234',
        gasLimit: '21000',
        hash: HASH,
        nonce: 9,
        to: ADDRESS,
      }),
    });
  });
});
