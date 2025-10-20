import { sortPositions } from '../../../stores/transform/sort';
import type { RainbowPosition, PositionAsset, RainbowDeposit, RainbowPool, RainbowStake, RainbowBorrow } from '../../../types';

describe('Sorting', () => {
  describe('sortPositions', () => {
    it('should sort positions by total value descending', () => {
      const positions: Record<string, RainbowPosition> = {
        uniswap: {
          type: 'uniswap',
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
      const sortedArray = Object.values(sorted);

      expect(Object.keys(sorted).length).toBe(3);
      expect(sortedArray[0].type).toBe('aave'); // $5000
      expect(sortedArray[1].type).toBe('uniswap'); // $1000
      expect(sortedArray[2].type).toBe('curve'); // $500
    });

    it('should handle positions with same value', () => {
      const positions: Record<string, RainbowPosition> = {
        uniswap: {
          type: 'uniswap',
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
      const sortedArray = Object.values(sorted);

      expect(Object.keys(sorted).length).toBe(2);
      // Both have same value, order is stable
      expect(['uniswap', 'aave']).toContain(sortedArray[0].type);
      expect(['uniswap', 'aave']).toContain(sortedArray[1].type);
    });
  });

  describe('sortPositionItems', () => {
    it('should sort deposits by value descending', () => {
      const positions: Record<string, RainbowPosition> = {
        aave: {
          type: 'aave',
          deposits: [
            {
              asset: { symbol: 'USDC' } as unknown as PositionAsset,
              quantity: '100',
              value: { amount: '100', display: '$100' },
              underlying: [],
            } as RainbowDeposit,
            {
              asset: { symbol: 'ETH' } as unknown as PositionAsset,
              quantity: '1',
              value: { amount: '2000', display: '$2000' },
              underlying: [],
            } as RainbowDeposit,
            {
              asset: { symbol: 'DAI' } as unknown as PositionAsset,
              quantity: '500',
              value: { amount: '500', display: '$500' },
              underlying: [],
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

      expect(sorted.aave.deposits[0].asset.symbol).toBe('ETH'); // $2000
      expect(sorted.aave.deposits[1].asset.symbol).toBe('DAI'); // $500
      expect(sorted.aave.deposits[2].asset.symbol).toBe('USDC'); // $100
    });

    it('should sort pools by value descending', () => {
      const positions: Record<string, RainbowPosition> = {
        uniswap: {
          type: 'uniswap',
          deposits: [],
          pools: [
            {
              asset: { symbol: 'USDC' } as unknown as PositionAsset,
              quantity: '10',
              value: { amount: '200', display: '$200' },
              underlying: [],
              isConcentratedLiquidity: false,
              rangeStatus: 'in_range',
              allocation: '50/50',
            } as RainbowPool,
            {
              asset: { symbol: 'ETH' } as unknown as PositionAsset,
              quantity: '2',
              value: { amount: '4000', display: '$4000' },
              underlying: [],
              isConcentratedLiquidity: false,
              rangeStatus: 'in_range',
              allocation: '50/50',
            } as RainbowPool,
          ],
          stakes: [],
          borrows: [],
          rewards: [],
          totals: {
            total: { amount: '4200', display: '$4200' },
            totalDeposits: { amount: '4200', display: '$4200' },
            totalBorrows: { amount: '0', display: '$0' },
            totalRewards: { amount: '0', display: '$0' },
            totalLocked: { amount: '0', display: '$0' },
          },
          dapp: { name: 'Uniswap', url: '', icon_url: '', colors: { primary: '#000', fallback: '#000', shadow: '#000' } },
        },
      };

      const sorted = sortPositions(positions);

      expect(sorted.uniswap.pools[0].asset.symbol).toBe('ETH'); // $4000
      expect(sorted.uniswap.pools[1].asset.symbol).toBe('USDC'); // $200
    });

    it('should sort stakes by value descending', () => {
      const positions: Record<string, RainbowPosition> = {
        curve: {
          type: 'curve',
          deposits: [],
          pools: [],
          stakes: [
            {
              asset: { symbol: 'CRV' } as unknown as PositionAsset,
              quantity: '100',
              value: { amount: '300', display: '$300' },
              underlying: [],
              isLp: false,
            } as RainbowStake,
            {
              asset: { symbol: 'veCRV' } as unknown as PositionAsset,
              quantity: '50',
              value: { amount: '150', display: '$150' },
              underlying: [],
              isLp: false,
            } as RainbowStake,
          ],
          borrows: [],
          rewards: [],
          totals: {
            total: { amount: '450', display: '$450' },
            totalDeposits: { amount: '450', display: '$450' },
            totalBorrows: { amount: '0', display: '$0' },
            totalRewards: { amount: '0', display: '$0' },
            totalLocked: { amount: '0', display: '$0' },
          },
          dapp: { name: 'Curve', url: '', icon_url: '', colors: { primary: '#000', fallback: '#000', shadow: '#000' } },
        },
      };

      const sorted = sortPositions(positions);

      expect(sorted.curve.stakes[0].asset.symbol).toBe('CRV'); // $300
      expect(sorted.curve.stakes[1].asset.symbol).toBe('veCRV'); // $150
    });

    it('should sort borrows by value descending', () => {
      const positions: Record<string, RainbowPosition> = {
        aave: {
          type: 'aave',
          deposits: [],
          pools: [],
          stakes: [],
          borrows: [
            {
              asset: { symbol: 'USDC' } as unknown as PositionAsset,
              quantity: '1000',
              value: { amount: '1000', display: '$1000' },
              underlying: [],
            } as RainbowBorrow,
            {
              asset: { symbol: 'DAI' } as unknown as PositionAsset,
              quantity: '500',
              value: { amount: '500', display: '$500' },
              underlying: [],
            } as RainbowBorrow,
          ],
          rewards: [],
          totals: {
            total: { amount: '-1500', display: '-$1500' },
            totalDeposits: { amount: '0', display: '$0' },
            totalBorrows: { amount: '1500', display: '$1500' },
            totalRewards: { amount: '0', display: '$0' },
            totalLocked: { amount: '0', display: '$0' },
          },
          dapp: { name: 'Aave', url: '', icon_url: '', colors: { primary: '#000', fallback: '#000', shadow: '#000' } },
        },
      };

      const sorted = sortPositions(positions);

      expect(sorted.aave.borrows[0].asset.symbol).toBe('USDC'); // $1000
      expect(sorted.aave.borrows[1].asset.symbol).toBe('DAI'); // $500
    });
  });
});
