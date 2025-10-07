import type { ProtocolGroup, RainbowPosition } from '../../types';
import { getExperimentalFlag, DEFI_POSITIONS_THRESHOLD_FILTER } from '@/config';

// ============ Constants ====================================================== //

const MIN_POSITION_VALUE_USD = 1;
const HYPERLIQUID_PROTOCOL = 'hyperliquid';

// ============ Filters ======================================================== //

/**
 * Filter positions by minimum value threshold
 */
function filterByValueThreshold(positions: ProtocolGroup, threshold: number = MIN_POSITION_VALUE_USD): ProtocolGroup {
  return Object.fromEntries(
    Object.entries(positions).filter(([, position]) => {
      const netValue = parseFloat(position.totals?.total?.amount || '0');
      return netValue >= threshold;
    })
  );
}

/**
 * Filter out specific protocols
 */
function filterProtocols(positions: ProtocolGroup): ProtocolGroup {
  return Object.fromEntries(
    Object.entries(positions).filter(([, position]) => {
      const protocolName = position.type.toLowerCase();
      return !protocolName.includes(HYPERLIQUID_PROTOCOL);
    })
  );
}

/**
 * Filter out positions with no items
 */
function filterEmptyPositions(positions: ProtocolGroup): ProtocolGroup {
  const hasItems = (position: RainbowPosition) =>
    position.deposits.length > 0 ||
    position.pools.length > 0 ||
    position.stakes.length > 0 ||
    position.borrows.length > 0 ||
    position.rewards.length > 0;

  return Object.fromEntries(Object.entries(positions).filter(([, position]) => hasItems(position)));
}

/**
 * Apply all filters to positions
 */
export function filterPositions(positions: ProtocolGroup): ProtocolGroup {
  let filtered = positions;

  // Apply $1 filter only if feature flag is enabled
  if (getExperimentalFlag(DEFI_POSITIONS_THRESHOLD_FILTER)) {
    filtered = filterByValueThreshold(filtered);
  }

  filtered = filterProtocols(filtered);
  filtered = filterEmptyPositions(filtered);
  return filtered;
}
