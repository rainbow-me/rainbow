import type { RainbowPosition } from '../../types';

// ============ Sort Functions ================================================= //

/**
 * Sort function for items with value (descending)
 */
const byValue = (a: { value: { amount: string } }, b: { value: { amount: string } }) => {
  const aValue = parseFloat(a.value.amount || '0');
  const bValue = parseFloat(b.value.amount || '0');
  return bValue - aValue;
};

// ============ Sorting ======================================================== //

/**
 * Sort items within a position by value
 */
function sortPositionItems(position: RainbowPosition): void {
  position.deposits.sort(byValue);
  position.pools.sort(byValue);
  position.stakes.sort(byValue);
  position.borrows.sort(byValue);
  position.rewards.sort(byValue);
}

/**
 * Sort positions and their items by value
 */
export function sortPositions(positions: Record<string, RainbowPosition>): Record<string, RainbowPosition> {
  const sorted = Object.values(positions).sort((a, b) => {
    const aValue = parseFloat(a.totals?.total?.amount || '0');
    const bValue = parseFloat(b.totals?.total?.amount || '0');
    return bValue - aValue;
  });

  // Sort items within each position
  sorted.forEach(position => {
    sortPositionItems(position);
  });

  return Object.fromEntries(sorted.map(p => [p.type, p]));
}
