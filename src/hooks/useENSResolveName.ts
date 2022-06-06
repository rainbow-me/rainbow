import { useQuery } from 'react-query';
import { fetchPrimary } from '@rainbow-me/handlers/ens';
import {
  getResolveName,
  saveResolveName,
} from '@rainbow-me/handlers/localstorage/ens';
import { queryClient } from '@rainbow-me/react-query/queryClient';

const STALE_TIME = 10000;

export const ensResolveNameQueryKey = (ensName: string) => [
  'resolve-name',
  ensName,
];

async function resolveENSName(ensName: string) {
  const cachedAddress = await getResolveName(ensName);
  if (cachedAddress)
    queryClient.setQueryData(ensResolveNameQueryKey(ensName), cachedAddress);
  const { address } = await fetchPrimary(ensName);
  if (address) {
    saveResolveName(ensName, address);
  }
  return address;
}

export async function prefetchENSResolveName(ensName: string) {
  await queryClient.prefetchQuery(
    ensResolveNameQueryKey(ensName),
    async () => await resolveENSName(ensName),
    { staleTime: STALE_TIME }
  );
}

export default function useENSResolveName(ensName: string) {
  return useQuery(
    ensResolveNameQueryKey(ensName),
    async () => await resolveENSName(ensName),
    { staleTime: STALE_TIME }
  );
}
