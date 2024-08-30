import { SwappableAsset } from '@/entities';
import { walletFilter } from '@/handlers/tokenSearch';
import { Network } from '@/helpers';
import { useCoinListEditOptions } from '@/hooks';
import { ETH_ADDRESS } from '@/references';
import { useSortedUserAssets } from '@/resources/assets/useSortedUserAssets';
import { EthereumAddress, ETH_ADDRESS as ETH_ADDRESS_AGGREGATORS } from '@rainbow-me/swaps';
import { ethereumUtils } from '@/utils';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { RainbowNetworks, getNetworkObj, getSwappableNetworks } from '@/networks';

type SwappableAddresses = Record<Network, EthereumAddress[]>;

export const useSwappableUserAssets = (params: { outputCurrency: SwappableAsset }) => {
  const { outputCurrency } = params;
  const { data: sortedAssets } = useSortedUserAssets();
  const assetsInWallet = sortedAssets as SwappableAsset[];
  const { hiddenCoinsObj } = useCoinListEditOptions();

  const swappableAssetsRef = useRef<SwappableAddresses>(
    getSwappableNetworks().reduce((acc, network) => {
      acc[network.value as Network] = [];
      return acc;
    }, {} as SwappableAddresses)
  );

  const filteredAssetsInWallet = (assetsInWallet || []).filter(asset => {
    // filter out hidden tokens
    if (hiddenCoinsObj[asset.uniqueId]) return true;

    // filter out networks where swaps are not enabled
    const assetNetwork = asset.network;
    if (getNetworkObj(assetNetwork).features.swaps) return true;

    return false;
  });

  const getSwappableAddressesForNetwork = useCallback(
    async (addresses: EthereumAddress[], network: keyof SwappableAddresses) => {
      try {
        if (outputCurrency) {
          const outputNetwork = outputCurrency.network;
          if (outputNetwork !== network) {
            const swappableAddresses = (await walletFilter({
              addresses,
              fromChainId: ethereumUtils.getChainIdFromNetwork(network),
              toChainId: ethereumUtils.getChainIdFromNetwork(outputNetwork as Network),
            })) as string[];

            swappableAssetsRef.current[network] = swappableAddresses;
          } else {
            swappableAssetsRef.current[network] = addresses;
          }
        }
      } catch (e) {
        swappableAssetsRef.current[network] = addresses;
      }
    },
    [outputCurrency]
  );

  const getSwappableAddressesInWallet = useCallback(async () => {
    const networks = RainbowNetworks.filter(({ features }) => features.swaps).map(({ value }) => value);

    const walletFilterRequests: Promise<void>[] = [];
    networks.forEach(network => {
      const assetsAddressesOnChain = filteredAssetsInWallet
        .filter(asset => (asset?.network || Network.mainnet) === network)
        .map(asset => (asset?.address === ETH_ADDRESS ? ETH_ADDRESS_AGGREGATORS : asset?.address));
      if (assetsAddressesOnChain.length) {
        walletFilterRequests.push(getSwappableAddressesForNetwork(assetsAddressesOnChain, network as keyof SwappableAddresses));
      }
    });
    await Promise.all(walletFilterRequests);
  }, [filteredAssetsInWallet, getSwappableAddressesForNetwork]);

  const swappableUserAssets = useMemo(
    () =>
      filteredAssetsInWallet.filter(asset => {
        const assetNetwork = asset?.network || (Network.mainnet as Network);
        const assetAddress = asset?.address === ETH_ADDRESS ? ETH_ADDRESS_AGGREGATORS : asset?.address;

        const isSwappable = swappableAssetsRef.current[assetNetwork]?.includes(assetAddress);
        return isSwappable;
      }),
    [filteredAssetsInWallet]
  );

  const unswappableUserAssets = useMemo(
    () =>
      filteredAssetsInWallet.filter(asset => {
        const assetNetwork = asset?.network || (Network.mainnet as Network);
        const assetAddress = asset?.address === ETH_ADDRESS ? ETH_ADDRESS_AGGREGATORS : asset?.address;
        // we place our testnets (goerli) in the Network type which creates this type issue
        // @ts-ignore
        const isNotSwappable = !swappableAssetsRef.current[assetNetwork]?.includes(assetAddress);
        return isNotSwappable;
      }),
    [filteredAssetsInWallet]
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
