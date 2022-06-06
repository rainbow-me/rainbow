import { useQuery } from 'react-query';
import {
  getResolveName,
  saveResolveName,
} from '@rainbow-me/handlers/localstorage/ens';
import { web3Provider } from '@rainbow-me/handlers/web3';

export default function useENSResolveName(ensName: string) {
  return useQuery(['resolve-name', ensName], async () => {
    const cachedAddress = await getResolveName(ensName);
    if (cachedAddress) return cachedAddress;

    const address = await web3Provider.resolveName(ensName);
    address && saveResolveName(ensName, address);
    return address;
  });
}
