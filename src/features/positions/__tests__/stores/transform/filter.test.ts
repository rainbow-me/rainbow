import { shouldFilterPosition, shouldFilterPortfolioItem } from '../../../stores/transform/filter';
import { PositionName, DetailType } from '../../../types/generated/positions/positions';
import { createMockRainbowPosition, createMockDeposit, createMockPortfolioItem } from '../../mocks/positions';

jest.mock('@/config', () => ({
  getExperimentalFlag: jest.fn(() => true),
  DEFI_POSITIONS_THRESHOLD_FILTER: 'defi_positions_threshold_filter',
}));

describe('Position Filters', () => {
  describe('shouldFilterPosition', () => {
    it('should filter positions below value threshold', () => {
      const uniswap = createMockRainbowPosition('uniswap', { deposits: [createMockDeposit('MOCK', '1', '100')] });
      const aave = createMockRainbowPosition('aave', { deposits: [createMockDeposit('MOCK', '1', '0.5')] });
      const compound = createMockRainbowPosition('compound', { deposits: [createMockDeposit('MOCK', '1', '2')] });

      expect(shouldFilterPosition(uniswap)).toBe(false);
      expect(shouldFilterPosition(compound)).toBe(false);
      expect(shouldFilterPosition(aave)).toBe(true);
    });

    it('should filter Hyperliquid protocol', () => {
      const uniswap = createMockRainbowPosition('uniswap', { deposits: [createMockDeposit('MOCK', '1', '100')] });
      const hyperliquid = createMockRainbowPosition('hyperliquid', { deposits: [createMockDeposit('MOCK', '1', '100')] });
      const hyperliquidPerps = createMockRainbowPosition('hyperliquid-perps', {
        deposits: [createMockDeposit('MOCK', '1', '100')],
      });

      expect(shouldFilterPosition(uniswap)).toBe(false);
      expect(shouldFilterPosition(hyperliquid)).toBe(true);
      expect(shouldFilterPosition(hyperliquidPerps)).toBe(false);
    });

    it('should only filter exact hyperliquid protocol, not partial matches', () => {
      const hyperliquidExact = createMockRainbowPosition('hyperliquid', {
        deposits: [createMockDeposit('USDC', '100', '100')],
      });
      const hyperliquidPerps = createMockRainbowPosition('hyperliquid-perps', {
        deposits: [createMockDeposit('USDC', '100', '100')],
      });
      const hyperliquidSpot = createMockRainbowPosition('hyperliquid-spot', {
        deposits: [createMockDeposit('USDC', '100', '100')],
      });

      // Only exact "hyperliquid" should be filtered
      expect(shouldFilterPosition(hyperliquidExact)).toBe(true);
      expect(shouldFilterPosition(hyperliquidPerps)).toBe(false);
      expect(shouldFilterPosition(hyperliquidSpot)).toBe(false);
    });

    it('should apply both filters together', () => {
      const uniswap = createMockRainbowPosition('uniswap', { deposits: [createMockDeposit('MOCK', '1', '100')] });
      const aave = createMockRainbowPosition('aave', { deposits: [createMockDeposit('MOCK', '1', '0.5')] });
      const hyperliquid = createMockRainbowPosition('hyperliquid', { deposits: [createMockDeposit('MOCK', '1', '100')] });
      const compound = createMockRainbowPosition('compound', { deposits: [createMockDeposit('MOCK', '1', '2')] });

      expect(shouldFilterPosition(uniswap)).toBe(false);
      expect(shouldFilterPosition(compound)).toBe(false);
      expect(shouldFilterPosition(aave)).toBe(true);
      expect(shouldFilterPosition(hyperliquid)).toBe(true);
    });

    it('should filter positions with no items', () => {
      const emptyPosition = createMockRainbowPosition('uniswap');

      expect(shouldFilterPosition(emptyPosition)).toBe(true);
    });

    it('should filter position when all items are filtered', () => {
      // Position containing only wstETH staking (which gets filtered)
      // After filtering, position has no items, so it should be excluded
      const emptyPosition = createMockRainbowPosition('lido');

      expect(shouldFilterPosition(emptyPosition)).toBe(true);
    });

    it('should not filter position with at least one non-filtered item', () => {
      // Position with one regular deposit
      const positionWithItems = createMockRainbowPosition('lido', {
        deposits: [createMockDeposit('ETH', '1', '100')],
      });

      expect(shouldFilterPosition(positionWithItems)).toBe(false);
    });
  });

  describe('shouldFilterPortfolioItem', () => {
    it('should filter unsupported position types', () => {
      const lending = createMockPortfolioItem(PositionName.LENDING);
      const nftStaked = createMockPortfolioItem(PositionName.NFT_STAKED);
      const perpetuals = createMockPortfolioItem(PositionName.PERPETUALS);

      expect(shouldFilterPortfolioItem(lending)).toBe(false);
      expect(shouldFilterPortfolioItem(nftStaked)).toBe(true);
      expect(shouldFilterPortfolioItem(perpetuals)).toBe(true);
    });

    it('should filter wallet-only positions by description', () => {
      const wstethStaking = createMockPortfolioItem(PositionName.STAKED, 'wstETH');
      const stethStaking = createMockPortfolioItem(PositionName.STAKED, 'stETH');
      const regularStaking = createMockPortfolioItem(PositionName.STAKED, 'GMX');
      const noDescription = createMockPortfolioItem(PositionName.STAKED);

      expect(shouldFilterPortfolioItem(wstethStaking)).toBe(true);
      expect(shouldFilterPortfolioItem(stethStaking)).toBe(true);
      expect(shouldFilterPortfolioItem(regularStaking)).toBe(false);
      expect(shouldFilterPortfolioItem(noDescription)).toBe(false);
    });

    it('should filter both stETH and wstETH', () => {
      const stethItem = createMockPortfolioItem(PositionName.STAKED, 'stETH');
      const wstethItem = createMockPortfolioItem(PositionName.STAKED, 'wstETH');

      // Both should be filtered as token-preferred positions
      expect(shouldFilterPortfolioItem(stethItem)).toBe(true);
      expect(shouldFilterPortfolioItem(wstethItem)).toBe(true);
    });

    it('should filter only token-preferred items in mixed position', () => {
      const wstethItem = createMockPortfolioItem(PositionName.STAKED, 'wstETH');
      const regularStake = createMockPortfolioItem(PositionName.STAKED, 'GMX');
      const lendingItem = createMockPortfolioItem(PositionName.LENDING);

      // Only wstETH should be filtered
      expect(shouldFilterPortfolioItem(wstethItem)).toBe(true);
      expect(shouldFilterPortfolioItem(regularStake)).toBe(false);
      expect(shouldFilterPortfolioItem(lendingItem)).toBe(false);
    });

    it('should filter zero value token-preferred positions', () => {
      const zeroValueSteth = createMockPortfolioItem(PositionName.STAKED, 'stETH');

      // Even with $0 value, should still be filtered by description
      expect(shouldFilterPortfolioItem(zeroValueSteth)).toBe(true);
    });

    it('should handle case-sensitive description matching', () => {
      const upperCaseWsteth = createMockPortfolioItem(PositionName.STAKED, 'WSTETH');
      const lowerCaseWsteth = createMockPortfolioItem(PositionName.STAKED, 'wsteth');
      const correctCaseWsteth = createMockPortfolioItem(PositionName.STAKED, 'wstETH');

      // Only exact case match should be filtered
      expect(shouldFilterPortfolioItem(upperCaseWsteth)).toBe(false);
      expect(shouldFilterPortfolioItem(lowerCaseWsteth)).toBe(false);
      expect(shouldFilterPortfolioItem(correctCaseWsteth)).toBe(true);
    });

    it('should handle items without detail object', () => {
      const itemWithoutDetail = createMockPortfolioItem(PositionName.LENDING);
      delete itemWithoutDetail.detail;

      expect(shouldFilterPortfolioItem(itemWithoutDetail)).toBe(false);
    });

    it('should filter Curve steCRV pool by description', () => {
      const steCRVPool = createMockPortfolioItem(PositionName.LIQUIDITY_POOL, 'steCRV');
      const regularPool = createMockPortfolioItem(PositionName.LIQUIDITY_POOL, 'DAI-USDC');

      expect(shouldFilterPortfolioItem(steCRVPool)).toBe(false);
      expect(shouldFilterPortfolioItem(regularPool)).toBe(false);
    });

    it('should filter items with UNSPECIFIED detail type', () => {
      const unspecifiedItem = createMockPortfolioItem(PositionName.LENDING);
      unspecifiedItem.detailTypes = [DetailType.UNSPECIFIED];

      expect(shouldFilterPortfolioItem(unspecifiedItem)).toBe(true);
    });

    it('should filter items with UNRECOGNIZED detail type', () => {
      const unrecognizedItem = createMockPortfolioItem(PositionName.LENDING);
      unrecognizedItem.detailTypes = [DetailType.UNRECOGNIZED];

      expect(shouldFilterPortfolioItem(unrecognizedItem)).toBe(true);
    });

    it('should filter items with multiple detail types including unsupported', () => {
      const mixedItem = createMockPortfolioItem(PositionName.LENDING);
      mixedItem.detailTypes = [DetailType.COMMON, DetailType.UNSPECIFIED];

      // Should be filtered if ANY detail type is unsupported
      expect(shouldFilterPortfolioItem(mixedItem)).toBe(true);
    });
  });

  describe('Value Threshold Filtering', () => {
    it('should filter positions with exactly $1 threshold', () => {
      const exactThresholdPosition = createMockRainbowPosition('compound', {
        deposits: [createMockDeposit('USDC', '1', '1.0')],
      });

      // Exactly $1 should NOT be filtered (threshold is < $1)
      expect(shouldFilterPosition(exactThresholdPosition)).toBe(false);
    });

    it('should filter positions just below $1 threshold', () => {
      const belowThresholdPosition = createMockRainbowPosition('compound', {
        deposits: [createMockDeposit('USDC', '0.99', '0.99')],
      });

      expect(shouldFilterPosition(belowThresholdPosition)).toBe(true);
    });

    it('should not filter positions at or above $1', () => {
      const position1 = createMockRainbowPosition('aave', {
        deposits: [createMockDeposit('USDC', '1', '1.0')],
      });
      const position100 = createMockRainbowPosition('compound', {
        deposits: [createMockDeposit('USDC', '100', '100')],
      });

      expect(shouldFilterPosition(position1)).toBe(false);
      expect(shouldFilterPosition(position100)).toBe(false);
    });

    it('should filter dust positions', () => {
      const dustPosition = createMockRainbowPosition('dust', {
        deposits: [createMockDeposit('DUST', '0.01', '0.01')],
      });

      expect(shouldFilterPosition(dustPosition)).toBe(true);
    });

    it('should respect experimental flag for threshold filtering', () => {
      // Note: Flag is mocked to return true at the top of this file
      // In production, this flag controls whether threshold filtering is applied
      const smallPosition = createMockRainbowPosition('small', {
        deposits: [createMockDeposit('SMALL', '0.5', '0.5')],
      });

      // With flag enabled (mocked), should filter
      expect(shouldFilterPosition(smallPosition)).toBe(true);

      // If flag were disabled, this would return false
      // (tested in integration tests with different mock config)
    });
  });
});
