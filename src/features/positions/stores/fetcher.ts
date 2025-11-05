import type { Address } from 'viem';
import { time } from '@/utils/time';
import { logger, RainbowError } from '@/logger';
import { getPlatformClient } from '@/resources/platform/client';
import type { NativeCurrencyKey } from '@/entities';
import type { ListPositionsResponse } from '../types/generated/positions/positions';

// ============ Constants ====================================================== //

const POSITIONS_ENDPOINT = '/positions/ListPositions';
const DEFAULT_TIMEOUT = time.seconds(30);

// ============ Types ========================================================== //

/**
 * Parameters for positions store
 */
export type PositionsParams = {
  address: Address | string | null;
  currency: NativeCurrencyKey;
  chainIds: number[];
};

// ============ Fetcher ======================================================== //

/**
 * Fetches positions data from the platform API
 */
export async function fetchPositions(params: PositionsParams, abortController: AbortController | null): Promise<ListPositionsResponse> {
  const { address, currency, chainIds } = params;

  if (!address) {
    throw new Error('No address provided');
  }

  try {
    const response = await getPlatformClient().get<ListPositionsResponse>(POSITIONS_ENDPOINT, {
      abortController,
      timeout: DEFAULT_TIMEOUT,
      params: {
        address: address.toLowerCase(),
        currency: currency.toLowerCase(),
        chainIds: chainIds.join(','),
      },
    });

    if (!response.data) {
      throw new Error('Invalid response structure');
    }

    if (response.data.errors && response.data.errors.length > 0) {
      logger.warn('[Positions] Partial errors in response', {
        request: response.data.metadata,
        errors: response.data.errors,
      });
    }

    return response.data;
  } catch (error) {
    logger.error(new RainbowError('[Positions] Failed to fetch positions', error), {
      currency,
      chainIds,
    });

    throw error;
  }
}
