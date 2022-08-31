import { useQuery } from '@tanstack/react-query';
import PQueue from 'p-queue/dist';
import { fetchENSAddress } from './useENSAddress';
import { getENSData, saveENSData } from '@/handlers/localstorage/ens';
import { queryClient } from '@/react-query/queryClient';
import { QueryConfig, UseQueryData } from '@/react-query/types';
import { getFirstTransactionTimestamp } from '@/utils/ethereumUtils';

const ensFirstTxTimestampQueryKey = (name: string) => [
  'first-transaction-timestamp',
  name,
];

const queue = new PQueue({ interval: 1000, intervalCap: 5 });

export async function fetchENSFirstTransactionTimestamp(
  name: string,
  { cacheFirst }: { cacheFirst?: boolean } = {}
) {
  const cachedData = await getENSData('firstTxTimestamp', name);
  if (cachedData) {
    queryClient.setQueryData(
      ensFirstTxTimestampQueryKey(name),
      cachedData?.firstTxTimestamp
    );
    if (cacheFirst) return cachedData?.firstTxTimestamp;
  }

  const address = await fetchENSAddress(name);
  const timestamp = address
    ? await queue.add(async () => getFirstTransactionTimestamp(address))
    : undefined;

  timestamp
    ? saveENSData('firstTxTimestamp', name, { firstTxTimestamp: timestamp })
    : queryClient.invalidateQueries(ensFirstTxTimestampQueryKey(name));

  return timestamp ?? null;
}

export async function prefetchENSFirstTransactionTimestamp(
  name: string,
  { cacheFirst }: { cacheFirst?: boolean } = {}
) {
  queryClient.prefetchQuery(
    ensFirstTxTimestampQueryKey(name),
    async () => fetchENSFirstTransactionTimestamp(name, { cacheFirst }),
    { cacheTime: Infinity, staleTime: Infinity }
  );
}

export default function useENSFirstTransactionTimestamp(
  name: string,
  config?: QueryConfig<typeof fetchENSFirstTransactionTimestamp>
) {
  return useQuery<UseQueryData<typeof fetchENSFirstTransactionTimestamp>>(
    ensFirstTxTimestampQueryKey(name),
    async () => fetchENSFirstTransactionTimestamp(name),
    {
      ...config,
      cacheTime: Infinity,
      enabled: Boolean(name),
      // First transaction timestamp will obviously never be stale.
      // So we won't fetch / refetch it again.
      staleTime: Infinity,
    }
  );
}
