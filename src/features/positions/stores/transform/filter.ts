import type { ProtocolGroup, RainbowPosition } from '../../types';
import { getExperimentalFlag, DEFI_POSITIONS_THRESHOLD_FILTER } from '@/config';

// ============ Constants ====================================================== //

const MIN_POSITION_VALUE_USD = 1;
const IGNORED_PROTOCOLS = ['hyperliquid'];

// ============ Filters ======================================================== //

/**
 * Check if position value meets threshold
 * @param position - The position to check
 * @param threshold - The minimum value threshold
 */
function meetsValueThreshold(position: RainbowPosition, threshold: number = MIN_POSITION_VALUE_USD): boolean {
  const netValue = parseFloat(position.totals?.total?.amount || '0');
  return netValue >= threshold;
}

/**
 * Check if protocol is allowed
 * @param position - The position to check
 */
function isProtocolAllowed(position: RainbowPosition): boolean {
  const protocolName = position.type.toLowerCase();
  return !IGNORED_PROTOCOLS.includes(protocolName);
}

/**
 * Check if position has items
 */
function hasItems(position: RainbowPosition): boolean {
  return (
    position.deposits.length > 0 ||
    position.pools.length > 0 ||
    position.stakes.length > 0 ||
    position.borrows.length > 0 ||
    position.rewards.length > 0
  );
}

/**
 * Apply all filters to positions in a single loop
 */
export function filterPositions(positions: ProtocolGroup): ProtocolGroup {
  const shouldApplyThresholdFilter = getExperimentalFlag(DEFI_POSITIONS_THRESHOLD_FILTER);

  return Object.fromEntries(
    Object.entries(positions).filter(([, position]) => {
      // Apply value threshold filter only if feature flag is enabled
      if (shouldApplyThresholdFilter && !meetsValueThreshold(position)) {
        return false;
      }

      // Filter out specific protocols
      if (!isProtocolAllowed(position)) {
        return false;
      }

      // Filter out positions with no items
      if (!hasItems(position)) {
        return false;
      }

      return true;
    })
  );
}
