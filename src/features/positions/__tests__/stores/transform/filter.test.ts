import { shouldFilterPosition } from '../../../stores/transform/filter';
import type { RainbowPosition, PositionAsset, RainbowDeposit } from '../../../types';

// Mock config to avoid React Native gesture handler imports
jest.mock('@/config', () => ({
  getExperimentalFlag: jest.fn(() => true), // Enable threshold filter for tests
  DEFI_POSITIONS_THRESHOLD_FILTER: 'defi_positions_threshold_filter',
}));

describe('Position Filters', () => {
  const createMockPosition = (type: string, value: string): RainbowPosition => ({
    type,
    protocol: `${type}-v2`,
    protocolVersion: 'v2',
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
        value: { amount: value, display: `$${value}` },
        underlying: [],
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

  describe('shouldFilterPosition', () => {
    it('should filter positions below value threshold', () => {
      const uniswap = createMockPosition('uniswap', '100');
      const aave = createMockPosition('aave', '0.5');
      const compound = createMockPosition('compound', '2');

      expect(shouldFilterPosition(uniswap)).toBe(false); // should NOT filter
      expect(shouldFilterPosition(compound)).toBe(false); // should NOT filter
      expect(shouldFilterPosition(aave)).toBe(true); // SHOULD filter (below threshold)
    });

    it('should filter Hyperliquid protocol', () => {
      const uniswap = createMockPosition('uniswap', '100');
      const hyperliquid = createMockPosition('hyperliquid', '100');
      const hyperliquidPerps = createMockPosition('hyperliquid-perps', '100');

      expect(shouldFilterPosition(uniswap)).toBe(false); // should NOT filter
      expect(shouldFilterPosition(hyperliquid)).toBe(true); // SHOULD filter (unsupported protocol)
      expect(shouldFilterPosition(hyperliquidPerps)).toBe(false); // should NOT filter (different protocol)
    });

    it('should apply both filters together', () => {
      const uniswap = createMockPosition('uniswap', '100');
      const aave = createMockPosition('aave', '0.5'); // below threshold
      const hyperliquid = createMockPosition('hyperliquid', '100'); // filtered protocol
      const compound = createMockPosition('compound', '2');

      expect(shouldFilterPosition(uniswap)).toBe(false); // should NOT filter
      expect(shouldFilterPosition(compound)).toBe(false); // should NOT filter
      expect(shouldFilterPosition(aave)).toBe(true); // SHOULD filter (below threshold)
      expect(shouldFilterPosition(hyperliquid)).toBe(true); // SHOULD filter (unsupported protocol)
    });

    it('should filter positions with no items', () => {
      const emptyPosition = createMockPosition('uniswap', '100');
      emptyPosition.deposits = [];
      emptyPosition.pools = [];
      emptyPosition.stakes = [];
      emptyPosition.borrows = [];
      emptyPosition.rewards = [];

      expect(shouldFilterPosition(emptyPosition)).toBe(true); // SHOULD filter (no items)
    });
  });
});
