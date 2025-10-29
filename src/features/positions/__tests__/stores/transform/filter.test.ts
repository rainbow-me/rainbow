import { shouldFilterPosition, shouldFilterPortfolioItem } from '../../../stores/transform/filter';
import { PositionName } from '../../../types/generated/positions/positions';
import { createMockRainbowPosition, createMockDeposit, createMockPortfolioItem } from '../../mocks/positions';

jest.mock('@/config', () => ({
  getExperimentalFlag: jest.fn(() => true),
  DEFI_POSITIONS_THRESHOLD_FILTER: 'defi_positions_threshold_filter',
}));

describe('Position Filters', () => {
  describe('shouldFilterPosition', () => {
    it('should filter positions below value threshold', () => {
      const uniswap = createMockRainbowPosition('uniswap', '100', { deposits: [createMockDeposit('MOCK', '1', '100')] });
      const aave = createMockRainbowPosition('aave', '0.5', { deposits: [createMockDeposit('MOCK', '1', '0.5')] });
      const compound = createMockRainbowPosition('compound', '2', { deposits: [createMockDeposit('MOCK', '1', '2')] });

      expect(shouldFilterPosition(uniswap)).toBe(false);
      expect(shouldFilterPosition(compound)).toBe(false);
      expect(shouldFilterPosition(aave)).toBe(true);
    });

    it('should filter Hyperliquid protocol', () => {
      const uniswap = createMockRainbowPosition('uniswap', '100', { deposits: [createMockDeposit('MOCK', '1', '100')] });
      const hyperliquid = createMockRainbowPosition('hyperliquid', '100', { deposits: [createMockDeposit('MOCK', '1', '100')] });
      const hyperliquidPerps = createMockRainbowPosition('hyperliquid-perps', '100', {
        deposits: [createMockDeposit('MOCK', '1', '100')],
      });

      expect(shouldFilterPosition(uniswap)).toBe(false);
      expect(shouldFilterPosition(hyperliquid)).toBe(true);
      expect(shouldFilterPosition(hyperliquidPerps)).toBe(false);
    });

    it('should apply both filters together', () => {
      const uniswap = createMockRainbowPosition('uniswap', '100', { deposits: [createMockDeposit('MOCK', '1', '100')] });
      const aave = createMockRainbowPosition('aave', '0.5', { deposits: [createMockDeposit('MOCK', '1', '0.5')] });
      const hyperliquid = createMockRainbowPosition('hyperliquid', '100', { deposits: [createMockDeposit('MOCK', '1', '100')] });
      const compound = createMockRainbowPosition('compound', '2', { deposits: [createMockDeposit('MOCK', '1', '2')] });

      expect(shouldFilterPosition(uniswap)).toBe(false);
      expect(shouldFilterPosition(compound)).toBe(false);
      expect(shouldFilterPosition(aave)).toBe(true);
      expect(shouldFilterPosition(hyperliquid)).toBe(true);
    });

    it('should filter positions with no items', () => {
      const emptyPosition = createMockRainbowPosition('uniswap', '100');

      expect(shouldFilterPosition(emptyPosition)).toBe(true);
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
  });
});
