import { TOKEN_PREFERRED_POSITIONS } from '@/features/positions/stores/transform/filter';
import type { CanonicalProtocolStats, ListPositionsResponse, PortfolioItem, Position } from '../../types/generated/positions/positions';

/**
 * Check if a portfolio item should be filtered based on its description
 */
function isTokenPreferredItem(item: PortfolioItem): boolean {
  const description = item.detail?.description;
  return Boolean(description && TOKEN_PREFERRED_POSITIONS.includes(description));
}

/**
 * Get all filtered items from a position
 */
export function filteredItemsForPosition(position: Position): PortfolioItem[] {
  return position.portfolioItems?.filter(isTokenPreferredItem) || [];
}

/**
 * Get all filtered items from all positions in a response
 */
export function filteredItemsForPositions(response: ListPositionsResponse): PortfolioItem[] {
  const positions = response.result?.positions ?? [];
  return positions.flatMap(filteredItemsForPosition);
}

/**
 * Get positions for a protocol
 */
export function positionsForProtocol(response: ListPositionsResponse, protocol: string): Position[] {
  return response.result?.positions?.filter(p => p.canonicalProtocolName === protocol) ?? [];
}

/**
 * Get positions that have filtered items along with their filtered items
 */
export function positionsWithFilteredItems(response: ListPositionsResponse): Array<{ protocol: string; filteredItems: PortfolioItem[] }> {
  const positions = response.result?.positions ?? [];

  return positions
    .map((p: Position) => ({
      protocol: p.canonicalProtocolName,
      filteredItems: filteredItemsForPosition(p),
    }))
    .filter((p: { protocol: string; filteredItems: PortfolioItem[] }) => p.filteredItems.length > 0);
}

/**
 * Get positions that have NO filtered items
 */
export function positionsWithoutFilteredItems(response: ListPositionsResponse): Position[] {
  const positions = response.result?.positions ?? [];
  return positions.filter((p: Position) => filteredItemsForPosition(p).length === 0);
}

/**
 * Get protocol total for a protocol from the stats
 */
export function statsForProtocol(response: ListPositionsResponse, protocol: string): CanonicalProtocolStats | undefined {
  return response.result?.stats?.canonicalProtocol?.[protocol];
}

/**
 * Get backend grand total from the stats
 */
export function grandTotal(response: ListPositionsResponse): number {
  return parseFloat(response.result?.stats?.totals?.overallTotal || '0');
}
