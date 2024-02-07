import { useQuery } from '@tanstack/react-query';
import { Records } from '@/entities';
import { fetchCoinAddresses, fetchContenthash, fetchRecords } from '@/handlers/ens';
import { getENSData, saveENSData } from '@/handlers/localstorage/ens';
import { ENS_RECORDS } from '@/helpers/ens';
import { queryClient, QueryConfigDeprecated, UseQueryData } from '@/react-query';

export const ensRecordsQueryKey = ({ name, supportedOnly }: { name: string; supportedOnly?: boolean }) => [
  'ens-records',
  name,
  supportedOnly,
];

const STALE_TIME = 10000;

export async function fetchENSRecords(
  name: string,
  { cacheFirst, supportedOnly = true }: { cacheFirst?: boolean; supportedOnly?: boolean } = {}
) {
  const cachedRecords: {
    coinAddresses: { [key in ENS_RECORDS]: string };
    contenthash?: string;
    records: Partial<Records>;
  } | null = await getENSData('records', name);

  if (cachedRecords) {
    queryClient.setQueryData(ensRecordsQueryKey({ name, supportedOnly }), cachedRecords);
    if (cacheFirst) return cachedRecords;
  }
  const [records, coinAddresses, contenthash] = await Promise.all([
    fetchRecords(name, { supportedOnly }),
    fetchCoinAddresses(name, { supportedOnly }),
    fetchContenthash(name),
  ]);
  const data = { coinAddresses, contenthash, records };
  saveENSData('records', name, data);
  return data;
}

export async function prefetchENSRecords(
  name: string,
  { cacheFirst, supportedOnly = true }: { cacheFirst?: boolean; supportedOnly?: boolean } = {}
) {
  queryClient.prefetchQuery(ensRecordsQueryKey({ name, supportedOnly }), async () => fetchENSRecords(name, { cacheFirst, supportedOnly }), {
    staleTime: STALE_TIME,
  });
}

export default function useENSRecords(
  name: string,
  {
    supportedOnly = true,
    ...config
  }: QueryConfigDeprecated<typeof fetchENSRecords> & {
    supportedOnly?: boolean;
  } = {}
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
