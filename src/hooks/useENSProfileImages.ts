import { useQuery, useQueryClient } from 'react-query';
import { fetchImages } from '@rainbow-me/handlers/ens';
import {
  getProfileImages,
  saveProfileImages,
} from '@rainbow-me/handlers/localstorage/ens';
import { QueryConfig, UseQueryData } from '@rainbow-me/react-query/types';

export const ensProfileImagesQueryKey = (name: string) => [
  'ens-profile-images',
  name,
];

export default function useENSProfileImages(
  name: string,
  config?: QueryConfig<typeof fetchImages>
) {
  const queryClient = useQueryClient();
  const { data, isFetched } = useQuery<UseQueryData<typeof fetchImages>>(
    ensProfileImagesQueryKey(name),
    async () => {
      const cachedImages = await getProfileImages(name);
      if (cachedImages) {
        queryClient.setQueryData(ensProfileImagesQueryKey(name), cachedImages);
      }
      const images = await fetchImages(name);
      saveProfileImages(name, images);
      return images;
    },
    {
      ...config,
      // Data will be stale for 10s to avoid dupe queries
      staleTime: 10000,
    }
  );

  return { data, isFetched };
}
