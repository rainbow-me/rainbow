import { useEffect, useState } from 'react';
import { getFlashbotsProvider, getProvider } from '@/handlers/web3';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { ethereumUtils } from '@/utils';
import { getOnchainAssetBalance } from '@/handlers/assets';
import { ParsedAddressAsset } from '@/entities';
import { ChainId } from '@/__swaps__/types/chains';

export const useProviderSetup = (currentChainId: ChainId, accountAddress: string) => {
  const [provider, setProvider] = useState<StaticJsonRpcProvider | null>(null);
  const [nativeAsset, setNativeAsset] = useState<ParsedAddressAsset | null>(null);

  useEffect(() => {
    const initProvider = async () => {
      let p;
      if (currentChainId === ChainId.mainnet) {
        p = await getFlashbotsProvider();
      } else {
        p = getProvider({ chainId: currentChainId });
      }
      setProvider(p);
    };
    initProvider();
  }, [currentChainId]);

  useEffect(() => {
    const fetchNativeAsset = async () => {
      if (provider) {
        const asset = await ethereumUtils.getNativeAssetForNetwork(currentChainId, accountAddress);
        if (asset) {
          const balance = await getOnchainAssetBalance(
            asset,
            accountAddress,
            ethereumUtils.getNetworkFromChainId(currentChainId),
            provider
          );
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
  }, [accountAddress, currentChainId, provider]);

  return { provider, nativeAsset };
};
