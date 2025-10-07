import qs from 'qs';
import { getPlatformClient } from '@/resources/platform/client';
import { logger } from '@/logger';
import type { NativeCurrencyKey } from '@/entities';
import type { ListPositionsResponse } from '../types';
import type { Address } from 'viem';

const POSITIONS_ENDPOINT = '/positions/ListPositions';

export const CACHE_TIME = 1000 * 60 * 5; // 5 minutes
export const STALE_TIME = 1000 * 60 * 1; // 1 minute
export const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Parameters for positions store - chainIds is optional
 */
export type PositionsParams = {
  address: Address | string | null;
  currency: NativeCurrencyKey;
  chainIds?: number[];
};

/**
 * Fetches positions data from the platform API
 */
export async function fetchPositions(params: PositionsParams, abortController: AbortController | null): Promise<ListPositionsResponse> {
  const { address, currency, chainIds = [] } = params;

  if (!address) {
    logger.debug('[Positions] No address provided');
    throw new Error('Address is required');
  }

  const requestUrl = buildPositionsRequest(address, chainIds, currency);

  try {
    const response = await getPlatformClient().get<ListPositionsResponse>(requestUrl, {
      abortController,
      timeout: DEFAULT_TIMEOUT,
    });

    if (!response.data) {
      logger.warn('[Positions] Invalid response structure', { address });
      throw new Error('Invalid response structure');
    }

    // Log any partial errors
    if (response.data.errors?.length > 0) {
      logger.warn('[Positions] Partial errors in response', {
        errors: response.data.errors,
        address,
      });
    }

    logger.debug('[Positions] Successfully fetched positions', {
      address,
      positionsCount: response.data.result?.positions?.length ?? 0,
    });

    return response.data;
  } catch (error) {
    logger.error(new Error('[Positions] Failed to fetch positions'), {
      error,
      address,
      chainIds,
    });

    // Check if it's an abort
    if (error instanceof Error && error.name === 'AbortError') {
      logger.debug('[Positions] Request aborted', { address });
    }

    // Network errors
    if (error instanceof Error && (error.message.includes('ECONNABORTED') || error.message.includes('ETIMEDOUT'))) {
      logger.warn('[Positions] Network timeout', { address });
    }

    throw error;
  }
}

/**
 * Helper function to build the positions request URL
 */
function buildPositionsRequest(address: string, chainIds: number[], currency: string): string {
  // API expects lowercase currency and address without chain_ids
  const params = {
    address: address.toLowerCase(),
    currency: currency.toLowerCase(),
  };

  return `${POSITIONS_ENDPOINT}?${qs.stringify(params)}`;
}
