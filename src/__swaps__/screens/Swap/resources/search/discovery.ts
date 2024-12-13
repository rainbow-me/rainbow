import { ChainId } from '@/state/backendNetworks/types';
import { SearchAsset } from '@/__swaps__/types/search';
import { RainbowError, logger } from '@/logger';
import { RainbowFetchClient } from '@/rainbow-fetch';
import { QueryFunctionArgs, createQueryKey } from '@/react-query';
import { useQuery } from '@tanstack/react-query';
import { parseTokenSearch } from './utils';

const tokenSearchHttp = new RainbowFetchClient({
  baseURL: 'https://token-search.rainbow.me/v3/trending/swaps',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export type TokenDiscoveryArgs = {
  chainId: ChainId;
};

const tokenDiscoveryQueryKey = ({ chainId }: TokenDiscoveryArgs) => createQueryKey('TokenDiscovery', { chainId }, { persisterVersion: 1 });

async function tokenSearchQueryFunction({ queryKey: [{ chainId }] }: QueryFunctionArgs<typeof tokenDiscoveryQueryKey>) {
  const url = `/${chainId}`;

  try {
    const tokenSearch = await tokenSearchHttp.get<{ data: SearchAsset[] }>(url);
    return parseTokenSearch(tokenSearch.data.data, chainId);
  } catch (e) {
    logger.error(new RainbowError('[tokenSearchQueryFunction]: Token discovery failed'), { url });
    return [];
  }
}

export function useTokenDiscovery({ chainId }: TokenDiscoveryArgs) {
  return useQuery(tokenDiscoveryQueryKey({ chainId }), tokenSearchQueryFunction, {
    staleTime: 15 * 60 * 1000, // 15 min
    cacheTime: 24 * 60 * 60 * 1000, // 1 day
  });
}
