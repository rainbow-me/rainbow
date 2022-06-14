import { useQuery } from 'react-query';
import useAccountSettings from './useAccountSettings';
import {
  getResolveName,
  saveResolveName,
} from '@rainbow-me/handlers/localstorage/ens';
import { getProviderForNetwork } from '@rainbow-me/handlers/web3';

export default function useENSResolveName(ensName: string) {
  const { network } = useAccountSettings();
  return useQuery(['resolve-name', ensName], async () => {
    const cachedAddress = await getResolveName(ensName);
    if (cachedAddress) return cachedAddress;

    const provider = await getProviderForNetwork(network);
    const address = await provider.resolveName(ensName);
    address && saveResolveName(ensName, address);
    return address;
  });
}
