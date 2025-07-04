import { useQuery } from '@tanstack/react-query';
import { fetchImage } from '@/handlers/ens';
import { getENSData, saveENSData } from '@/handlers/localstorage/ens';
import { queryClient, QueryConfigDeprecated, UseQueryData } from '@/react-query';

export const ensAvatarQueryKey = (name: string) => ['ens-avatar', name];

const STALE_TIME = 10000;

type FetchENSAvatarOptions = { cacheFirst?: boolean; swallowError?: boolean };

export async function fetchENSAvatar(name: string, { cacheFirst, swallowError }: FetchENSAvatarOptions = {}) {
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
}

export async function fetchENSAvatarWithRetry(name: string, options: FetchENSAvatarOptions = {}) {
  for (let i = 0; i < 3; i++) {
    try {
      return await fetchENSAvatar(name, options);
      // eslint-disable-next-line no-empty
    } catch (err) {
      console.log('error fetching', err);
    }
  }
  return null;
}

export async function prefetchENSAvatar(name: string, { cacheFirst }: { cacheFirst?: boolean } = {}) {
  queryClient.prefetchQuery(ensAvatarQueryKey(name), async () => fetchENSAvatar(name, { cacheFirst }), { staleTime: STALE_TIME });
}

export default function useENSAvatar(name: string, config?: QueryConfigDeprecated<typeof fetchENSAvatar>) {
  return useQuery<UseQueryData<typeof fetchENSAvatar>>(ensAvatarQueryKey(name), async () => fetchENSAvatar(name), {
    ...config,
    // Data will be stale for 10s to avoid dupe queries
    staleTime: STALE_TIME,
  });
}
