import { getPlatformClient } from '@/resources/platform/client';
import { logger } from '@/logger';
import type { NativeCurrencyKey } from '@/entities';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import type { ListPositionsResponse } from '../types';
import type { Address } from 'viem';

// ============ Constants ====================================================== //

const POSITIONS_ENDPOINT = '/positions/ListPositions';

export const CACHE_TIME = 1000 * 60 * 5; // 5 minutes
export const STALE_TIME = 1000 * 60 * 1; // 1 minute
export const DEFAULT_TIMEOUT = 1000 * 30; // 30 seconds

// ============ Types ========================================================== //

/**
 * Parameters for positions store - chainIds is optional
 */
export type PositionsParams = {
  address: Address | string | null;
  backendNetworksKey: number;
  currency: NativeCurrencyKey;
};

// ============ Fetcher ======================================================== //

/**
 * Fetches positions data from the platform API
 */
export async function fetchPositions(params: PositionsParams, abortController: AbortController | null): Promise<ListPositionsResponse> {
  const { address, currency } = params;

  if (!address) {
    logger.debug('[Positions] No address provided');
    throw new Error('Address is required');
  }

  const chainIds = useBackendNetworksStore.getState().getSupportedPositionsChainIds();

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
      logger.warn('[Positions] Invalid response structure', { address });
      throw new Error('Invalid response structure');
    }

    // Log any partial errors
    if (response.data.errors?.length > 0) {
      logger.debug('[Positions] Partial errors in response', {
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

    throw error;
  }
}
