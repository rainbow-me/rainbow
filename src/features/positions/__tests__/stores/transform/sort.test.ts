import { sortPositions } from '../../../stores/transform/sort';
import type { RainbowPosition } from '../../../types';
import { createMockRainbowPosition, createMockDeposit, createMockPool, createMockStake, createMockBorrow } from '../../mocks/positions';

describe('Sorting', () => {
  describe('sortPositions', () => {
    it('should sort positions by total value descending', () => {
      const positions: Record<string, RainbowPosition> = {
        uniswap: createMockRainbowPosition('uniswap', '1000'),
        aave: createMockRainbowPosition('aave', '5000'),
        curve: createMockRainbowPosition('curve', '500'),
      };

      const sorted = sortPositions(positions);
      const sortedArray = Object.values(sorted);

      expect(Object.keys(sorted).length).toBe(3);
      expect(sortedArray[0].type).toBe('aave');
      expect(sortedArray[1].type).toBe('uniswap');
      expect(sortedArray[2].type).toBe('curve');
    });

    it('should handle positions with same value', () => {
      const positions: Record<string, RainbowPosition> = {
        uniswap: createMockRainbowPosition('uniswap', '1000'),
        aave: createMockRainbowPosition('aave', '1000'),
      };

      const sorted = sortPositions(positions);
      const sortedArray = Object.values(sorted);

      expect(Object.keys(sorted).length).toBe(2);
      expect(['uniswap', 'aave']).toContain(sortedArray[0].type);
      expect(['uniswap', 'aave']).toContain(sortedArray[1].type);
    });
  });

  describe('sortPositionItems', () => {
    it('should sort deposits by value descending', () => {
      const positions: Record<string, RainbowPosition> = {
        aave: createMockRainbowPosition('aave', '2600', {
          deposits: [
            createMockDeposit('USDC', '100', '100'),
            createMockDeposit('ETH', '1', '2000'),
            createMockDeposit('DAI', '500', '500'),
          ],
        }),
      };

      const sorted = sortPositions(positions);

      expect(sorted.aave.deposits[0].asset.symbol).toBe('ETH');
      expect(sorted.aave.deposits[1].asset.symbol).toBe('DAI');
      expect(sorted.aave.deposits[2].asset.symbol).toBe('USDC');
    });

    it('should sort pools by value descending', () => {
      const positions: Record<string, RainbowPosition> = {
        uniswap: createMockRainbowPosition('uniswap', '4200', {
          pools: [createMockPool('USDC', '10', '200'), createMockPool('ETH', '2', '4000')],
        }),
      };

      const sorted = sortPositions(positions);

      expect(sorted.uniswap.pools[0].asset.symbol).toBe('ETH');
      expect(sorted.uniswap.pools[1].asset.symbol).toBe('USDC');
    });

    it('should sort stakes by value descending', () => {
      const positions: Record<string, RainbowPosition> = {
        curve: createMockRainbowPosition('curve', '450', {
          stakes: [createMockStake('CRV', '100', '300'), createMockStake('veCRV', '50', '150')],
        }),
      };

      const sorted = sortPositions(positions);

      expect(sorted.curve.stakes[0].asset.symbol).toBe('CRV');
      expect(sorted.curve.stakes[1].asset.symbol).toBe('veCRV');
    });

    it('should sort borrows by value descending', () => {
      const positions: Record<string, RainbowPosition> = {
        aave: createMockRainbowPosition('aave', '-1500', {
          borrows: [createMockBorrow('USDC', '1000', '1000'), createMockBorrow('DAI', '500', '500')],
        }),
      };

      const sorted = sortPositions(positions);

      expect(sorted.aave.borrows[0].asset.symbol).toBe('USDC');
      expect(sorted.aave.borrows[1].asset.symbol).toBe('DAI');
    });
  });
});
