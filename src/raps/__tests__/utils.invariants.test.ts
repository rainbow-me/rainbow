import { ChainId } from '@/state/backendNetworks/types';
import { type Transaction } from '@/graphql/__generated__/metadataPOST';
import { estimateTransactionsGasLimit } from '../utils';

jest.mock('@/handlers/web3', () => ({
  toHexNoLeadingZeros: jest.fn((value: string) => value),
}));

jest.mock('@/resources/transactions/transactionSimulation', () => ({
  simulateTransactions: jest.fn(),
}));

const simulationModule = jest.requireMock('@/resources/transactions/transactionSimulation');

function createTransaction({
  from,
  to,
  data = '0x',
  value = '0x0',
}: {
  from: string;
  to: string;
  data?: string;
  value?: string;
}): Transaction {
  return { from, to, data, value };
}

describe('estimateTransactionsGasLimit invariants', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fails closed when simulation result count does not match step count', async () => {
    simulationModule.simulateTransactions.mockResolvedValue([
      {
        gas: { estimate: '10000' },
      },
    ]);

    const approveFallback = jest.fn(async () => '21000');
    const swapFallback = jest.fn(async () => '250000');

    const result = await estimateTransactionsGasLimit({
      chainId: ChainId.mainnet,
      steps: [
        {
          transaction: createTransaction({
            from: '0x1111111111111111111111111111111111111111',
            to: '0x2222222222222222222222222222222222222222',
          }),
          label: 'approve',
          fallbackEstimate: approveFallback,
        },
        {
          transaction: createTransaction({
            from: '0x1111111111111111111111111111111111111111',
            to: '0x3333333333333333333333333333333333333333',
          }),
          label: 'swap',
          fallbackEstimate: swapFallback,
        },
      ],
    });

    expect(result).toBeUndefined();
    expect(approveFallback).not.toHaveBeenCalled();
    expect(swapFallback).not.toHaveBeenCalled();
  });

  test('uses per-step fallback estimates when simulation omits gas for a step', async () => {
    simulationModule.simulateTransactions.mockResolvedValue([
      {
        gas: { estimate: '120000' },
      },
      {
        error: { message: 'reverted' },
      },
    ]);

    const fallbackEstimate = jest.fn(async () => '80000');

    const result = await estimateTransactionsGasLimit({
      chainId: ChainId.mainnet,
      steps: [
        {
          transaction: createTransaction({
            from: '0x1111111111111111111111111111111111111111',
            to: '0x2222222222222222222222222222222222222222',
          }),
          label: 'approve',
        },
        {
          transaction: createTransaction({
            from: '0x1111111111111111111111111111111111111111',
            to: '0x3333333333333333333333333333333333333333',
          }),
          label: 'swap',
          fallbackEstimate,
        },
      ],
    });

    expect(result).toBe('200000');
    expect(fallbackEstimate).toHaveBeenCalledTimes(1);
  });

  test('returns undefined when a step has no simulation estimate and no fallback estimate', async () => {
    simulationModule.simulateTransactions.mockResolvedValue([
      {
        gas: { estimate: '150000' },
      },
      {
        error: { message: 'reverted' },
      },
    ]);

    const result = await estimateTransactionsGasLimit({
      chainId: ChainId.mainnet,
      steps: [
        {
          transaction: createTransaction({
            from: '0x1111111111111111111111111111111111111111',
            to: '0x2222222222222222222222222222222222222222',
          }),
          label: 'approve',
        },
        {
          transaction: createTransaction({
            from: '0x1111111111111111111111111111111111111111',
            to: '0x3333333333333333333333333333333333333333',
          }),
          label: 'swap',
        },
      ],
    });

    expect(result).toBeUndefined();
  });
});
