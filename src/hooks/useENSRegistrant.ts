import { useQuery } from '@tanstack/react-query';
import { fetchRegistration } from '@/handlers/ens';
import { getENSData, saveENSData } from '@/handlers/localstorage/ens';
import { queryClient, QueryConfigDeprecated, UseQueryData } from '@/react-query';

export const ensRegistrantQueryKey = (name: string) => ['ens-registrant', name];

const STALE_TIME = 10000;

export async function fetchENSRegistrant(name: string) {
  const cachedRegistrant = await getENSData('registrant', name);
  if (cachedRegistrant) {
    queryClient.setQueryData(ensRegistrantQueryKey(name), cachedRegistrant);
  }
  const registrant = await fetchRegistration(name);
  saveENSData('registrant', name, registrant);
  return registrant;
}

export async function prefetchENSRegistrant(name: string) {
  queryClient.prefetchQuery(ensRegistrantQueryKey(name), async () => fetchENSRegistrant(name), { staleTime: STALE_TIME });
}

export default function useENSRegistrant(name: string, config?: QueryConfigDeprecated<typeof fetchENSRegistrant>) {
  return useQuery<UseQueryData<typeof fetchENSRegistrant>>(ensRegistrantQueryKey(name), async () => fetchENSRegistrant(name), {
    ...config,
    // Data will be stale for 10s to avoid dupe queries
    staleTime: STALE_TIME,
  });
}
