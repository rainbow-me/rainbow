import type { ListPositionsResponse, RainbowPositions } from '../types';
import { EMPTY_POSITIONS } from '../constants';
import { validatePositionResponse as validateResponse } from './response';
import { processPositions } from './portfolio';
import { logger } from '@/logger';

/**
 * Main parsing pipeline for positions
 */
export function parseDefiPositions(response: ListPositionsResponse, currency: string): RainbowPositions {
  try {
    // Step 1: Validate response structure
    if (!validateResponse(response)) {
      logger.warn('[Positions Parser] Invalid response structure');
      return EMPTY_POSITIONS;
    }

    // Step 2: Check for positions data
    if (!response.result?.positions || response.result.positions.length === 0) {
      logger.debug('[Positions Parser] No positions found');
      return {
        ...EMPTY_POSITIONS,
        positionTokens: response.result?.uniqueTokens || [],
      };
    }

    // Step 3: Process positions through pipeline
    const positions = processPositions(response.result, currency);

    logger.debug('[Positions Parser] Successfully parsed positions', {
      protocolCount: Object.keys(positions.positions).length,
      totalValue: positions.totals.totals.display,
      currency,
    });

    return positions;
  } catch (error) {
    logger.error(new Error('[Positions Parser] Failed to parse positions'), { error });
    return EMPTY_POSITIONS;
  }
}
