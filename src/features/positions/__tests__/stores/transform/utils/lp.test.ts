import {
  isConcentratedLiquidityProtocol,
  calculateLiquidityRangeStatus,
  calculateLiquidityAllocation,
} from '../../../../stores/transform/utils/lp';
import type { PositionAsset, RainbowUnderlyingAsset } from '../../../../types';

describe('LP Position Detection', () => {
  describe('isConcentratedLiquidityProtocol', () => {
    it('should identify Uniswap V3 as concentrated liquidity', () => {
      expect(isConcentratedLiquidityProtocol('uniswap-v3', 'uniswap-v3')).toBe(true);
      expect(isConcentratedLiquidityProtocol('uniswap', 'uniswap', 'v3')).toBe(true);
      expect(isConcentratedLiquidityProtocol('uniswap', 'uniswap', 'V3')).toBe(true);
    });

    it('should identify PancakeSwap V3 as concentrated liquidity', () => {
      expect(isConcentratedLiquidityProtocol('pancakeswap-v3', 'pancakeswap-v3')).toBe(true);
      expect(isConcentratedLiquidityProtocol('pancakeswap', 'pancakeswap', 'v3')).toBe(true);
      expect(isConcentratedLiquidityProtocol('pancakeswap', 'pancakeswap', 'V3')).toBe(true);
    });

    it('should identify other concentrated liquidity protocols', () => {
      expect(isConcentratedLiquidityProtocol('algebra', 'algebra')).toBe(true);
      expect(isConcentratedLiquidityProtocol('kyberswap-elastic', 'kyberswap-elastic')).toBe(true);
    });

    it('should not identify V2 protocols as concentrated liquidity', () => {
      expect(isConcentratedLiquidityProtocol('uniswap', 'uniswap', 'v2')).toBe(false);
      expect(isConcentratedLiquidityProtocol('uniswap-v2', 'uniswap-v2')).toBe(false);
      expect(isConcentratedLiquidityProtocol('pancakeswap', 'pancakeswap', 'v2')).toBe(false);
      expect(isConcentratedLiquidityProtocol('sushiswap', 'sushiswap')).toBe(false);
    });

    it('should handle case variations', () => {
      expect(isConcentratedLiquidityProtocol('Uniswap-V3', 'Uniswap-V3')).toBe(true);
      expect(isConcentratedLiquidityProtocol('UNISWAP', 'UNISWAP', 'v3')).toBe(true);
      expect(isConcentratedLiquidityProtocol('Algebra', 'Algebra')).toBe(true);
    });

    it('should handle missing version', () => {
      expect(isConcentratedLiquidityProtocol('uniswap', 'uniswap')).toBe(false);
      expect(isConcentratedLiquidityProtocol('uniswap', 'uniswap', undefined)).toBe(false);
      expect(isConcentratedLiquidityProtocol('uniswap', 'uniswap', '')).toBe(false);
    });

    it('should identify any V3 protocol as concentrated if in supported list', () => {
      expect(isConcentratedLiquidityProtocol('sushiswap', 'sushiswap', 'v3')).toBe(true);
    });

    it('should not identify random protocols with V3 as concentrated', () => {
      expect(isConcentratedLiquidityProtocol('random-protocol', 'random-protocol', 'v3')).toBe(false);
      expect(isConcentratedLiquidityProtocol('unknown', 'unknown', 'v3')).toBe(false);
    });
  });

  describe('Range Status Calculations', () => {
    describe('calculateLiquidityRangeStatus', () => {
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

        const status = calculateLiquidityRangeStatus(underlying, false);
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

        const status = calculateLiquidityRangeStatus(underlying, true);
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

        const status = calculateLiquidityRangeStatus(underlying, true);
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

        const status = calculateLiquidityRangeStatus(underlying, true);
        expect(status).toBe('in_range');
      });

      it('should handle undefined underlying', () => {
        const status = calculateLiquidityRangeStatus(undefined, true);
        expect(status).toBe('out_of_range');
      });

      it('should handle empty underlying array', () => {
        const status = calculateLiquidityRangeStatus([], true);
        expect(status).toBe('out_of_range');
      });
    });

    describe('calculateLiquidityAllocation', () => {
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

        const allocation = calculateLiquidityAllocation(underlying);
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

        const allocation = calculateLiquidityAllocation(underlying);
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

        const allocation = calculateLiquidityAllocation(underlying);
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

        const allocation = calculateLiquidityAllocation(underlying);
        expect(allocation).toBe('0/0');
      });

      it('should handle undefined underlying', () => {
        const allocation = calculateLiquidityAllocation(undefined);
        expect(allocation).toBe('0');
      });

      it('should handle empty underlying array', () => {
        const allocation = calculateLiquidityAllocation([]);
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

        const allocation = calculateLiquidityAllocation(underlying);
        const percentages = allocation.split('/').map(Number);
        const sum = percentages.reduce((a, b) => a + b, 0);
        expect(sum).toBe(100);
      });

      it('should group assets beyond top 2 as "Other"', () => {
        // Simulating the edge case with 9 tokens
        const underlying: RainbowUnderlyingAsset[] = [
          {
            asset: { symbol: 'ENA' } as unknown as PositionAsset,
            quantity: '0.111',
            native: { amount: '0.0624', display: '$0.06' }, // ~6%
          },
          {
            asset: { symbol: 'UNI' } as unknown as PositionAsset,
            quantity: '0.011',
            native: { amount: '0.0878', display: '$0.09' }, // ~9%
          },
          {
            asset: { symbol: 'AAVE' } as unknown as PositionAsset,
            quantity: '0.0006',
            native: { amount: '0.1785', display: '$0.18' }, // ~18%
          },
          {
            asset: { symbol: 'MKR' } as unknown as PositionAsset,
            quantity: '0.00003',
            native: { amount: '0.059', display: '$0.06' }, // ~6%
          },
          {
            asset: { symbol: 'WETH' } as unknown as PositionAsset,
            quantity: '0.0001',
            native: { amount: '0.486', display: '$0.49' }, // ~50%
          },
          {
            asset: { symbol: 'LDO' } as unknown as PositionAsset,
            quantity: '0.038',
            native: { amount: '0.045', display: '$0.05' }, // ~5%
          },
          {
            asset: { symbol: 'COMP' } as unknown as PositionAsset,
            quantity: '0.0003',
            native: { amount: '0.0158', display: '$0.02' }, // ~2%
          },
          {
            asset: { symbol: 'PENDLE' } as unknown as PositionAsset,
            quantity: '0.007',
            native: { amount: '0.0329', display: '$0.03' }, // ~3%
          },
          {
            asset: { symbol: 'RPL' } as unknown as PositionAsset,
            quantity: '0.0008',
            native: { amount: '0.004', display: '$0.004' }, // ~0.4%
          },
        ];

        const allocation = calculateLiquidityAllocation(underlying);
        const percentages = allocation.split('/').map(Number);

        // Should have exactly 3 values: top 2 + "Other"
        expect(percentages).toHaveLength(3);

        // Should sum to 100
        const sum = percentages.reduce((a, b) => a + b, 0);
        expect(sum).toBe(100);

        // Top 2 should be the highest values (WETH ~50%, AAVE ~18%)
        expect(percentages[0]).toBeGreaterThanOrEqual(48); // WETH
        expect(percentages[1]).toBeGreaterThanOrEqual(16); // AAVE

        // Others should be aggregated (UNI 9% + ENA 6% + MKR 6% + LDO 5% + PENDLE 3% + COMP 2% + RPL 0.4% ≈ 32%)
        expect(percentages[2]).toBeGreaterThanOrEqual(30); // Other
      });
    });
  });
});
