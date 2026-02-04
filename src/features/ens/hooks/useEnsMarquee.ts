import { useQuery } from '@tanstack/react-query';

import { createQueryKey, queryClient, QueryConfig, QueryFunctionResult } from '@/react-query';

import { metadataClient } from '@/graphql';

import { ensIntroMarqueeNames } from '@/references';

export const ensAvatarUrl = (ensName: string) => `https://metadata.ens.domains/mainnet/avatar/${ensName}?v=1.0`;

export const getEnsMarqueeFallback = (): EnsMarqueeResult => {
  const accounts = ensIntroMarqueeNames.map(name => ({
    name,
    avatar: ensAvatarUrl(name),
    address: '',
  }));

  return {
    ensMarquee: {
      accounts,
    },
  };
};

// Set a default stale time of 20 minutes
const defaultStaleTime = 1_200_000;

// ///////////////////////////////////////////////
// Query Key

// Key used for loading the cache with data from storage
export const ENS_MARQUEE_QUERY_KEY = 'ensMarquee';

export const ensMarqueeQueryKey = () => createQueryKey(ENS_MARQUEE_QUERY_KEY, {}, { persisterVersion: 1 });

type EnsMarqueeQueryKey = ReturnType<typeof ensMarqueeQueryKey>;

// ///////////////////////////////////////////////
// Query Function

async function ensMarqueeQueryFunction() {
  const data = await metadataClient.getEnsMarquee();
  return data;
}

type EnsMarqueeResult = QueryFunctionResult<typeof ensMarqueeQueryFunction>;

// ///////////////////////////////////////////////
// Query Prefetcher (Optional)

export async function prefetchEnsMarquee(config: QueryConfig<EnsMarqueeResult, Error, EnsMarqueeQueryKey> = {}) {
  return await queryClient.prefetchQuery(ensMarqueeQueryKey(), ensMarqueeQueryFunction, config);
}

// ///////////////////////////////////////////////
// Query Fetcher (Optional)

export async function fetchEnsMarquee(config: QueryConfig<EnsMarqueeResult, Error, EnsMarqueeQueryKey> = {}) {
  return await queryClient.fetchQuery(ensMarqueeQueryKey(), ensMarqueeQueryFunction, config);
}

// ///////////////////////////////////////////////
// Query Hook

export function useEnsMarquee(
  config = {
    staleTime: defaultStaleTime,
    cacheTime: Infinity,
    initialData: getEnsMarqueeFallback,
  }
) {
  return useQuery(ensMarqueeQueryKey(), ensMarqueeQueryFunction, config);
}
