import { useQuery } from 'react-query';
import { fetchImage } from '@rainbow-me/handlers/ens';
import { getENSData, saveENSData } from '@rainbow-me/handlers/localstorage/ens';
import { queryClient } from '@rainbow-me/react-query/queryClient';
import { QueryConfig, UseQueryData } from '@rainbow-me/react-query/types';

export const ensCoverQueryKey = (name: string) => ['ens-cover', name];

const STALE_TIME = 10000;

export async function fetchENSCover(
  name: string,
  { cacheFirst }: { cacheFirst?: boolean } = {}
) {
  const cachedCover = await getENSData('cover', name);
  if (cachedCover) {
    queryClient.setQueryData(ensCoverQueryKey(name), cachedCover);
    if (cacheFirst) return cachedCover as { imageUrl?: string | null };
  }
  const cover = await fetchImage('cover', name);
  saveENSData('cover', name, cover);
  return cover;
}

export async function prefetchENSCover(
  name: string,
  { cacheFirst }: { cacheFirst?: boolean } = {}
) {
  queryClient.prefetchQuery(
    ensCoverQueryKey(name),
    async () => fetchENSCover(name, { cacheFirst }),
    { staleTime: STALE_TIME }
  );
}

export default function useENSCover(
  name: string,
  config?: QueryConfig<typeof fetchENSCover>
) {
  return useQuery<UseQueryData<typeof fetchENSCover>>(
    ensCoverQueryKey(name),
    async () => fetchENSCover(name),
    {
      ...config,
      // Data will be stale for 10s to avoid dupe queries
      staleTime: STALE_TIME,
    }
  );
}
