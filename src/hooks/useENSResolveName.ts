import { useQuery } from 'react-query';
import {
  getResolveName,
  saveResolveName,
} from '@rainbow-me/handlers/localstorage/ens';
import { getProviderForNetwork } from '@rainbow-me/handlers/web3';

export default function useENSResolveName(ensName: string) {
  return useQuery(['resolve-name', ensName], async () => {
    const cachedAddress = await getResolveName(ensName);
    if (cachedAddress) return cachedAddress;
    const provider = await getProviderForNetwork();
    const address = await provider.resolveName(ensName);
    address && saveResolveName(ensName, address);
    return address;
  });
}
