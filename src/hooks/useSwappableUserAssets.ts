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
import { RainbowNetworks, getNetworkObj } from '@/networks';

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
    () =>
      assetsInWallet.filter(asset => {
        // filter out hidden tokens
        if (hiddenCoinsObj[asset.uniqueId]) return true;

        // filter out networks where swaps are not enabled
        const assetNetwork = ethereumUtils.getNetworkFromType(asset.type);
        if (getNetworkObj(assetNetwork).features.swaps) return true;

        return false;
      }),
    [assetsInWallet, hiddenCoinsObj]
  );

  const getSwappableAddressesForNetwork = useCallback(
    async (addresses: EthereumAddress[], network: Network) => {
      try {
        if (outputCurrency) {
          const outputNetwork =
            outputCurrency.type !== 'token'
              ? outputCurrency.type
              : Network.mainnet;
          if (outputNetwork !== network) {
            const swappableAddresses = (await walletFilter({
              addresses,
              fromChainId: ethereumUtils.getChainIdFromNetwork(network),
              toChainId: ethereumUtils.getChainIdFromNetwork(
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
      } catch (e) {
        setSwappableAssets(state => ({ ...state, [network]: addresses }));
      }
    },
    [outputCurrency]
  );

  const getSwappableAddressesInWallet = useCallback(async () => {
    const networks = RainbowNetworks.filter(
      ({ features }) => features.swaps
    ).map(({ value }) => value);

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

  const unswappableUserAssets = useMemo(
    () =>
      filteredAssetsInWallet.filter(asset => {
        const assetNetwork = asset?.network || (Network.mainnet as Network);
        const assetAddress =
          asset?.address === ETH_ADDRESS
            ? ETH_ADDRESS_AGGREGATORS
            : asset?.address;
        // we place our testnets (goerli) in the Network type which creates this type issue
        // @ts-ignore
        const isNotSwappable = !swappableAssets[assetNetwork]?.includes(
          assetAddress
        );
        return isNotSwappable;
      }),
    [filteredAssetsInWallet, swappableAssets]
  );

  useEffect(() => {
    getSwappableAddressesInWallet();
  }, [getSwappableAddressesInWallet]);

  if (!outputCurrency) {
    return {
      swappableUserAssets: filteredAssetsInWallet,
      unswappableUserAssets: [],
    };
  }

  return {
    swappableUserAssets,
    unswappableUserAssets,
  };
};
