import { type RainbowUnderlyingAsset, type RangeStatus, type LpAllocation } from '../../../types';

// ============ Constants ====================================================== //

const CONCENTRATED_LIQUIDITY_PROTOCOLS = [
  // Uniswap family
  'uniswap-v3',
  'uniswap-v4',
  // PancakeSwap
  'pancakeswap-v3',
  // Algebra-based
  'algebra',
  // KyberSwap
  'kyberswap-elastic',
  // Velodrome & Aerodrome (Slipstream = v3)
  'velodrome-v3',
  'velodrome-slipstream',
  'aerodrome-slipstream',
  'aerodrome-v3',
  // SushiSwap
  'sushiswap-v3',
  // Trader Joe
  'trader-joe-v2.1',
  'trader-joe-liquidity-book',
  'traderjoe-v2.1',
  'traderjoe-liquidity-book',
  // Maverick
  'maverick',
  'maverick-amm',
  // Ambient / CrocSwap
  'ambient',
  'ambient-finance',
  'crocswap',
  // iZiSwap / iZumi
  'iziswap',
  'izumi',
  // QuickSwap
  'quickswap-v3',
  // Ekubo
  'ekubo',
];

// ============ Concentrated Liquidity ========================================= //

/**
 * Determine if a protocol supports concentrated liquidity
 */
export function isConcentratedLiquidityProtocol(protocolName: string, canonicalProtocolName: string, protocolVersion?: string): boolean {
  // Try canonical name with version first (most reliable)
  const normalizedCanonical = canonicalProtocolName.toLowerCase().trim();
  const normalizedVersion = protocolVersion?.toLowerCase();

  // Check canonical with version suffix
  if (normalizedVersion) {
    const withVersion = `${normalizedCanonical}-${normalizedVersion}`;
    if (CONCENTRATED_LIQUIDITY_PROTOCOLS.includes(withVersion)) {
      return true;
    }
  }

  // Check canonical direct match
  if (CONCENTRATED_LIQUIDITY_PROTOCOLS.includes(normalizedCanonical)) {
    return true;
  }

  return false;
}

/**
 * Calculate range status for LP positions
 */
export function calculateLiquidityRangeStatus(
  underlying: RainbowUnderlyingAsset[] | undefined,
  isConcentratedLiquidity: boolean
): RangeStatus {
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
 * Calculate allocation percentages as numbers for LP positions
 * For pools with >2 assets, shows top 2 by value + "Other"
 * Returns array of percentages that always sum to 100
 */
function calculateLiquidityAllocationPercentages(underlying: RainbowUnderlyingAsset[] | undefined): number[] {
  // Default to 100% for empty or single asset
  if (!underlying || underlying.length === 0) {
    return [100];
  }

  if (underlying.length === 1) {
    return [100];
  }

  // Calculate total value
  const totalValue = underlying.reduce((sum, asset) => {
    const value = parseFloat(asset.value?.amount || '0');
    return sum + value;
  }, 0);

  // If total value is zero, distribute equally
  if (totalValue === 0) {
    const count = Math.min(underlying.length, 2); // Show at most 2 assets
    const equalShare = Math.floor(100 / count);
    const percentages = new Array(count).fill(equalShare);

    // Adjust first percentage to ensure sum is exactly 100
    percentages[0] = 100 - equalShare * (count - 1);

    // If more than 2 assets, add "Other" with 0%
    if (underlying.length > 2) {
      percentages.push(0);
    }

    return percentages;
  }

  // Calculate percentages in the provided order (no sorting)
  const assetsWithPercentage = underlying.map(asset => {
    const value = parseFloat(asset.value?.amount || '0');
    const percentage = (value / totalValue) * 100;
    return {
      value,
      percentage: Math.round(percentage),
    };
  });

  let percentages: number[];

  // If more than 2 assets, show first 2 + group the rest as "Other"
  if (assetsWithPercentage.length > 2) {
    const first2 = assetsWithPercentage.slice(0, 2).map(a => a.percentage);
    const othersSum = assetsWithPercentage.slice(2).reduce((sum, a) => sum + a.percentage, 0);
    percentages = [...first2, othersSum];
  } else {
    percentages = assetsWithPercentage.map(a => a.percentage);
  }

  // Adjust for rounding errors - ensure sum is exactly 100
  const sum = percentages.reduce((a, b) => a + b, 0);
  if (sum !== 100 && percentages.length > 0) {
    const diff = 100 - sum;
    percentages[0] += diff;
  }

  return percentages;
}

/**
 * Calculate allocation data for LP positions
 * For pools with >2 assets, shows top 2 by value + "Other"
 * Returns object with display string, percentages array, and splits count
 * Values always sum to 100%, never returns "0%"
 */
export function calculateLiquidityAllocation(underlying: RainbowUnderlyingAsset[] | undefined): LpAllocation {
  const percentages = calculateLiquidityAllocationPercentages(underlying);
  const display = percentages.map(p => `${p}%`).join(' / ');
  const splits = percentages.length;
  return { display, percentages, splits };
}
