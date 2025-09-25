import type { RainbowPosition, ProtocolGroup } from '../types';
import { MIN_POSITION_VALUE_USD, HYPERLIQUID_PROTOCOL } from '../constants';
import { logger } from '@/logger';

/**
 * Filter positions by minimum value threshold
 */
export function filterByValueThreshold(positions: ProtocolGroup, threshold: number = MIN_POSITION_VALUE_USD): ProtocolGroup {
  const filtered = Object.fromEntries(
    Object.entries(positions).filter(([, position]) => {
      const netValue = parseFloat(position.totals?.totals?.amount || '0');
      const meetsThreshold = netValue >= threshold;

      if (!meetsThreshold) {
        logger.debug('[Filter] Position below threshold', {
          protocol: position.type,
          value: netValue,
          threshold,
        });
      }

      return meetsThreshold;
    })
  );

  logger.debug('[Filter] Filtered by value threshold', {
    before: Object.keys(positions).length,
    after: Object.keys(filtered).length,
    threshold,
  });

  return filtered;
}

/**
 * Filter out specific protocols
 */
export function filterProtocols(positions: ProtocolGroup): ProtocolGroup {
  const filtered = Object.fromEntries(
    Object.entries(positions).filter(([, position]) => {
      const protocolName = position.type.toLowerCase();

      // Filter Hyperliquid perpetuals (not supported in Phase 1)
      if (protocolName.includes(HYPERLIQUID_PROTOCOL)) {
        logger.debug('[Filter] Filtering Hyperliquid protocol', {
          protocol: position.type,
        });
        return false;
      }

      return true;
    })
  );

  logger.debug('[Filter] Filtered protocols', {
    before: Object.keys(positions).length,
    after: Object.keys(filtered).length,
  });

  return filtered;
}

/**
 * Validate position data integrity
 */
export function validatePositionData(position: RainbowPosition): boolean {
  // Must have valid protocol name
  if (!position.type || position.type === 'unknown') {
    logger.debug('[Filter] Invalid position - missing protocol name');
    return false;
  }

  // Must have at least one position item
  const hasItems =
    position.deposits.length > 0 ||
    position.pools.length > 0 ||
    position.stakes.length > 0 ||
    position.borrows.length > 0 ||
    position.rewards.length > 0;

  if (!hasItems) {
    logger.debug('[Filter] Invalid position - no items', {
      protocol: position.type,
    });
    return false;
  }

  return true;
}

/**
 * Apply zero balance filtering to assets
 */
export function filterZeroBalanceAssets<T extends { quantity: string }>(assets: T[]): T[] {
  return assets.filter(asset => {
    const quantity = parseFloat(asset.quantity || '0');
    return quantity > 0;
  });
}
