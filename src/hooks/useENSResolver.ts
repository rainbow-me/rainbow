import { useQuery } from 'react-query';
import { fetchResolver } from '@rainbow-me/handlers/ens';
import { getENSData, saveENSData } from '@rainbow-me/handlers/localstorage/ens';
import { queryClient } from '@rainbow-me/react-query/queryClient';
import { QueryConfig, UseQueryData } from '@rainbow-me/react-query/types';
import { ensPublicResolverAddress } from '@rainbow-me/references';

export const ensResolverQueryKey = (name: string) => ['ens-resolver', name];

const STALE_TIME = 10000;

export async function fetchENSResolver(name: string) {
  const cachedResolver = await getENSData('resolver', name);
  if (cachedResolver) {
    queryClient.setQueryData(ensResolverQueryKey(name), cachedResolver);
  }
  const resolver = await fetchResolver(name);
  const data = {
    address: resolver?.address,
    type: resolver?.address === ensPublicResolverAddress ? 'default' : 'custom',
  };
  saveENSData('resolver', name, data);
  return data;
}

export async function prefetchENSResolver(name: string) {
  queryClient.prefetchQuery(
    ensResolverQueryKey(name),
    async () => fetchENSResolver(name),
    { staleTime: STALE_TIME }
  );
}

export default function useENSResolver(
  name: string,
  config?: QueryConfig<typeof fetchENSResolver>
) {
  return useQuery<UseQueryData<typeof fetchENSResolver>>(
    ensResolverQueryKey(name),
    async () => fetchENSResolver(name),
    {
      ...config,
      // Data will be stale for 10s to avoid dupe queries
      staleTime: STALE_TIME,
    }
  );
}
