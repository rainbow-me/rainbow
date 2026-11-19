import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChainId } from '@/features/network/types/backendNetworks';
import { logger } from '@/logger';
import { simulateTransactions } from '@/resources/transactions/transactionSimulation';

import { estimateTransactionsGasLimit, getFallbackGasLimitForTrade } from './utils';

const mockGetChainGasUnits = vi.fn();
const mockGetChainSimulationSupport = vi.fn();

vi.mock('@/features/network/stores/backendNetworksStore', () => ({
  useBackendNetworksStore: {
    getState: () => ({ getChainGasUnits: mockGetChainGasUnits, getChainSimulationSupport: mockGetChainSimulationSupport }),
  },
}));

vi.mock('@/handlers/web3', () => ({
  toHexNoLeadingZeros: vi.fn(),
}));

vi.mock('@/resources/transactions/transactionSimulation', () => ({
  simulateTransactions: vi.fn(),
}));

describe('getFallbackGasLimitForTrade', () => {
  it('applies the existing fallback padding to the configured chain gas units', () => {
    mockGetChainGasUnits.mockReturnValue({ basic: { swap: '350000' } });

    expect(getFallbackGasLimitForTrade(4663)).toBe('525000');
  });
});

describe('estimateTransactionsGasLimit', () => {
  const approve = { to: '0xtoken', data: '0xapprove', from: '0xuser', value: '0x0' };
  const swap = { to: '0xrouter', data: '0xswap', from: '0xuser', value: '0x0' };
  const approveAndSwap = [
    { transaction: approve, label: 'approve' },
    { transaction: swap, label: 'swap' },
  ];

  beforeEach(() => {
    mockGetChainSimulationSupport.mockReset();
    vi.mocked(simulateTransactions).mockReset();
    vi.spyOn(logger, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    { name: 'simulation is unsupported', support: { enabled: false, bulk: false }, steps: [approveAndSwap[1]] },
    { name: 'bulk is unsupported for several transactions', support: { enabled: true, bulk: false }, steps: approveAndSwap },
  ])('skips the request without warning when $name', async ({ support, steps }) => {
    mockGetChainSimulationSupport.mockReturnValue(support);

    await expect(estimateTransactionsGasLimit({ chainId: ChainId.linea, steps })).resolves.toBeUndefined();

    expect(mockGetChainSimulationSupport).toHaveBeenCalledWith(ChainId.linea);
    expect(simulateTransactions).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: 'support is unknown',
      support: undefined,
      steps: approveAndSwap,
      transactions: [approve, swap],
      expected: '300',
    },
    {
      name: 'bulk is supported',
      support: { enabled: true, bulk: true },
      steps: approveAndSwap,
      transactions: [approve, swap],
      expected: '300',
    },
    {
      name: 'only one step has a transaction on a chain without bulk',
      support: { enabled: true, bulk: false },
      steps: [{ transaction: null, label: 'approve' }, approveAndSwap[1]],
      transactions: [swap],
      expected: '100',
    },
  ])('simulates and sums the estimates when $name', async ({ support, steps, transactions, expected }) => {
    mockGetChainSimulationSupport.mockReturnValue(support);
    vi.mocked(simulateTransactions).mockResolvedValue(transactions.map((_, index) => ({ gas: { used: '0', estimate: `${index + 1}00` } })));

    await expect(estimateTransactionsGasLimit({ chainId: ChainId.linea, steps })).resolves.toBe(expected);

    expect(simulateTransactions).toHaveBeenCalledWith({ chainId: ChainId.linea, transactions });
  });

  it('warns with the backend error when the simulation request fails', async () => {
    mockGetChainSimulationSupport.mockReturnValue(undefined);
    vi.mocked(simulateTransactions).mockRejectedValue(new Error('Bulk transactions are currently not supported for this chain: 59144'));

    await expect(estimateTransactionsGasLimit({ chainId: ChainId.linea, steps: approveAndSwap })).resolves.toBeUndefined();

    expect(logger.warn).toHaveBeenCalledWith('[estimateTransactionsGasLimit]: Simulation request failed', {
      chainId: ChainId.linea,
      transactionCount: 2,
      message: 'Bulk transactions are currently not supported for this chain: 59144',
    });
  });
});
