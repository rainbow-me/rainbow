import { useQuery } from '@tanstack/react-query';
import { Records } from '@/entities';
import { fetchCoinAddresses, fetchRecords } from '@/handlers/ens';
import { getENSData, saveENSData } from '@/handlers/localstorage/ens';
import { ENS_RECORDS } from '@/helpers/ens';
import { queryClient } from '@/react-query/queryClient';
import { QueryConfig, UseQueryData } from '@/react-query/types';

export const ensRecordsQueryKey = ({
  name,
  supportedOnly,
}: {
  name: string;
  supportedOnly?: boolean;
}) => ['ens-records', name, supportedOnly];

const STALE_TIME = 10000;

export async function fetchENSRecords(
  name: string,
  {
    cacheFirst,
    supportedOnly = true,
  }: { cacheFirst?: boolean; supportedOnly?: boolean } = {}
) {
  const cachedRecords: {
    coinAddresses: { [key in ENS_RECORDS]: string };
    records: Partial<Records>;
  } | null = await getENSData('records', name);

  if (cachedRecords) {
    queryClient.setQueryData(
      ensRecordsQueryKey({ name, supportedOnly }),
      cachedRecords
    );
    if (cacheFirst) return cachedRecords;
  }
  const records = await fetchRecords(name, { supportedOnly });
  const coinAddresses = await fetchCoinAddresses(name, { supportedOnly });
  const data = { coinAddresses, records };
  saveENSData('records', name, data);
  return data;
}

export async function prefetchENSRecords(
  name: string,
  {
    cacheFirst,
    supportedOnly = true,
  }: { cacheFirst?: boolean; supportedOnly?: boolean } = {}
) {
  queryClient.prefetchQuery(
    ensRecordsQueryKey({ name, supportedOnly }),
    async () => fetchENSRecords(name, { cacheFirst, supportedOnly }),
    { staleTime: STALE_TIME }
  );
}

export default function useENSRecords(
  name: string,
  {
    supportedOnly = true,
    ...config
  }: QueryConfig<typeof fetchENSRecords> & { supportedOnly?: boolean } = {}
) {
  return useQuery<UseQueryData<typeof fetchENSRecords>>(
    ensRecordsQueryKey({ name, supportedOnly }),
    async () => fetchENSRecords(name, { supportedOnly }),
    {
      ...config,
      // Data will be stale for 10s to avoid dupe queries
      staleTime: STALE_TIME,
    }
  );
}
