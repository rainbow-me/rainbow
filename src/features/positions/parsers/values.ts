import type { PositionToken, NativeDisplay, RainbowUnderlyingAsset, PositionAsset } from '../types';
import { add } from '@/helpers/utilities';
import { createNativeDisplay } from './totals';

/**
 * Calculate native display value for a position token
 * NOTE: The new API provides amounts in decimal format (e.g., "414.657" not "414657264863515540000")
 */
export function calculateTokenNativeDisplay(token: PositionToken, currency: string): NativeDisplay {
  if (!token.asset) {
    return createNativeDisplay('0', currency);
  }

  const amount = token.amount || '0';
  const price = token.asset.price?.value || 0;

  // Amount is already in decimal format from the new API
  // Calculate USD value: amount * price
  const nativeValue = (parseFloat(amount) * price).toString();

  return createNativeDisplay(nativeValue, currency);
}

/**
 * Create Rainbow underlying asset with native values
 */
function createRainbowUnderlyingAsset(token: PositionToken, currency: string): RainbowUnderlyingAsset | null {
  if (!token.asset) return null;

  return {
    asset: {
      ...token.asset,
      chain_id: token.asset.chainId,
      icon_url: token.asset.iconUrl,
      price: token.asset.price
        ? {
            ...token.asset.price,
            changed_at: token.asset.price.changedAt?.getTime() || 0,
            relative_change_24h: token.asset.price.relativeChange24h || 0,
          }
        : undefined,
    } as PositionAsset,
    quantity: token.amount || '0',
    native: calculateTokenNativeDisplay(token, currency),
  };
}

/**
 * Process array of tokens into Rainbow underlying assets
 */
export function processUnderlyingAssets(tokens: PositionToken[] | undefined, currency: string): RainbowUnderlyingAsset[] {
  if (!tokens || tokens.length === 0) {
    return [];
  }

  return tokens
    .map(token => createRainbowUnderlyingAsset(token, currency))
    .filter((asset): asset is RainbowUnderlyingAsset => asset !== null);
}

/**
 * Calculate total value from underlying assets
 */
export function calculateTotalValue(underlying: RainbowUnderlyingAsset[]): string {
  return underlying.reduce((total, asset) => {
    return add(total, asset.native.amount || '0');
  }, '0');
}
