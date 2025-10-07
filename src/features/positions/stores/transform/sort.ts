import type { RainbowPosition, ProtocolGroup } from '../../types';

// ============ Sort Functions ================================================= //

/**
 * Sort function for items with totalValue (descending)
 */
const byTotalValue = (a: { totalValue: string }, b: { totalValue: string }) => {
  const aValue = parseFloat(a.totalValue || '0');
  const bValue = parseFloat(b.totalValue || '0');
  return bValue - aValue;
};

// ============ Sorting ======================================================== //

/**
 * Sort positions by total value (highest first)
 */
function sortPositionsByValue(positions: ProtocolGroup): RainbowPosition[] {
  return Object.values(positions).sort((a, b) => {
    const aValue = parseFloat(a.totals?.total?.amount || '0');
    const bValue = parseFloat(b.totals?.total?.amount || '0');
    return bValue - aValue; // Descending order
  });
}

/**
 * Sort items within a position by value
 */
function sortPositionItems(position: RainbowPosition): void {
  position.deposits.sort(byTotalValue);
  position.pools.sort(byTotalValue);
  position.stakes.sort(byTotalValue);
  position.borrows.sort(byTotalValue);
  position.rewards.sort(byTotalValue);
}

/**
 * Sort positions and their items by value
 */
export function sortPositions(positions: ProtocolGroup): RainbowPosition[] {
  // Step 1: Sort positions by total value
  const sorted = sortPositionsByValue(positions);

  // Step 2: Sort items within each position
  sorted.forEach(position => {
    sortPositionItems(position);
  });

  return sorted;
}
