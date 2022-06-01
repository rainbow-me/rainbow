import { useQuery } from 'react-query';
import {
  getResolveName,
  saveResolveName,
} from '@rainbow-me/handlers/localstorage/ens';
import { web3Provider } from '@rainbow-me/handlers/web3';
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
  const address = await web3Provider.resolveName(ensName);
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
