import { useQuery } from '@tanstack/react-query';
import { fetchResolver } from '@/handlers/ens';
import { getENSData, saveENSData } from '@/handlers/localstorage/ens';
import { queryClient, QueryConfigDeprecated, UseQueryData } from '@/react-query';
import { ensPublicResolverAddress } from '@/references';

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
  queryClient.prefetchQuery(ensResolverQueryKey(name), async () => fetchENSResolver(name), { staleTime: STALE_TIME });
}

export default function useENSResolver(name: string, config?: QueryConfigDeprecated<typeof fetchENSResolver>) {
  return useQuery<UseQueryData<typeof fetchENSResolver>>(ensResolverQueryKey(name), async () => fetchENSResolver(name), {
    ...config,
    // Data will be stale for 10s to avoid dupe queries
    staleTime: STALE_TIME,
  });
}
