import type { ListPositionsResponse, PortfolioItem, Position } from '../types/generated/positions/positions';

/**
 * List of token descriptions that represent wallet-preferred positions
 * (Liquid Staking Derivatives that should be filtered from positions)
 */
export const TOKEN_PREFERRED_POSITIONS = ['wstETH', 'sAVAX', 'ezETH', 'swETH', 'rETH', 'stETH'] as const;

/**
 * Check if a portfolio item should be filtered based on its description
 */
export function isTokenPreferredItem(item: PortfolioItem): boolean {
  const description = item.detail?.description;
  return Boolean(description && (TOKEN_PREFERRED_POSITIONS as readonly string[]).includes(description));
}

/**
 * Get all filtered items from a position
 */
export function getFilteredItemsFromPosition(position: Position): PortfolioItem[] {
  return position.portfolioItems?.filter(isTokenPreferredItem) || [];
}

/**
 * Get all filtered items from all positions in a response
 */
export function getAllFilteredItems(response: ListPositionsResponse): PortfolioItem[] {
  const positions = response.result?.positions ?? [];
  return positions.flatMap(getFilteredItemsFromPosition);
}

/**
 * Calculate total filtered value from portfolio items
 */
export function calculateFilteredValue(items: PortfolioItem[]): number {
  return items.reduce((sum, item) => sum + parseFloat(item.stats?.netValue || '0'), 0);
}

/**
 * Get backend total for a protocol from the stats
 */
export function getBackendProtocolTotal(response: ListPositionsResponse, protocol: string): number {
  return parseFloat(response.result?.stats?.canonicalProtocol?.[protocol]?.totals?.netTotal || '0');
}

/**
 * Get backend grand total from the stats
 */
export function getBackendGrandTotal(response: ListPositionsResponse): number {
  return parseFloat(response.result?.stats?.totals?.netTotal || '0');
}

/**
 * Get positions that have filtered items along with their filtered items
 */
export function getPositionsWithFilteredItems(
  response: ListPositionsResponse
): Array<{ protocol: string; filteredItems: PortfolioItem[] }> {
  const positions = response.result?.positions ?? [];

  return positions
    .map((p: Position) => ({
      protocol: p.canonicalProtocolName,
      filteredItems: getFilteredItemsFromPosition(p),
    }))
    .filter((p: { protocol: string; filteredItems: PortfolioItem[] }) => p.filteredItems.length > 0);
}

/**
 * Get positions that have NO filtered items
 */
export function getPositionsWithoutFilteredItems(response: ListPositionsResponse): Position[] {
  const positions = response.result?.positions ?? [];
  return positions.filter((p: Position) => getFilteredItemsFromPosition(p).length === 0);
}
