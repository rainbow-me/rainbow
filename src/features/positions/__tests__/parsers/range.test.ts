import { calculateRangeStatus, calculateAllocationPercentages } from '../../parsers/range';
import type { PositionAsset, RainbowUnderlyingAsset } from '../../types';

describe('Range Status Calculations', () => {
  describe('calculateRangeStatus', () => {
    it('should return full_range for non-concentrated liquidity', () => {
      const underlying: RainbowUnderlyingAsset[] = [
        {
          asset: { symbol: 'ETH' } as unknown as PositionAsset,
          quantity: '1',
          native: { amount: '1000', display: '$1000' },
        },
        {
          asset: { symbol: 'USDC' } as unknown as PositionAsset,
          quantity: '1000',
          native: { amount: '1000', display: '$1000' },
        },
      ];

      const status = calculateRangeStatus(underlying, false);
      expect(status).toBe('full_range');
    });

    it('should return out_of_range for single asset', () => {
      const underlying: RainbowUnderlyingAsset[] = [
        {
          asset: { symbol: 'ETH' } as unknown as PositionAsset,
          quantity: '1',
          native: { amount: '2000', display: '$2000' },
        },
      ];

      const status = calculateRangeStatus(underlying, true);
      expect(status).toBe('out_of_range');
    });

    it('should return out_of_range when any asset has zero quantity', () => {
      const underlying: RainbowUnderlyingAsset[] = [
        {
          asset: { symbol: 'ETH' } as unknown as PositionAsset,
          quantity: '1',
          native: { amount: '2000', display: '$2000' },
        },
        {
          asset: { symbol: 'USDC' } as unknown as PositionAsset,
          quantity: '0',
          native: { amount: '0', display: '$0' },
        },
      ];

      const status = calculateRangeStatus(underlying, true);
      expect(status).toBe('out_of_range');
    });

    it('should return in_range for balanced position', () => {
      const underlying: RainbowUnderlyingAsset[] = [
        {
          asset: { symbol: 'ETH' } as unknown as PositionAsset,
          quantity: '1',
          native: { amount: '1000', display: '$1000' },
        },
        {
          asset: { symbol: 'USDC' } as unknown as PositionAsset,
          quantity: '1000',
          native: { amount: '1000', display: '$1000' },
        },
      ];

      const status = calculateRangeStatus(underlying, true);
      expect(status).toBe('in_range');
    });

    it('should handle undefined underlying', () => {
      const status = calculateRangeStatus(undefined, true);
      expect(status).toBe('out_of_range');
    });

    it('should handle empty underlying array', () => {
      const status = calculateRangeStatus([], true);
      expect(status).toBe('out_of_range');
    });
  });

  describe('calculateAllocationPercentages', () => {
    it('should calculate 50/50 allocation', () => {
      const underlying: RainbowUnderlyingAsset[] = [
        {
          asset: { symbol: 'ETH' } as unknown as PositionAsset,
          quantity: '1',
          native: { amount: '1000', display: '$1000' },
        },
        {
          asset: { symbol: 'USDC' } as unknown as PositionAsset,
          quantity: '1000',
          native: { amount: '1000', display: '$1000' },
        },
      ];

      const allocation = calculateAllocationPercentages(underlying);
      expect(allocation).toBe('50/50');
    });

    it('should calculate 100/0 allocation for out of range', () => {
      const underlying: RainbowUnderlyingAsset[] = [
        {
          asset: { symbol: 'ETH' } as unknown as PositionAsset,
          quantity: '1',
          native: { amount: '2000', display: '$2000' },
        },
        {
          asset: { symbol: 'USDC' } as unknown as PositionAsset,
          quantity: '0',
          native: { amount: '0', display: '$0' },
        },
      ];

      const allocation = calculateAllocationPercentages(underlying);
      expect(allocation).toBe('100/0');
    });

    it('should calculate uneven allocation', () => {
      const underlying: RainbowUnderlyingAsset[] = [
        {
          asset: { symbol: 'ETH' } as unknown as PositionAsset,
          quantity: '1',
          native: { amount: '1600', display: '$1600' },
        },
        {
          asset: { symbol: 'USDC' } as unknown as PositionAsset,
          quantity: '400',
          native: { amount: '400', display: '$400' },
        },
      ];

      const allocation = calculateAllocationPercentages(underlying);
      expect(allocation).toBe('80/20');
    });

    it('should handle zero total value', () => {
      const underlying: RainbowUnderlyingAsset[] = [
        {
          asset: { symbol: 'ETH' } as unknown as PositionAsset,
          quantity: '0',
          native: { amount: '0', display: '$0' },
        },
        {
          asset: { symbol: 'USDC' } as unknown as PositionAsset,
          quantity: '0',
          native: { amount: '0', display: '$0' },
        },
      ];

      const allocation = calculateAllocationPercentages(underlying);
      expect(allocation).toBe('0/0');
    });

    it('should handle undefined underlying', () => {
      const allocation = calculateAllocationPercentages(undefined);
      expect(allocation).toBe('0');
    });

    it('should handle empty underlying array', () => {
      const allocation = calculateAllocationPercentages([]);
      expect(allocation).toBe('0');
    });

    it('should adjust for rounding errors', () => {
      const underlying: RainbowUnderlyingAsset[] = [
        {
          asset: { symbol: 'ETH' } as unknown as PositionAsset,
          quantity: '1',
          native: { amount: '333.33', display: '$333.33' },
        },
        {
          asset: { symbol: 'USDC' } as unknown as PositionAsset,
          quantity: '333.33',
          native: { amount: '333.33', display: '$333.33' },
        },
        {
          asset: { symbol: 'DAI' } as unknown as PositionAsset,
          quantity: '333.34',
          native: { amount: '333.34', display: '$333.34' },
        },
      ];

      const allocation = calculateAllocationPercentages(underlying);
      const percentages = allocation.split('/').map(Number);
      const sum = percentages.reduce((a, b) => a + b, 0);
      expect(sum).toBe(100);
    });
  });
});
