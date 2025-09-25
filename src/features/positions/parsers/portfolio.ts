import type { ListPositionsResponse, RainbowPositions, RainbowPosition } from '../types';
import { EMPTY_POSITIONS } from '../constants';
import { validatePosition, validatePortfolioItem } from './response';
import { groupByCanonicalProtocol } from './protocol';
import { processPortfolioItem } from './categories';
import { updatePositionTotals, calculateGrandTotals, createNativeDisplay } from './totals';
import { filterByValueThreshold, filterProtocols, validatePositionData } from './filters';
import { sortPositionsByValue } from './sorting';
import { logger } from '@/logger';

/**
 * Main processing pipeline for positions
 */
export function processPositions(result: ListPositionsResponse['result'], currency: string): RainbowPositions {
  if (!result) {
    return EMPTY_POSITIONS;
  }

  try {
    // Step 1: Group by canonical protocol
    const grouped = groupByCanonicalProtocol(result.positions);

    // Step 2: Process portfolio items for each position
    result.positions.forEach(position => {
      if (!validatePosition(position)) {
        logger.warn('[Portfolio] Skipping invalid position', {
          id: position.id,
        });
        return;
      }

      const canonicalName = position.canonicalProtocolName;
      const rainbowPosition = grouped[canonicalName];

      if (!rainbowPosition) {
        logger.warn('[Portfolio] Missing grouped position', {
          canonical: canonicalName,
        });
        return;
      }

      // Process each portfolio item
      position.portfolioItems.forEach(item => {
        if (!validatePortfolioItem(item)) {
          logger.warn('[Portfolio] Skipping invalid portfolio item');
          return;
        }

        processPortfolioItem(item, rainbowPosition, position, currency);

        // Update totals from stats
        if (item.stats) {
          updatePositionTotals(rainbowPosition.totals, item.stats, currency);
        }
      });
    });

    // Step 3: Calculate position totals if not already set from stats
    Object.values(grouped).forEach(position => {
      // If we have stats-based totals, keep them. Otherwise calculate from categories
      const hasTotalsFromStats = position.totals.totals && position.totals.totals.amount && position.totals.totals.amount !== '0';

      if (!hasTotalsFromStats) {
        calculatePositionTotalsFromCategories(position, currency);
      }
    });

    // Step 4: Apply filters
    let filtered = filterByValueThreshold(grouped);
    filtered = filterProtocols(filtered);

    // Validate position data
    Object.keys(filtered).forEach(key => {
      if (!validatePositionData(filtered[key])) {
        delete filtered[key];
      }
    });

    // Step 5: Sort positions
    const sorted = sortPositionsByValue(filtered);

    // Step 6: Build final response
    const finalPositions = buildFinalResponse(sorted, result.uniqueTokens || [], currency);

    logger.debug('[Portfolio] Processing complete', {
      inputPositions: result.positions.length,
      outputProtocols: Object.keys(finalPositions.positions).length,
      totalValue: finalPositions.totals.totals.display,
    });

    return finalPositions;
  } catch (error) {
    logger.error(new Error('[Portfolio] Processing failed'), { error });
    return EMPTY_POSITIONS;
  }
}

/**
 * Calculate position totals from category data
 */
function calculatePositionTotalsFromCategories(position: RainbowPosition, currency: string): void {
  let deposits = '0';
  let stakes = '0';
  let borrows = '0';
  let rewards = '0';
  let pools = '0';

  // Sum up deposits
  position.deposits.forEach(deposit => {
    deposits = (parseFloat(deposits) + parseFloat(deposit.totalValue || '0')).toString();
  });

  // Sum up pools
  position.pools.forEach(pool => {
    pools = (parseFloat(pools) + parseFloat(pool.totalValue || '0')).toString();
  });

  // Sum up stakes
  position.stakes.forEach(stake => {
    stakes = (parseFloat(stakes) + parseFloat(stake.totalValue || '0')).toString();
  });

  // Sum up borrows
  position.borrows.forEach(borrow => {
    borrows = (parseFloat(borrows) + parseFloat(borrow.totalValue || '0')).toString();
  });

  // Sum up rewards
  position.rewards.forEach(reward => {
    rewards = (parseFloat(rewards) + parseFloat(reward.native.amount || '0')).toString();
  });

  // Calculate category totals
  const totalDepositsValue = (parseFloat(deposits) + parseFloat(pools) + parseFloat(stakes)).toString();
  const totalBorrowsValue = borrows;
  const totalRewardsValue = rewards;

  // Update position totals
  position.totals.totalDeposits = createNativeDisplay(totalDepositsValue, currency);
  position.totals.totalBorrows = createNativeDisplay(totalBorrowsValue, currency);
  position.totals.totalRewards = createNativeDisplay(totalRewardsValue, currency);
  position.totals.totalLocked = '0';

  // Calculate net total: Total Deposits + Rewards - Borrows
  const assets = parseFloat(totalDepositsValue) + parseFloat(totalRewardsValue);
  const netValue = (assets - parseFloat(totalBorrowsValue)).toString();

  position.totals.totals = createNativeDisplay(netValue, currency);
}

/**
 * Build final response structure
 */
function buildFinalResponse(sortedPositions: RainbowPosition[], uniqueTokens: string[], currency: string): RainbowPositions {
  // Convert back to Record keyed by canonical name
  const positionsRecord = Object.fromEntries(sortedPositions.map(position => [position.type, position]));

  // Calculate grand totals
  const grandTotals = calculateGrandTotals(sortedPositions, currency);

  return {
    positions: positionsRecord,
    // NOTE: uniqueTokens is not implemented by the backend API yet
    // Using empty array as default until API provides this field
    positionTokens: uniqueTokens || [],
    totals: grandTotals,
  };
}
