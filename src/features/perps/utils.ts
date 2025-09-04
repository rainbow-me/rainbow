import { useHlNewPositionStore } from '@/features/perps/stores/hlNewPositionStore';
import { hyperliquidMarketStoreActions } from '@/features/perps/stores/hyperliquidMarketsStore';
import { PerpMarket, PerpPositionSide } from '@/features/perps/types';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { toFixedWorklet } from '@/safe-math/SafeMath';
import * as hl from '@nktkas/hyperliquid';

export function getHyperliquidTokenId(symbol: string): string {
  return `${symbol}:hl`;
}

export function getOppositePositionSide(side: PerpPositionSide): PerpPositionSide {
  return side === PerpPositionSide.LONG ? PerpPositionSide.SHORT : PerpPositionSide.LONG;
}

export function convertHyperliquidPerpAssetIdToSpotAssetId(assetId: number): number {
  return assetId + 10_000;
}

// TODO: hyperliquid might actually return this exactly in the "dir" field
/**
 * Converts a Fill object into a human-readable trade description
 * @param fill - The fill object from Hyperliquid API
 * @returns A string description of the trade type
 */
export function describeFill(fill: hl.Fill): string {
  const side = fill.side;
  const startPosition = parseFloat(fill.startPosition);
  const size = parseFloat(fill.sz);

  // Check if this is a liquidation
  if (fill.liquidation) {
    const method = fill.liquidation.method;
    const isLong = startPosition > 0;

    if (method === 'market') {
      return isLong ? 'Market order liquidation: close long' : 'Market order liquidation: close short';
    } else {
      return isLong ? 'Backstop liquidation: close long' : 'Backstop liquidation: close short';
    }
  }

  // Determine if opening or closing based on position change
  const endPosition = side === 'B' ? startPosition + size : startPosition - size;

  if (side === 'B') {
    // Buy side
    if (startPosition >= 0) {
      // Was already long or flat
      if (startPosition === 0) {
        return 'Buy';
      }
      // Adding to long position
      return 'Open long';
    } else {
      // Was short
      if (endPosition <= 0) {
        // Still short after trade, so closing some short
        return 'Close short';
      } else {
        // Flipped from short to long
        return 'Close short';
      }
    }
  } else {
    // Sell side
    if (startPosition <= 0) {
      // Was already short or flat
      if (startPosition === 0) {
        return 'Sell';
      }
      // Adding to short position
      return 'Open short';
    } else {
      // Was long
      if (endPosition >= 0) {
        // Still long after trade, so closing some long
        return 'Close long';
      } else {
        // Flipped from long to short
        return 'Close long';
      }
    }
  }
}

export function formatPriceChange(priceChange: string) {
  return `${toFixedWorklet(parseFloat(priceChange) * 10_000, 2)}%`;
}

/**
 * Calculate the estimated liquidation price for an isolated margin position.
 *
 * Based on Hyperliquid's documentation:
 * - Initial margin = position value / leverage
 * - Maintenance margin rate = (1 / maxLeverage) / 2
 * - Maintenance margin = position value * maintenance margin rate
 * - Liquidation occurs when: margin_available < maintenance_margin_required
 *
 * Formula from docs: liq_price = price - side * margin_available / position_size / (1 - l * side)
 * where l = 1 / MAINTENANCE_LEVERAGE
 *
 * @param params Position parameters
 * @returns Estimated liquidation price
 */
export function calculateIsolatedLiquidationPrice({
  entryPrice,
  positionSize,
  positionSide,
  leverage,
  maxLeverage,
}: {
  entryPrice: number;
  positionSize: number;
  positionSide: PerpPositionSide;
  leverage: number;
  maxLeverage: number;
}) {
  const isLong = positionSide === PerpPositionSide.LONG;
  const side = isLong ? 1 : -1;

  // Calculate initial margin (collateral)
  const positionValue = positionSize * entryPrice;
  const isolatedMargin = positionValue / leverage;

  // Calculate maintenance margin rate
  // From Hyperliquid docs: maintenance_margin_rate = (1 / maxLeverage) / 2
  const maintenanceMarginRate = 1 / maxLeverage / 2;
  const maintenanceMarginRequired = positionValue * maintenanceMarginRate;

  // Calculate margin available
  const marginAvailable = isolatedMargin - maintenanceMarginRequired;

  // Calculate maintenance leverage (used in liquidation formula)
  // MAINTENANCE_LEVERAGE = 2 * maxLeverage (since maintenance margin is half of initial at max leverage)
  const maintenanceLeverage = 2 * maxLeverage;
  const l = 1 / maintenanceLeverage;

  // Apply Hyperliquid's liquidation price formula:
  // liq_price = price - side * margin_available / position_size / (1 - l * side)
  const liquidationPrice = entryPrice - (side * marginAvailable) / positionSize / (1 - l * side);

  // Ensure liquidation price is positive
  return Math.max(0, liquidationPrice);
}

export function navigateToNewPositionScreen(market: PerpMarket) {
  useHlNewPositionStore.getState().setMarket(market);
  Navigation.handleAction(Routes.PERPS_NEW_POSITION_SCREEN);
}

export function navigateToPerpDetailScreen(symbol: string) {
  const market = hyperliquidMarketStoreActions.getMarket(symbol);
  if (market) {
    Navigation.handleAction(Routes.PERPS_ACCOUNT_NAVIGATOR, {
      screen: Routes.PERPS_DETAIL_SCREEN,
      // handleAction's implementation does not have proper nested stack param type checking
      params: { market },
    });
  }
}
