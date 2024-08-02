import { useEffect, useState } from 'react';
import { Network } from '@/networks/types';
import { getFlashbotsProvider, getProviderForNetwork } from '@/handlers/web3';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { ethereumUtils } from '@/utils';
import { getOnchainAssetBalance } from '@/handlers/assets';
import { ParsedAddressAsset } from '@/entities';

export const useProviderSetup = (currentNetwork: Network, accountAddress: string) => {
  const [provider, setProvider] = useState<StaticJsonRpcProvider | null>(null);
  const [nativeAsset, setNativeAsset] = useState<ParsedAddressAsset | null>(null);

  useEffect(() => {
    const initProvider = async () => {
      let p;
      if (currentNetwork === Network.mainnet) {
        p = await getFlashbotsProvider();
      } else {
        p = getProviderForNetwork(currentNetwork);
      }
      setProvider(p);
    };
    initProvider();
  }, [currentNetwork]);

  useEffect(() => {
    const fetchNativeAsset = async () => {
      if (provider) {
        const asset = await ethereumUtils.getNativeAssetForNetwork(currentNetwork, accountAddress);
        if (asset) {
          const balance = await getOnchainAssetBalance(asset, accountAddress, currentNetwork, provider);
          if (balance) {
            const assetWithOnchainBalance: ParsedAddressAsset = { ...asset, balance };
            setNativeAsset(assetWithOnchainBalance);
          } else {
            setNativeAsset(asset);
          }
        }
      }
    };
    fetchNativeAsset();
  }, [accountAddress, currentNetwork, provider]);

  return { provider, nativeAsset };
};
