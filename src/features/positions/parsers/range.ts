import type { RainbowUnderlyingAsset, RangeStatus } from '../types';

/**
 * Calculate range status for LP positions
 */
export function calculateRangeStatus(underlying: RainbowUnderlyingAsset[] | undefined, isConcentratedLiquidity: boolean): RangeStatus {
  // Traditional AMMs are always full range
  if (!isConcentratedLiquidity) {
    return 'full_range';
  }

  // No underlying assets means out of range
  if (!underlying || underlying.length === 0) {
    return 'out_of_range';
  }

  // Single asset means completely out of range
  if (underlying.length === 1) {
    return 'out_of_range';
  }

  // Check if any asset has zero quantity (out of range indicator)
  const hasZeroAsset = underlying.some(asset => {
    const quantity = parseFloat(asset.quantity || '0');
    return quantity === 0;
  });

  return hasZeroAsset ? 'out_of_range' : 'in_range';
}

/**
 * Calculate allocation percentages for LP positions
 */
export function calculateAllocationPercentages(underlying: RainbowUnderlyingAsset[] | undefined): string {
  if (!underlying || underlying.length === 0) {
    return '0';
  }

  // Calculate total value
  const totalValue = underlying.reduce((sum, asset) => {
    const value = parseFloat(asset.native?.amount || '0');
    return sum + value;
  }, 0);

  if (totalValue === 0) {
    // Handle zero value edge case
    if (underlying.length === 1) {
      return '100';
    }
    return underlying.map(() => '0').join('/');
  }

  // Calculate percentage for each asset
  const percentages = underlying.map(asset => {
    const value = parseFloat(asset.native?.amount || '0');
    const percentage = (value / totalValue) * 100;
    return Math.round(percentage);
  });

  // Adjust for rounding errors - ensure sum is 100
  const sum = percentages.reduce((a, b) => a + b, 0);
  if (sum !== 100 && percentages.length > 0) {
    const diff = 100 - sum;
    percentages[0] += diff;
  }

  // Format as "50/50" or "80/20"
  return percentages.join('/');
}
