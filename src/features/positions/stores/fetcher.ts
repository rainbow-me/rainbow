import type { Address } from 'viem';

import type { NativeCurrencyKey } from '@/features/currency/types';
import { getPlatformClient } from '@/resources/platform/client';

import type { ListPositionsResponse } from '../types/generated/positions/positions';

// ============ Constants ====================================================== //

const POSITIONS_ENDPOINT = '/positions/ListPositions';

// ============ Types ========================================================== //

export type PositionsParams = {
  address: Address | string | null;
  currency: NativeCurrencyKey;
  chainIds: number[];
};

// ============ Fetcher ======================================================== //

/**
 * Fetches account positions. Returns null without requesting when the address is absent.
 */
export async function fetchPositions(
  { address, currency, chainIds }: PositionsParams,
  abortController: AbortController | null
): Promise<ListPositionsResponse | null> {
  if (!address) return null;

  const response = await getPlatformClient().get<ListPositionsResponse>(POSITIONS_ENDPOINT, {
    abortController,
    params: {
      address: address.toLowerCase(),
      currency: currency.toLowerCase(),
      chainIds: chainIds.join(','),
    },
  });

  return response.data;
}
