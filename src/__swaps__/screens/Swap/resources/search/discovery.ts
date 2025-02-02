import { RainbowError, logger } from '@/logger';
import { RainbowFetchClient } from '@/rainbow-fetch';
import { ChainId } from '@/state/backendNetworks/types';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { SearchAsset } from '@/__swaps__/types/search';
import { time } from '@/utils';
import { parseTokenSearch } from './utils';

const tokenSearchHttp = new RainbowFetchClient({
  baseURL: 'https://token-search.rainbow.me/v3/trending/swaps',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export type PopularTokensParams = {
  chainId: ChainId;
};

async function popularTokensQueryFunction({ chainId }: PopularTokensParams) {
  const url = `/${chainId}`;

  try {
    const tokenSearch = await tokenSearchHttp.get<{ data: SearchAsset[] }>(url);
    return parseTokenSearch(tokenSearch.data.data, chainId);
  } catch (e) {
    logger.error(new RainbowError('[popularTokensQueryFunction]: Popular tokens failed'), { url });
    return [];
  }
}

export const usePopularTokensStore = createQueryStore<SearchAsset[], PopularTokensParams>(
  {
    fetcher: ({ chainId }) => popularTokensQueryFunction({ chainId }),
    cacheTime: time.days(1),
    params: { chainId: $ => $(useSwapsStore).selectedOutputChainId },
    staleTime: time.minutes(15),
  },

  { storageKey: 'popularInRainbow' }
);
