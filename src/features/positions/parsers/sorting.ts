import type { RainbowPosition, ProtocolGroup } from '../types';
import { logger } from '@/logger';

/**
 * Sort positions by total value (highest first)
 */
export function sortPositionsByValue(positions: ProtocolGroup): RainbowPosition[] {
  const sorted = Object.values(positions).sort((a, b) => {
    const aValue = parseFloat(a.totals?.totals?.amount || '0');
    const bValue = parseFloat(b.totals?.totals?.amount || '0');
    return bValue - aValue; // Descending order
  });

  // Sort individual items within each position
  sorted.forEach(position => {
    sortPositionItems(position);
  });

  logger.debug('[Sorting] Sorted positions', {
    count: sorted.length,
    topProtocol: sorted[0]?.type,
    topValue: sorted[0]?.totals?.totals?.display,
  });

  return sorted;
}

/**
 * Sort items within a position by value
 */
export function sortPositionItems(position: RainbowPosition): void {
  // Sort function for items with totalValue
  const byTotalValue = (a: { totalValue: string }, b: { totalValue: string }) => {
    const aValue = parseFloat(a.totalValue || '0');
    const bValue = parseFloat(b.totalValue || '0');
    return bValue - aValue;
  };

  // Sort function for rewards (use native.amount)
  const byNativeAmount = (a: { native?: { amount?: string } }, b: { native?: { amount?: string } }) => {
    const aValue = parseFloat(a.native?.amount || '0');
    const bValue = parseFloat(b.native?.amount || '0');
    return bValue - aValue;
  };

  // Sort each category by value
  position.deposits.sort(byTotalValue);
  position.pools.sort(byTotalValue);
  position.stakes.sort(byTotalValue);
  position.borrows.sort(byTotalValue);
  position.rewards.sort(byNativeAmount);
}
