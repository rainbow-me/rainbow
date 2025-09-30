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
 * For pools with >2 assets, shows top 2 by value + "Other"
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

  // Sort assets by value (highest first) and calculate percentages
  const assetsWithPercentage = underlying
    .map(asset => {
      const value = parseFloat(asset.native?.amount || '0');
      const percentage = (value / totalValue) * 100;
      return {
        value,
        percentage: Math.round(percentage),
      };
    })
    .sort((a, b) => b.value - a.value);

  let percentages: number[];

  // If more than 2 assets, group assets beyond top 2 as "Other"
  if (assetsWithPercentage.length > 2) {
    const top2 = assetsWithPercentage.slice(0, 2).map(a => a.percentage);
    const othersSum = assetsWithPercentage.slice(2).reduce((sum, a) => sum + a.percentage, 0);
    percentages = [...top2, othersSum];
  } else {
    percentages = assetsWithPercentage.map(a => a.percentage);
  }

  // Adjust for rounding errors - ensure sum is 100
  const sum = percentages.reduce((a, b) => a + b, 0);
  if (sum !== 100 && percentages.length > 0) {
    const diff = 100 - sum;
    percentages[0] += diff;
  }

  // Format as "50/50" or "50/30/20" (top 2 + other)
  return percentages.join('/');
}
