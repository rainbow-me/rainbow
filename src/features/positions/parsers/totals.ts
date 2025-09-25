import type { PositionsTotals, NativeDisplay, Stats } from '../types';
import { convertAmountToNativeDisplay, add, subtract } from '@/helpers/utilities';
import { NativeCurrencyKey } from '@/entities';

/**
 * Initialize empty position totals
 */
export function initializePositionTotals(): PositionsTotals {
  return {
    totals: { amount: '0', display: '$0.00' },
    totalDeposits: { amount: '0', display: '$0.00' },
    totalBorrows: { amount: '0', display: '$0.00' },
    totalRewards: { amount: '0', display: '$0.00' },
    totalLocked: '0',
  };
}

/**
 * Create native display value
 */
export function createNativeDisplay(amount: string, currency: string): NativeDisplay {
  return {
    amount,
    display: convertAmountToNativeDisplay(amount, currency as NativeCurrencyKey),
  };
}

/**
 * Update position totals with stats from backend
 */
export function updatePositionTotals(totals: PositionsTotals, stats: Stats | undefined, currency: string): void {
  if (!stats) return;

  const assetValue = stats.assetValue || '0';
  const netValue = stats.netValue || assetValue;

  // Update main totals
  totals.totals = createNativeDisplay(add(totals.totals.amount, netValue), currency);

  // Note: We don't have category breakdowns from Stats
  // These would need to be calculated from actual position data
}

/**
 * Add position totals together
 */
export function addPositionTotals(totals1: PositionsTotals, totals2: PositionsTotals, currency: string): PositionsTotals {
  return {
    totals: createNativeDisplay(add(totals1.totals.amount, totals2.totals.amount), currency),
    totalDeposits: createNativeDisplay(add(totals1.totalDeposits.amount, totals2.totalDeposits.amount), currency),
    totalBorrows: createNativeDisplay(add(totals1.totalBorrows.amount, totals2.totalBorrows.amount), currency),
    totalRewards: createNativeDisplay(add(totals1.totalRewards.amount, totals2.totalRewards.amount), currency),
    totalLocked: '0',
  };
}

/**
 * Calculate grand totals across all positions
 */
export function calculateGrandTotals(
  positions: { totals: PositionsTotals }[],
  currency: string
): PositionsTotals & { total: NativeDisplay } {
  const totals = positions.reduce((acc, position) => addPositionTotals(acc, position.totals, currency), initializePositionTotals());

  return {
    ...totals,
    total: totals.totals, // Grand total is same as totals.totals
  };
}

/**
 * Calculate position total from categories
 */
export function calculatePositionTotal(
  deposits: string,
  stakes: string,
  borrows: string,
  rewards: string,
  currency: string
): NativeDisplay {
  // Formula: (Deposits + Stakes + Rewards) - Borrows
  const assets = add(add(deposits, stakes), rewards);
  const netValue = subtract(assets, borrows);

  return createNativeDisplay(netValue, currency);
}
