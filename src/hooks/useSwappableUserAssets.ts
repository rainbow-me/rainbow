import { SwappableAsset } from '@/entities';
import { walletFilter } from '@/handlers/tokenSearch';
import { Network } from '@/helpers';
import { useAssetsInWallet, useCoinListEditOptions } from '@/hooks';
import { ETH_ADDRESS } from '@/references';
import {
  EthereumAddress,
  ETH_ADDRESS as ETH_ADDRESS_AGGREGATORS,
} from '@rainbow-me/swaps';
import { ethereumUtils } from '@/utils';
import { useCallback, useEffect, useMemo, useState } from 'react';

type SwappableAddresses = {
  [Network.mainnet]: EthereumAddress[];
  [Network.optimism]: EthereumAddress[];
  [Network.polygon]: EthereumAddress[];
  [Network.arbitrum]: EthereumAddress[];
};

export const useSwappableUserAssets = (params: {
  outputCurrency: SwappableAsset;
}) => {
  const { outputCurrency } = params;
  const assetsInWallet = useAssetsInWallet() as SwappableAsset[];
  const { hiddenCoinsObj } = useCoinListEditOptions();
  const [swappableAssets, setSwappableAssets] = useState<SwappableAddresses>({
    [Network.mainnet]: [],
    [Network.optimism]: [],
    [Network.polygon]: [],
    [Network.arbitrum]: [],
  });

  const filteredAssetsInWallet = useMemo(
    () => assetsInWallet.filter(asset => !hiddenCoinsObj[asset.uniqueId]),
    [assetsInWallet, hiddenCoinsObj]
  );

  const getSwappableAddressesForNetwork = useCallback(
    async (addresses: EthereumAddress[], network: Network) => {
      if (outputCurrency) {
        const outputNetwork =
          outputCurrency.type !== 'token'
            ? outputCurrency.type
            : Network.mainnet;
        if (outputNetwork !== network) {
          const swappableAddresses = (await walletFilter({
            addresses,
            departureChainId: ethereumUtils.getChainIdFromNetwork(network),
            destinationChainId: ethereumUtils.getChainIdFromNetwork(
              outputNetwork as Network
            ),
          })) as string[];
          setSwappableAssets(state => ({
            ...state,
            [network]: swappableAddresses,
          }));
        } else {
          setSwappableAssets(state => ({ ...state, [network]: addresses }));
        }
      }
    },
    [outputCurrency]
  );

  const getSwappableAddressesInWallet = useCallback(async () => {
    const networks = [
      Network.mainnet,
      Network.optimism,
      Network.polygon,
      Network.arbitrum,
    ];
    const walletFilterRequests: Promise<void>[] = [];
    networks.forEach(network => {
      const assetsAddressesOnChain = filteredAssetsInWallet
        .filter(asset => (asset?.network || Network.mainnet) === network)
        .map(asset =>
          asset?.address === ETH_ADDRESS
            ? ETH_ADDRESS_AGGREGATORS
            : asset?.address
        );
      if (assetsAddressesOnChain.length) {
        walletFilterRequests.push(
          getSwappableAddressesForNetwork(assetsAddressesOnChain, network)
        );
      }
    });
    await Promise.all(walletFilterRequests);
  }, [filteredAssetsInWallet, getSwappableAddressesForNetwork]);

  const swappableUserAssets = useMemo(
    () =>
      filteredAssetsInWallet.filter(asset => {
        const assetNetwork = asset?.network || (Network.mainnet as Network);
        const assetAddress =
          asset?.address === ETH_ADDRESS
            ? ETH_ADDRESS_AGGREGATORS
            : asset?.address;
        // we place our testnets (goerli) in the Network type which creates this type issue
        // @ts-ignore
        const isSwappable = swappableAssets[assetNetwork]?.includes(
          assetAddress
        );
        return isSwappable;
      }),
    [filteredAssetsInWallet, swappableAssets]
  );

  useEffect(() => {
    getSwappableAddressesInWallet();
  }, [getSwappableAddressesInWallet]);

  if (!outputCurrency) {
    return {
      swappableUserAssets: filteredAssetsInWallet,
    };
  }

  return {
    swappableUserAssets,
  };
};
