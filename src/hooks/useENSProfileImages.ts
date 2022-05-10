import { useQuery } from 'react-query';
import { fetchImages } from '@rainbow-me/handlers/ens';
import {
  getProfileImages,
  saveProfileImages,
} from '@rainbow-me/handlers/localstorage/ens';
import { queryClient } from '@rainbow-me/react-query/queryClient';
import { QueryConfig, UseQueryData } from '@rainbow-me/react-query/types';

export const ensProfileImagesQueryKey = (name: string) => [
  'ens-profile-images',
  name,
];

async function fetchENSProfileImages({ name }: { name: string }) {
  const cachedImages = await getProfileImages(name);
  if (cachedImages) {
    queryClient.setQueryData(ensProfileImagesQueryKey(name), cachedImages);
  }
  const images = await fetchImages(name);
  saveProfileImages(name, images);
  return images;
}

export async function prefetchENSProfileImages({ name }: { name: string }) {
  queryClient.prefetchQuery(
    ensProfileImagesQueryKey(name),
    async () => fetchENSProfileImages({ name }),
    { staleTime: 10000 }
  );
}

export default function useENSProfileImages(
  name: string,
  config?: QueryConfig<typeof fetchImages>
) {
  const { data, isFetched } = useQuery<UseQueryData<typeof fetchImages>>(
    ensProfileImagesQueryKey(name),
    async () => fetchENSProfileImages({ name }),
    {
      ...config,
      // Data will be stale for 10s to avoid dupe queries
      staleTime: 10000,
    }
  );

  return { data, isFetched };
}
