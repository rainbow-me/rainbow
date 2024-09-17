import { useEffect, useState } from 'react';
import { getFlashbotsProvider, getProvider } from '@/handlers/web3';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { ethereumUtils } from '@/utils';
import { getOnchainAssetBalance } from '@/handlers/assets';
import { ParsedAddressAsset } from '@/entities';
import { ChainId } from '@/chains/types';

export const useProviderSetup = (chainId: ChainId, address: string) => {
  const [provider, setProvider] = useState<StaticJsonRpcProvider | null>(null);
  const [nativeAsset, setNativeAsset] = useState<ParsedAddressAsset | null>(null);

  useEffect(() => {
    const initProvider = async () => {
      let p;
      if (chainId === ChainId.mainnet) {
        p = await getFlashbotsProvider();
      } else {
        p = getProvider({ chainId });
      }
      setProvider(p);
    };
    initProvider();
  }, [chainId]);

  useEffect(() => {
    const fetchNativeAsset = async () => {
      if (provider) {
        const asset = await ethereumUtils.getNativeAssetForNetwork({ chainId, address });
        if (asset) {
          const balance = await getOnchainAssetBalance(asset, address, chainId, provider);
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
  }, [address, chainId, provider]);

  return { provider, nativeAsset };
};
