import { useQuery, useQueryClient } from 'react-query';
import { fetchProfileRecords } from '@rainbow-me/handlers/ens';
import {
  getProfileRecords,
  saveProfileRecords,
} from '@rainbow-me/handlers/localstorage/ens';
import { QueryConfig, UseQueryData } from '@rainbow-me/react-query/types';

const queryKey = (name: string) => ['ens-profile-records', name];

const STALE_TIME = 10000;

export default function useENSProfileRecords(
  name: string,
  config?: QueryConfig<typeof fetchProfileRecords>
) {
  const queryClient = useQueryClient();
  const { data, isLoading, isSuccess } = useQuery<
    UseQueryData<typeof fetchProfileRecords>
  >(
    queryKey(name),
    async () => {
      const cachedProfile = await getProfileRecords(name);
      if (cachedProfile) {
        queryClient.setQueryData(queryKey(name), cachedProfile);
      }
      const profileRecords = await fetchProfileRecords(name);
      saveProfileRecords(name, profileRecords);
      return profileRecords;
    },
    {
      ...config,
      // Data will be stale for 10s to avoid dupe queries
      staleTime: STALE_TIME,
    }
  );

  return { data, isLoading, isSuccess };
}
