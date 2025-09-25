import { isConcentratedLiquidity } from '../../parsers/lp';

describe('LP Position Detection', () => {
  describe('isConcentratedLiquidity', () => {
    it('should identify Uniswap V3 as concentrated liquidity', () => {
      expect(isConcentratedLiquidity('uniswap-v3')).toBe(true);
      expect(isConcentratedLiquidity('uniswap', 'v3')).toBe(true);
      expect(isConcentratedLiquidity('uniswap', 'V3')).toBe(true);
    });

    it('should identify PancakeSwap V3 as concentrated liquidity', () => {
      expect(isConcentratedLiquidity('pancakeswap-v3')).toBe(true);
      expect(isConcentratedLiquidity('pancakeswap', 'v3')).toBe(true);
      expect(isConcentratedLiquidity('pancakeswap', 'V3')).toBe(true);
    });

    it('should identify other concentrated liquidity protocols', () => {
      expect(isConcentratedLiquidity('algebra')).toBe(true);
      expect(isConcentratedLiquidity('kyberswap-elastic')).toBe(true);
    });

    it('should not identify V2 protocols as concentrated liquidity', () => {
      expect(isConcentratedLiquidity('uniswap', 'v2')).toBe(false);
      expect(isConcentratedLiquidity('uniswap-v2')).toBe(false);
      expect(isConcentratedLiquidity('pancakeswap', 'v2')).toBe(false);
      expect(isConcentratedLiquidity('sushiswap')).toBe(false);
    });

    it('should handle case variations', () => {
      expect(isConcentratedLiquidity('Uniswap-V3')).toBe(true);
      expect(isConcentratedLiquidity('UNISWAP', 'v3')).toBe(true);
      expect(isConcentratedLiquidity('Algebra')).toBe(true);
    });

    it('should handle missing version', () => {
      expect(isConcentratedLiquidity('uniswap')).toBe(false);
      expect(isConcentratedLiquidity('uniswap', undefined)).toBe(false);
      expect(isConcentratedLiquidity('uniswap', '')).toBe(false);
    });

    it('should identify any V3 protocol as concentrated if in supported list', () => {
      expect(isConcentratedLiquidity('sushiswap', 'v3')).toBe(true);
    });

    it('should not identify random protocols with V3 as concentrated', () => {
      expect(isConcentratedLiquidity('random-protocol', 'v3')).toBe(false);
      expect(isConcentratedLiquidity('unknown', 'v3')).toBe(false);
    });
  });
});
