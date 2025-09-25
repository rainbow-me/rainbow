import { filterByValueThreshold, filterProtocols, validatePositionData } from '../../parsers/filters';
import type {
  PositionAsset,
  ProtocolGroup,
  RainbowBorrow,
  RainbowDeposit,
  RainbowPool,
  RainbowPosition,
  RainbowReward,
  RainbowStake,
} from '../../types';

describe('Position Filters', () => {
  const createMockPosition = (type: string, value: string): RainbowPosition => ({
    type,
    protocol_version: 'v2',
    chainIds: [1],
    totals: {
      totals: { amount: value, display: `$${value}` },
      totalDeposits: { amount: '0', display: '$0' },
      totalBorrows: { amount: '0', display: '$0' },
      totalRewards: { amount: '0', display: '$0' },
      totalLocked: '0',
    },
    deposits: [],
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

  describe('filterByValueThreshold', () => {
    it('should filter positions below threshold', () => {
      const positions: ProtocolGroup = {
        uniswap: createMockPosition('uniswap', '100'),
        aave: createMockPosition('aave', '0.5'),
        compound: createMockPosition('compound', '2'),
      };

      const filtered = filterByValueThreshold(positions, 1);

      expect(Object.keys(filtered)).toHaveLength(2);
      expect(filtered['uniswap']).toBeDefined();
      expect(filtered['compound']).toBeDefined();
      expect(filtered['aave']).toBeUndefined();
    });

    it('should keep positions at exactly threshold', () => {
      const positions: ProtocolGroup = {
        uniswap: createMockPosition('uniswap', '1'),
      };

      const filtered = filterByValueThreshold(positions, 1);
      expect(filtered['uniswap']).toBeDefined();
    });

    it('should handle positions with no value', () => {
      const position = createMockPosition('test', '0');
      position.totals.totals = { amount: '', display: '' };

      const positions: ProtocolGroup = { test: position };
      const filtered = filterByValueThreshold(positions);

      expect(Object.keys(filtered)).toHaveLength(0);
    });

    it('should use default threshold of $1', () => {
      const positions: ProtocolGroup = {
        small: createMockPosition('small', '0.99'),
        large: createMockPosition('large', '1.01'),
      };

      const filtered = filterByValueThreshold(positions);

      expect(Object.keys(filtered)).toHaveLength(1);
      expect(filtered['large']).toBeDefined();
    });
  });

  describe('filterProtocols', () => {
    it('should filter Hyperliquid protocol', () => {
      const positions: ProtocolGroup = {
        'uniswap': createMockPosition('uniswap', '100'),
        'hyperliquid': createMockPosition('hyperliquid', '100'),
        'hyperliquid-perps': createMockPosition('hyperliquid-perps', '100'),
      };

      const filtered = filterProtocols(positions);

      expect(Object.keys(filtered)).toHaveLength(1);
      expect(filtered['uniswap']).toBeDefined();
      expect(filtered['hyperliquid']).toBeUndefined();
      expect(filtered['hyperliquid-perps']).toBeUndefined();
    });

    it('should keep non-filtered protocols', () => {
      const positions: ProtocolGroup = {
        uniswap: createMockPosition('uniswap', '100'),
        aave: createMockPosition('aave', '100'),
        compound: createMockPosition('compound', '100'),
        curve: createMockPosition('curve', '100'),
      };

      const filtered = filterProtocols(positions);

      expect(Object.keys(filtered)).toHaveLength(4);
    });
  });

  describe('validatePositionData', () => {
    it('should validate valid position', () => {
      const position = createMockPosition('uniswap', '100');
      position.deposits.push({
        asset: { symbol: 'ETH' } as unknown as PositionAsset,
        quantity: '1',
        isLp: false,
        isConcentratedLiquidity: false,
        totalValue: '100',
        underlying: [],
      });

      expect(validatePositionData(position)).toBe(true);
    });

    it('should reject position without protocol name', () => {
      const position = createMockPosition('', '100');
      position.deposits.push({} as unknown as RainbowDeposit);

      expect(validatePositionData(position)).toBe(false);
    });

    it('should reject position with unknown protocol', () => {
      const position = createMockPosition('unknown', '100');
      position.deposits.push({} as unknown as RainbowDeposit);

      expect(validatePositionData(position)).toBe(false);
    });

    it('should reject position without any items', () => {
      const position = createMockPosition('uniswap', '100');

      expect(validatePositionData(position)).toBe(false);
    });

    it('should accept position with any category of items', () => {
      const position1 = createMockPosition('uniswap', '100');
      position1.deposits.push({} as unknown as RainbowDeposit);
      expect(validatePositionData(position1)).toBe(true);

      const position2 = createMockPosition('uniswap', '100');
      position2.pools.push({} as unknown as RainbowPool);
      expect(validatePositionData(position2)).toBe(true);

      const position3 = createMockPosition('uniswap', '100');
      position3.stakes.push({} as unknown as RainbowStake);
      expect(validatePositionData(position3)).toBe(true);

      const position4 = createMockPosition('uniswap', '100');
      position4.borrows.push({} as unknown as RainbowBorrow);
      expect(validatePositionData(position4)).toBe(true);

      const position5 = createMockPosition('uniswap', '100');
      position5.rewards.push({} as unknown as RainbowReward);
      expect(validatePositionData(position5)).toBe(true);
    });
  });
});
