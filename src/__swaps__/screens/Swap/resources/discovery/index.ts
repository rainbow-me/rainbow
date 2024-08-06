import { ChainId } from '@/__swaps__/types/chains';
import { SearchAsset } from '@/__swaps__/types/search';
import { RainbowError, logger } from '@/logger';
import { RainbowFetchClient } from '@/rainbow-fetch';
import { QueryFunctionArgs, createQueryKey } from '@/react-query';
import { useQuery } from '@tanstack/react-query';

const tokenSearchHttp = new RainbowFetchClient({
  baseURL: 'https://token-search.rainbow.me/v3/discovery',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export type TokenDiscoveryArgs = {
  chainId?: ChainId;
};

const tokenDiscoveryQueryKey = ({ chainId }: TokenDiscoveryArgs) => createQueryKey('TokenDiscovery', { chainId }, { persisterVersion: 1 });

async function tokenSearchQueryFunction({ queryKey: [{ chainId }] }: QueryFunctionArgs<typeof tokenDiscoveryQueryKey>) {
  const url = `${chainId ? `/${chainId}` : ''}`;

  try {
    const tokenSearch = await tokenSearchHttp.get<{ data: SearchAsset[] }>(url);
    return tokenSearch.data.data;
  } catch (e) {
    logger.error(new RainbowError('Token discovery failed'), { url });
    return [];
  }
}

export function useTokenDiscovery({ chainId }: TokenDiscoveryArgs) {
  return useQuery(tokenDiscoveryQueryKey({ chainId }), tokenSearchQueryFunction, {
    keepPreviousData: true,
  });
}
