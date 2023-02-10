import { useQuery } from '@tanstack/react-query';

import {
  createQueryKey,
  queryClient,
  QueryConfig,
  QueryFunctionArgs,
  QueryFunctionResult,
} from '@/react-query';
import { getUniqueTokens } from '@/handlers/simplehash';

const DEFAULT_STALE_TIME = 10000;

// ///////////////////////////////////////////////
// Query Types

export type UniqueTokensArgs = {
  address: string | undefined;
};

// ///////////////////////////////////////////////
// Query Key

const uniqueTokensQueryKey = ({ address }: UniqueTokensArgs) =>
  createQueryKey('uniqueTokens', { address }, { persisterVersion: 1 });

type UniqueTokensQueryKey = ReturnType<typeof uniqueTokensQueryKey>;

// ///////////////////////////////////////////////
// Query Function

async function uniqueTokensQueryFunction({
  queryKey: [{ address }],
}: QueryFunctionArgs<typeof uniqueTokensQueryKey>) {
  try {
    const cachedAvatar = await getENSData('avatar', name);
    if (cachedAvatar) {
      queryClient.setQueryData(ensAvatarQueryKey(name), cachedAvatar);
      if (cacheFirst) return cachedAvatar as { imageUrl: string };
    }
    const avatar = await fetchImage('avatar', name);
    saveENSData('avatar', name, avatar);
    return avatar;
  } catch (err) {
    if (swallowError) return undefined;
    throw err;
  }
  const data = await getUniqueTokens(address);
  return data;
}

type UniqueTokensResult = QueryFunctionResult<typeof uniqueTokensQueryFunction>;

// ///////////////////////////////////////////////
// Query Prefetcher (Optional)

export async function prefetchUniqueTokens(
  { address }: UniqueTokensArgs,
  config: QueryConfig<UniqueTokensResult, Error, UniqueTokensQueryKey> = {}
) {
  return await queryClient.prefetchQuery(
    uniqueTokensQueryKey({ address }),
    uniqueTokensQueryFunction,
    config
  );
}

// ///////////////////////////////////////////////
// Query Fetcher (Optional)

export async function fetchUniqueTokens(
  { address }: UniqueTokensArgs,
  config: QueryConfig<UniqueTokensResult, Error, UniqueTokensQueryKey> = {}
) {
  return await queryClient.fetchQuery(
    uniqueTokensQueryKey({ address }),
    uniqueTokensQueryFunction,
    config
  );
}

// ///////////////////////////////////////////////
// Query Hook

export function useUniqueTokens(
  { address }: UniqueTokensArgs,
  config: QueryConfig<UniqueTokensResult, Error, UniqueTokensQueryKey> = {}
) {
  return useQuery(
    uniqueTokensQueryKey({ address }),
    uniqueTokensQueryFunction,
    { staleTime: DEFAULT_STALE_TIME, enabled: !!address, ...config }
  );
}
