import { RainbowError } from '@/logger';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';
import { usePolymarketProxyAddress } from '@/features/polymarket/stores/derived/usePolymarketProxyAddress';
import { rainbowFetch } from '@/rainbow-fetch';
import { PolymarketPosition } from '@/features/polymarket/types';

type PolymarketPositionsStoreActions = {
  getPositions: () => PolymarketPosition[] | undefined;
};

type PolymarketPositionsParams = {
  address: string | null;
};

type FetchPolymarketPositionsResponse = {
  positions: PolymarketPosition[];
};

export const usePolymarketPositionsStore = createQueryStore<
  FetchPolymarketPositionsResponse,
  PolymarketPositionsParams,
  PolymarketPositionsStoreActions
>(
  {
    fetcher: fetchPolymarketPositions,
    params: { address: $ => $(usePolymarketProxyAddress).proxyAddress },
  },

  (_, get) => ({
    getPositions: () => get().getData()?.positions,
  })
);

async function fetchPolymarketPositions(
  { address }: PolymarketPositionsParams,
  abortController: AbortController | null
): Promise<FetchPolymarketPositionsResponse> {
  if (!address) throw new RainbowError('[PolymarketPositionsStore] Address is required');

  const url = new URL('https://data-api.polymarket.com/positions');
  url.searchParams.set('sortBy', 'CURRENT');
  url.searchParams.set('sortDirection', 'DESC');
  url.searchParams.set('user', address);

  const response = await rainbowFetch(url.toString(), {
    abortController,
    timeout: 30000,
  });

  const positions = response.data as PolymarketPosition[];

  return {
    positions,
  };
}
