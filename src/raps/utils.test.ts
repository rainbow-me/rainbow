import { getFallbackGasLimitForTrade } from './utils';

const mockGetChainGasUnits = jest.fn();

jest.mock('@/features/network/stores/backendNetworksStore', () => ({
  useBackendNetworksStore: {
    getState: () => ({ getChainGasUnits: mockGetChainGasUnits }),
  },
}));

jest.mock('@/handlers/web3', () => ({
  toHexNoLeadingZeros: jest.fn(),
}));

jest.mock('@/resources/transactions/transactionSimulation', () => ({
  simulateTransactions: jest.fn(),
}));

describe('getFallbackGasLimitForTrade', () => {
  it('applies the existing fallback padding to the configured chain gas units', () => {
    mockGetChainGasUnits.mockReturnValue({ basic: { swap: '350000' } });

    expect(getFallbackGasLimitForTrade(4663)).toBe('525000');
  });
});
