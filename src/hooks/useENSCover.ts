import { useQuery } from '@tanstack/react-query';
import { fetchImage } from '@/handlers/ens';
import { getENSData, saveENSData } from '@/handlers/localstorage/ens';
import { queryClient, QueryConfigDeprecated, UseQueryData } from '@/react-query';

export const ensCoverQueryKey = (name: string) => ['ens-header', name];

const STALE_TIME = 10000;

export async function fetchENSCover(name: string, { cacheFirst }: { cacheFirst?: boolean } = {}) {
  const cachedCover = await getENSData('header', name);
  if (cachedCover) {
    queryClient.setQueryData(ensCoverQueryKey(name), cachedCover);
    if (cacheFirst) return cachedCover as { imageUrl?: string | null };
  }
  const cover = await fetchImage('header', name);
  saveENSData('header', name, cover);
  return cover;
}

export async function prefetchENSCover(name: string, { cacheFirst }: { cacheFirst?: boolean } = {}) {
  queryClient.prefetchQuery(ensCoverQueryKey(name), async () => fetchENSCover(name, { cacheFirst }), { staleTime: STALE_TIME });
}

export default function useENSCover(name: string, config?: QueryConfigDeprecated<typeof fetchENSCover>) {
  return useQuery<UseQueryData<typeof fetchENSCover>>(ensCoverQueryKey(name), async () => fetchENSCover(name), {
    ...config,
    // Data will be stale for 10s to avoid dupe queries
    staleTime: STALE_TIME,
  });
}
