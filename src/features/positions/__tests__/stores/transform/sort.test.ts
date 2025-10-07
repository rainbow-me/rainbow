import { sortPositions } from '../../../stores/transform/sort';
import type { ProtocolGroup, PositionAsset, RainbowDeposit, RainbowPool, RainbowStake, RainbowBorrow } from '../../../types';

describe('Sorting', () => {
  describe('sortPositions', () => {
    it('should sort positions by total value descending', () => {
      const positions: ProtocolGroup = {
        uniswap: {
          type: 'uniswap',
          chainIds: [1],
          deposits: [],
          pools: [],
          stakes: [],
          borrows: [],
          rewards: [],
          totals: {
            total: { amount: '1000', display: '$1000' },
            totalDeposits: { amount: '1000', display: '$1000' },
            totalBorrows: { amount: '0', display: '$0' },
            totalRewards: { amount: '0', display: '$0' },
            totalLocked: { amount: '0', display: '$0' },
          },
          dapp: { name: 'Uniswap', url: '', icon_url: '', colors: { primary: '#000', fallback: '#000', shadow: '#000' } },
        },
        aave: {
          type: 'aave',
          chainIds: [1],
          deposits: [],
          pools: [],
          stakes: [],
          borrows: [],
          rewards: [],
          totals: {
            total: { amount: '5000', display: '$5000' },
            totalDeposits: { amount: '5000', display: '$5000' },
            totalBorrows: { amount: '0', display: '$0' },
            totalRewards: { amount: '0', display: '$0' },
            totalLocked: { amount: '0', display: '$0' },
          },
          dapp: { name: 'Aave', url: '', icon_url: '', colors: { primary: '#000', fallback: '#000', shadow: '#000' } },
        },
        curve: {
          type: 'curve',
          chainIds: [1],
          deposits: [],
          pools: [],
          stakes: [],
          borrows: [],
          rewards: [],
          totals: {
            total: { amount: '500', display: '$500' },
            totalDeposits: { amount: '500', display: '$500' },
            totalBorrows: { amount: '0', display: '$0' },
            totalRewards: { amount: '0', display: '$0' },
            totalLocked: { amount: '0', display: '$0' },
          },
          dapp: { name: 'Curve', url: '', icon_url: '', colors: { primary: '#000', fallback: '#000', shadow: '#000' } },
        },
      };

      const sorted = sortPositions(positions);

      expect(sorted).toHaveLength(3);
      expect(sorted[0].type).toBe('aave'); // $5000
      expect(sorted[1].type).toBe('uniswap'); // $1000
      expect(sorted[2].type).toBe('curve'); // $500
    });

    it('should handle positions with same value', () => {
      const positions: ProtocolGroup = {
        uniswap: {
          type: 'uniswap',
          chainIds: [1],
          deposits: [],
          pools: [],
          stakes: [],
          borrows: [],
          rewards: [],
          totals: {
            total: { amount: '1000', display: '$1000' },
            totalDeposits: { amount: '1000', display: '$1000' },
            totalBorrows: { amount: '0', display: '$0' },
            totalRewards: { amount: '0', display: '$0' },
            totalLocked: { amount: '0', display: '$0' },
          },
          dapp: { name: 'Uniswap', url: '', icon_url: '', colors: { primary: '#000', fallback: '#000', shadow: '#000' } },
        },
        aave: {
          type: 'aave',
          chainIds: [1],
          deposits: [],
          pools: [],
          stakes: [],
          borrows: [],
          rewards: [],
          totals: {
            total: { amount: '1000', display: '$1000' },
            totalDeposits: { amount: '1000', display: '$1000' },
            totalBorrows: { amount: '0', display: '$0' },
            totalRewards: { amount: '0', display: '$0' },
            totalLocked: { amount: '0', display: '$0' },
          },
          dapp: { name: 'Aave', url: '', icon_url: '', colors: { primary: '#000', fallback: '#000', shadow: '#000' } },
        },
      };

      const sorted = sortPositions(positions);

      expect(sorted).toHaveLength(2);
      // Both have same value, order is stable
      expect(['uniswap', 'aave']).toContain(sorted[0].type);
      expect(['uniswap', 'aave']).toContain(sorted[1].type);
    });
  });

  describe('sortPositionItems', () => {
    it('should sort deposits by totalValue descending', () => {
      const positions: ProtocolGroup = {
        aave: {
          type: 'aave',
          chainIds: [1],
          deposits: [
            {
              asset: { symbol: 'USDC' } as unknown as PositionAsset,
              quantity: '100',
              totalValue: '100',
              underlying: [],
              isLp: false,
              isConcentratedLiquidity: false,
            } as RainbowDeposit,
            {
              asset: { symbol: 'ETH' } as unknown as PositionAsset,
              quantity: '1',
              totalValue: '2000',
              underlying: [],
              isLp: false,
              isConcentratedLiquidity: false,
            } as RainbowDeposit,
            {
              asset: { symbol: 'DAI' } as unknown as PositionAsset,
              quantity: '500',
              totalValue: '500',
              underlying: [],
              isLp: false,
              isConcentratedLiquidity: false,
            } as RainbowDeposit,
          ],
          pools: [],
          stakes: [],
          borrows: [],
          rewards: [],
          totals: {
            total: { amount: '2600', display: '$2600' },
            totalDeposits: { amount: '2600', display: '$2600' },
            totalBorrows: { amount: '0', display: '$0' },
            totalRewards: { amount: '0', display: '$0' },
            totalLocked: { amount: '0', display: '$0' },
          },
          dapp: { name: 'Aave', url: '', icon_url: '', colors: { primary: '#000', fallback: '#000', shadow: '#000' } },
        },
      };

      const sorted = sortPositions(positions);
      const position = sorted[0];

      expect(position.deposits[0].asset.symbol).toBe('ETH'); // $2000
      expect(position.deposits[1].asset.symbol).toBe('DAI'); // $500
      expect(position.deposits[2].asset.symbol).toBe('USDC'); // $100
    });

    it('should sort rewards by native.amount descending', () => {
      const positions: ProtocolGroup = {
        compound: {
          type: 'compound',
          chainIds: [1],
          deposits: [],
          pools: [],
          stakes: [],
          borrows: [],
          rewards: [
            {
              asset: { symbol: 'COMP' } as unknown as PositionAsset,
              quantity: '1',
              totalValue: '50',
              native: { amount: '50', display: '$50' },
            },
            {
              asset: { symbol: 'DAI' } as unknown as PositionAsset,
              quantity: '10',
              totalValue: '10',
              native: { amount: '10', display: '$10' },
            },
            {
              asset: { symbol: 'USDC' } as unknown as PositionAsset,
              quantity: '100',
              totalValue: '100',
              native: { amount: '100', display: '$100' },
            },
          ],
          totals: {
            total: { amount: '160', display: '$160' },
            totalDeposits: { amount: '0', display: '$0' },
            totalBorrows: { amount: '0', display: '$0' },
            totalRewards: { amount: '160', display: '$160' },
            totalLocked: { amount: '0', display: '$0' },
          },
          dapp: { name: 'Compound', url: '', icon_url: '', colors: { primary: '#000', fallback: '#000', shadow: '#000' } },
        },
      };

      const sorted = sortPositions(positions);
      const position = sorted[0];

      expect(position.rewards[0].asset.symbol).toBe('USDC'); // $100
      expect(position.rewards[1].asset.symbol).toBe('COMP'); // $50
      expect(position.rewards[2].asset.symbol).toBe('DAI'); // $10
    });

    it('should sort all categories', () => {
      const positions: ProtocolGroup = {
        aave: {
          type: 'aave',
          chainIds: [1],
          deposits: [
            {
              asset: { symbol: 'A' } as unknown as PositionAsset,
              quantity: '1',
              totalValue: '100',
              underlying: [],
              isLp: false,
              isConcentratedLiquidity: false,
            } as RainbowDeposit,
            {
              asset: { symbol: 'B' } as unknown as PositionAsset,
              quantity: '1',
              totalValue: '200',
              underlying: [],
              isLp: false,
              isConcentratedLiquidity: false,
            } as RainbowDeposit,
          ],
          pools: [
            {
              asset: { symbol: 'C' } as unknown as PositionAsset,
              quantity: '1',
              totalValue: '50',
              underlying: [],
              isConcentratedLiquidity: false,
              rangeStatus: 'in_range',
              allocation: '50/50',
            } as RainbowPool,
            {
              asset: { symbol: 'D' } as unknown as PositionAsset,
              quantity: '1',
              totalValue: '150',
              underlying: [],
              isConcentratedLiquidity: false,
              rangeStatus: 'in_range',
              allocation: '50/50',
            } as RainbowPool,
          ],
          stakes: [
            {
              asset: { symbol: 'E' } as unknown as PositionAsset,
              quantity: '1',
              totalValue: '300',
              underlying: [],
              isLp: false,
              isConcentratedLiquidity: false,
            } as RainbowStake,
            {
              asset: { symbol: 'F' } as unknown as PositionAsset,
              quantity: '1',
              totalValue: '250',
              underlying: [],
              isLp: false,
              isConcentratedLiquidity: false,
            } as RainbowStake,
          ],
          borrows: [
            {
              asset: { symbol: 'G' } as unknown as PositionAsset,
              quantity: '1',
              totalValue: '80',
              underlying: [],
            } as RainbowBorrow,
            {
              asset: { symbol: 'H' } as unknown as PositionAsset,
              quantity: '1',
              totalValue: '120',
              underlying: [],
            } as RainbowBorrow,
          ],
          rewards: [
            {
              asset: { symbol: 'I' } as unknown as PositionAsset,
              quantity: '1',
              totalValue: '30',
              native: { amount: '30', display: '$30' },
            },
            {
              asset: { symbol: 'J' } as unknown as PositionAsset,
              quantity: '1',
              totalValue: '60',
              native: { amount: '60', display: '$60' },
            },
          ],
          totals: {
            total: { amount: '0', display: '$0' },
            totalDeposits: { amount: '0', display: '$0' },
            totalBorrows: { amount: '0', display: '$0' },
            totalRewards: { amount: '0', display: '$0' },
            totalLocked: { amount: '0', display: '$0' },
          },
          dapp: { name: 'Aave', url: '', icon_url: '', colors: { primary: '#000', fallback: '#000', shadow: '#000' } },
        },
      };

      const sorted = sortPositions(positions);
      const position = sorted[0];

      // Check all categories are sorted descending
      expect(position.deposits[0].asset.symbol).toBe('B');
      expect(position.pools[0].asset.symbol).toBe('D');
      expect(position.stakes[0].asset.symbol).toBe('E');
      expect(position.borrows[0].asset.symbol).toBe('H');
      expect(position.rewards[0].asset.symbol).toBe('J');
    });
  });
});
