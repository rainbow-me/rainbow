import { useQuery } from 'react-query';
import { Records } from '@rainbow-me/entities';
import { fetchCoinAddresses, fetchRecords } from '@rainbow-me/handlers/ens';
import { getENSData, saveENSData } from '@rainbow-me/handlers/localstorage/ens';
import { ENS_RECORDS } from '@rainbow-me/helpers/ens';
import { queryClient } from '@rainbow-me/react-query/queryClient';
import { QueryConfig, UseQueryData } from '@rainbow-me/react-query/types';

export const ensRecordsQueryKey = (name: string) => ['ens-records', name];

const STALE_TIME = 10000;

export async function fetchENSRecords(
  name: string,
  { cacheFirst }: { cacheFirst?: boolean } = {}
) {
  const cachedRecords: {
    coinAddresses: { [key in ENS_RECORDS]: string };
    records: Partial<Records>;
  } | null = await getENSData('records', name);

  if (cachedRecords) {
    queryClient.setQueryData(ensRecordsQueryKey(name), cachedRecords);
    if (cacheFirst) return cachedRecords;
  }
  const records = await fetchRecords(name);
  const coinAddresses = await fetchCoinAddresses(name);
  const data = { coinAddresses, records };
  saveENSData('records', name, data);
  return data;
}

export async function prefetchENSRecords(
  name: string,
  { cacheFirst }: { cacheFirst?: boolean } = {}
) {
  queryClient.prefetchQuery(
    ensRecordsQueryKey(name),
    async () => fetchENSRecords(name, { cacheFirst }),
    { staleTime: STALE_TIME }
  );
}

export default function useENSRecords(
  name: string,
  config?: QueryConfig<typeof fetchENSRecords>
) {
  return useQuery<UseQueryData<typeof fetchENSRecords>>(
    ensRecordsQueryKey(name),
    async () => fetchENSRecords(name),
    {
      ...config,
      // Data will be stale for 10s to avoid dupe queries
      staleTime: STALE_TIME,
    }
  );
}
