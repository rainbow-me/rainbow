import { useEffect, useState } from 'react';
import { getProvider } from '@/handlers/web3';
import { ethereumUtils } from '@/utils';
import { getOnchainAssetBalance } from '@/handlers/assets';
import { ParsedAddressAsset } from '@/entities';
import { ChainId } from '@/chains/types';

export const useProviderSetup = (chainId: ChainId, address: string) => {
  const provider = getProvider({ chainId });
  const [nativeAsset, setNativeAsset] = useState<ParsedAddressAsset | null>(null);

  useEffect(() => {
    const fetchNativeAsset = async () => {
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
    };
    fetchNativeAsset();
  }, [address, chainId, provider]);

  return { provider, nativeAsset };
};
