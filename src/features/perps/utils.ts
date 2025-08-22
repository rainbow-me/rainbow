import { PerpPositionSide } from '@/features/perps/types';
import { toFixedWorklet } from '@/safe-math/SafeMath';
import * as hl from '@nktkas/hyperliquid';

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

export function calculateMaintenanceMargin(marginTiers: Array<{ lowerBound: string; maxLeverage: number }>, positionValue: number): number {
  // Sort tiers by lowerBound in descending order to find the applicable tier
  const sortedTiers = [...marginTiers].sort((a, b) => parseFloat(b.lowerBound) - parseFloat(a.lowerBound));

  // Find the applicable tier - the highest lowerBound that's <= positionValue
  const applicableTier = sortedTiers.find(tier => positionValue >= parseFloat(tier.lowerBound));

  // If no tier found (shouldn't happen), use the first tier as fallback
  const tier = applicableTier || marginTiers[0];

  // Maintenance margin rate = 1 / maxLeverage
  return 1 / tier.maxLeverage;
}

export function calculateTradingMetrics(
  marketPrice: number,
  positionSize: number,
  leverage: number,
  side: PerpPositionSide,
  slippagePercent: number = 0.5,
  maintenanceMarginRate: number = 0.006
) {
  const orderValue = positionSize * marketPrice;
  const marginRequired = orderValue / leverage;

  const slippageMultiplier = 1 + slippagePercent / 100;
  const priceWithSlippage = side === 'LONG' ? marketPrice * slippageMultiplier : marketPrice / slippageMultiplier;

  const slippageAmount = Math.abs(priceWithSlippage - marketPrice) * positionSize;

  const estimatedLiquidationPrice =
    side === 'LONG' ? marketPrice * (1 - 1 / leverage + maintenanceMarginRate) : marketPrice * (1 + 1 / leverage - maintenanceMarginRate);

  return {
    orderValue,
    marginRequired,
    estimatedLiquidationPrice,
    slippageAmount,
    priceWithSlippage,
  };
}
