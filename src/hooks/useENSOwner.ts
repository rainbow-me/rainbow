import { useQuery } from '@tanstack/react-query';
import useAccountSettings from './useAccountSettings';
import { fetchOwner } from '@/handlers/ens';
import { getENSData, saveENSData } from '@/handlers/localstorage/ens';
import { queryClient, QueryConfigDeprecated, UseQueryData } from '@/react-query';

export const ensOwnerQueryKey = (name: string) => ['ens-owner', name];

const STALE_TIME = 10000;

export async function fetchENSOwner(name: string) {
  const cachedOwner = await getENSData('owner', name);
  if (cachedOwner) {
    queryClient.setQueryData(ensOwnerQueryKey(name), cachedOwner);
  }
  const owner = await fetchOwner(name);
  saveENSData('owner', name, owner);
  return owner;
}

export async function prefetchENSOwner(name: string) {
  queryClient.prefetchQuery(ensOwnerQueryKey(name), async () => fetchENSOwner(name), { staleTime: STALE_TIME });
}

export default function useENSOwner(name: string, config?: QueryConfigDeprecated<typeof fetchENSOwner>) {
  const { accountAddress } = useAccountSettings();

  const { data, ...query } = useQuery<UseQueryData<typeof fetchENSOwner>>(ensOwnerQueryKey(name), async () => fetchENSOwner(name), {
    ...config,
    // Data will be stale for 10s to avoid dupe queries
    staleTime: STALE_TIME,
  });

  const isOwner = data?.address?.toLowerCase() === accountAddress?.toLowerCase();

  return {
    data,
    isOwner,
    ...query,
  };
}
