import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { useEffect, useState } from 'react';
import { getProviderForNetwork } from '@rainbow-me/handlers/web3';
import { Network } from '@rainbow-me/helpers/networkTypes';

export default function useProviderWithNetwork(
  network: Network
): StaticJsonRpcProvider | null {
  const [provider, setProvider] = useState<StaticJsonRpcProvider | null>(null);
  useEffect(() => {
    const updateProvider = async () => {
      const p = await getProviderForNetwork(network);
      setProvider(p);
    };
    updateProvider();
  }, [network]);
  return provider;
}
