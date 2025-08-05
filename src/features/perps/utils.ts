import { PositionSide } from '@/features/perps/types';
import * as hl from '@nktkas/hyperliquid';

export function getOppositePositionSide(side: PositionSide): PositionSide {
  return side === 'LONG' ? 'SHORT' : 'LONG';
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
