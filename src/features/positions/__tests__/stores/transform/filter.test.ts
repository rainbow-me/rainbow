import { filterPositions } from '../../../stores/transform/filter';
import type { ProtocolGroup, RainbowPosition, PositionAsset, RainbowDeposit } from '../../../types';

// Mock config to avoid React Native gesture handler imports
jest.mock('@/config', () => ({
  getExperimentalFlag: jest.fn(() => true), // Enable threshold filter for tests
  DEFI_POSITIONS_THRESHOLD_FILTER: 'defi_positions_threshold_filter',
}));

describe('Position Filters', () => {
  const createMockPosition = (type: string, value: string): RainbowPosition => ({
    type,
    protocol_version: 'v2',
    chainIds: [1],
    totals: {
      total: { amount: value, display: `$${value}` },
      totalDeposits: { amount: '0', display: '$0' },
      totalBorrows: { amount: '0', display: '$0' },
      totalRewards: { amount: '0', display: '$0' },
      totalLocked: { amount: '0', display: '$0' },
    },
    deposits: [
      {
        asset: { symbol: 'MOCK' } as unknown as PositionAsset,
        quantity: '1',
        totalValue: value,
        underlying: [],
        isLp: false,
        isConcentratedLiquidity: false,
      } as RainbowDeposit,
    ],
    pools: [],
    stakes: [],
    borrows: [],
    rewards: [],
    dapp: {
      name: type,
      url: '',
      icon_url: '',
      colors: {
        primary: '#000000',
        fallback: '#ffffff',
        shadow: '#cccccc',
      },
    },
  });

  describe('filterPositions', () => {
    it('should filter positions below value threshold', () => {
      const positions: ProtocolGroup = {
        uniswap: createMockPosition('uniswap', '100'),
        aave: createMockPosition('aave', '0.5'),
        compound: createMockPosition('compound', '2'),
      };

      const filtered = filterPositions(positions);

      expect(Object.keys(filtered)).toHaveLength(2);
      expect(filtered['uniswap']).toBeDefined();
      expect(filtered['compound']).toBeDefined();
      expect(filtered['aave']).toBeUndefined();
    });

    it('should filter Hyperliquid protocol', () => {
      const positions: ProtocolGroup = {
        'uniswap': createMockPosition('uniswap', '100'),
        'hyperliquid': createMockPosition('hyperliquid', '100'),
        'hyperliquid-perps': createMockPosition('hyperliquid-perps', '100'),
      };

      const filtered = filterPositions(positions);

      expect(Object.keys(filtered)).toHaveLength(1);
      expect(filtered['uniswap']).toBeDefined();
      expect(filtered['hyperliquid']).toBeUndefined();
      expect(filtered['hyperliquid-perps']).toBeUndefined();
    });

    it('should apply both filters together', () => {
      const positions: ProtocolGroup = {
        uniswap: createMockPosition('uniswap', '100'),
        aave: createMockPosition('aave', '0.5'), // below threshold
        hyperliquid: createMockPosition('hyperliquid', '100'), // filtered protocol
        compound: createMockPosition('compound', '2'),
      };

      const filtered = filterPositions(positions);

      expect(Object.keys(filtered)).toHaveLength(2);
      expect(filtered['uniswap']).toBeDefined();
      expect(filtered['compound']).toBeDefined();
      expect(filtered['aave']).toBeUndefined();
      expect(filtered['hyperliquid']).toBeUndefined();
    });
  });
});
