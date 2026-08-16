import { HYPERLIQUID_TOKEN_ID_SUFFIX, SPOT_ASSET_ID_OFFSET } from '@/features/perps/constants';
import { PerpPositionSide, type OrderSide } from '@/features/perps/types';
import { toFixedWorklet } from '@/framework/core/safeMath';
import { ensureError } from '@/logger';

export function getHyperliquidTokenId(symbol?: string): string {
  if (!symbol) return '';
  return `${symbol}:${HYPERLIQUID_TOKEN_ID_SUFFIX}`;
}

export function getOppositePositionSide(side: PerpPositionSide): PerpPositionSide {
  return side === PerpPositionSide.LONG ? PerpPositionSide.SHORT : PerpPositionSide.LONG;
}

export function convertHyperliquidPerpAssetIdToSpotAssetId(assetId: number): number {
  return assetId + SPOT_ASSET_ID_OFFSET;
}

export function formatPriceChange(priceChange: string) {
  'worklet';
  return `${toFixedWorklet(Number(priceChange) * 10_000, 2)}%`;
}

/**
 * Converts Hyperliquid's stored fractional price change to display percent units.
 */
export function convertStoredPerpPriceChangeToPercent(priceChange: string): number {
  'worklet';
  return Number(priceChange) * 10_000;
}

/**
 * Formats a compact percentage change string for display.
 */
export function formatCompactPerpPercentChange(percentChange: number): string {
  'worklet';
  const numericValue = Math.abs(percentChange);
  if (!Number.isFinite(numericValue)) return '0.00%';
  return `${numericValue.toFixed(2)}%`;
}

export function convertSide(side: 'B' | 'A'): OrderSide {
  return side === 'B' ? 'buy' : 'sell';
}

// Error strings are in the format: "Order ${orderNumber}: ${message}. asset=${assetId}"
export function parseHyperliquidErrorMessage(e: unknown): string {
  const error = ensureError(e);
  const match = error.message.match(/Order (\d+): (.+)\. asset=(\d+)/);
  return match ? match[2] : error.message;
}
