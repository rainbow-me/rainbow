import { logger } from '@/logger';
import type { ListPositionsResponse, RainbowPositions } from '../types';
import type { PositionsParams } from './fetcher';
import { EMPTY_POSITIONS } from '../constants';
import { parseDefiPositions } from '../parsers';

/**
 * Transform function for positions data
 * Takes raw API response and params, returns parsed positions
 */
export function transformPositions(response: ListPositionsResponse, params: PositionsParams): RainbowPositions {
  try {
    const { currency } = params;

    // Use the existing parser from parsers/index.ts
    const positions = parseDefiPositions(response, currency);

    logger.debug('[Positions Transform] Successfully transformed positions', {
      protocolCount: Object.keys(positions.positions).length,
      totalValue: positions.totals.totals.display,
      currency,
    });

    return positions;
  } catch (error) {
    logger.error(new Error('[Positions Transform] Failed to transform positions'), { error });
    return EMPTY_POSITIONS;
  }
}
