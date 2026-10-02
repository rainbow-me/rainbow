import { describe, expect, it, vi } from 'vitest';

import { getFallbackGasLimitForTrade } from './utils';

const mockGetChainGasUnits = vi.fn();

vi.mock('@/features/network/stores/backendNetworksStore', () => ({
  useBackendNetworksStore: {
    getState: () => ({ getChainGasUnits: mockGetChainGasUnits }),
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
