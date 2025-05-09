import { TOKEN_SEARCH_URL } from 'react-native-dotenv';
import { RainbowFetchClient } from '@/rainbow-fetch';
import { ChainId } from '@/state/backendNetworks/types';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { SearchAsset } from '@/__swaps__/types/search';
import { time } from '@/utils';
import { parseTokenSearchResults } from './utils';

let tokenSearchHttp: RainbowFetchClient | undefined;

const getTokenSearchHttp = (): RainbowFetchClient => {
  const clientUrl = tokenSearchHttp?.baseURL;
  const baseUrl = TOKEN_SEARCH_URL;
  if (!tokenSearchHttp || clientUrl !== baseUrl) {
    tokenSearchHttp = new RainbowFetchClient({
      baseURL: baseUrl,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: time.seconds(30),
    });
  }
  return tokenSearchHttp;
};

export type PopularTokensParams = {
  chainId: ChainId;
};

async function popularTokensQueryFunction({ chainId }: PopularTokensParams, abortController: AbortController | null) {
  const url = `/v3/trending/swaps/${chainId}`;
  const tokenSearch = await getTokenSearchHttp().get<{ data: SearchAsset[] }>(url, { abortController });
  return parseTokenSearchResults(tokenSearch.data.data, chainId);
}

export const usePopularTokensStore = createQueryStore<SearchAsset[], PopularTokensParams>(
  {
    fetcher: popularTokensQueryFunction,
    cacheTime: time.days(1),
    keepPreviousData: true,
    params: { chainId: $ => $(useSwapsStore).selectedOutputChainId },
    staleTime: time.minutes(15),
  },

  { storageKey: 'popularInRainbow' }
);
