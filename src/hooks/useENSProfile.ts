import { useQuery, useQueryClient } from 'react-query';
import { fetchProfile } from '@rainbow-me/handlers/ens';
import { getProfile, saveProfile } from '@rainbow-me/handlers/localstorage/ens';
import { QueryConfig, UseQueryData } from '@rainbow-me/react-query/types';

const queryKey = (name: string) => ['ens-profile', name];

export default function useENSProfile(
  name: string,
  config?: QueryConfig<typeof fetchProfile>
) {
  const queryClient = useQueryClient();
  const { data, isLoading, isSuccess } = useQuery<
    UseQueryData<typeof fetchProfile>
  >(
    queryKey(name),
    async () => {
      const cachedProfile = await getProfile(name);
      if (cachedProfile) {
        queryClient.setQueryData(queryKey(name), cachedProfile);
      }

      const profile = await fetchProfile(name);
      await saveProfile(name, profile);
      return profile;
    },
    {
      ...config,
      // Data will be stale for 10s to avoid dupe queries
      staleTime: 10000,
    }
  );

  return { data, isLoading, isSuccess };
}
