import { useQuery } from 'react-query';
import { fetchProfileRecords } from '@rainbow-me/handlers/ens';
import {
  getProfileRecords,
  saveProfileRecords,
} from '@rainbow-me/handlers/localstorage/ens';
import { queryClient } from '@rainbow-me/react-query/queryClient';
import { QueryConfig, UseQueryData } from '@rainbow-me/react-query/types';

export const ensProfileRecordsQueryKey = (name: string) => [
  'ens-profile-records',
  name,
];

const STALE_TIME = 10000;

async function fetchENSProfileRecords({ name }: { name: string }) {
  const cachedProfile = await getProfileRecords(name);
  if (cachedProfile) {
    queryClient.setQueryData(ensProfileRecordsQueryKey(name), cachedProfile);
  }
  const profileRecords = await fetchProfileRecords(name);
  saveProfileRecords(name, profileRecords);
  return profileRecords;
}

export async function prefetchENSProfileRecords({ name }: { name: string }) {
  await queryClient.prefetchQuery(
    ensProfileRecordsQueryKey(name),
    async () => await fetchENSProfileRecords({ name }),
    { staleTime: STALE_TIME }
  );
}

export default function useENSProfileRecords(
  name: string,
  config?: QueryConfig<typeof fetchProfileRecords>
) {
  const { data, isLoading, isSuccess } = useQuery<
    UseQueryData<typeof fetchProfileRecords>
  >(
    ensProfileRecordsQueryKey(name),
    async () => await fetchENSProfileRecords({ name }),
    {
      ...config,
      // Data will be stale for 10s to avoid dupe queries
      staleTime: STALE_TIME,
    }
  );

  return { data, isLoading, isSuccess };
}
