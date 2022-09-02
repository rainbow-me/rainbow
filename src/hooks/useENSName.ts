import { useQuery } from '@tanstack/react-query';
import { fetchReverseRecord } from '@/handlers/ens';
import { getENSName, saveENSName } from '@/handlers/localstorage/ens';
import { queryClient } from '@/react-query/queryClient';
import { QueryConfig, UseQueryData } from '@/react-query/types';
import { EthereumAddress } from '@/entities';
import { isValidAddress } from 'ethereumjs-util';

export const ensNameQueryKey = (address: EthereumAddress) => [
  'ens-name',
  address,
];

const STALE_TIME = 10000;

export async function fetchENSName(
  address: EthereumAddress | null | undefined,
  { cacheFirst }: { cacheFirst?: boolean } = {}
): Promise<string> {
  if (!address || !isValidAddress(address)) return '';
  const cachedData = await getENSName(address);
  if (cachedData) {
    queryClient.setQueryData(ensNameQueryKey(address), cachedData?.address);
    if (cacheFirst) return cachedData?.address ?? '';
  }

  const name = await fetchReverseRecord(address);
  saveENSName(address, name);
  return name;
}

export async function prefetchENSName(
  address: EthereumAddress | null | undefined,
  { cacheFirst }: { cacheFirst?: boolean } = {}
) {
  if (!address || !isValidAddress(address)) return;
  queryClient.prefetchQuery(
    ensNameQueryKey(address),
    async () => fetchENSName(address, { cacheFirst }),
    { staleTime: STALE_TIME }
  );
}

export default function useENSAddress(
  address: EthereumAddress | null | undefined,
  config?: QueryConfig<typeof fetchENSName>
) {
  const addressString = address ?? '';
  return useQuery<UseQueryData<typeof fetchENSName>>(
    ensNameQueryKey(addressString),
    async () => fetchENSName(addressString),
    {
      ...config,
      enabled: isValidAddress(addressString),
      // Data will be stale for 10s to avoid dupe queries
      staleTime: STALE_TIME,
    }
  );
}
