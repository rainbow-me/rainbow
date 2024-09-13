import { SwappableAsset } from '@/entities';
import { walletFilter } from '@/handlers/tokenSearch';
import { useCoinListEditOptions } from '@/hooks';
import { ETH_ADDRESS } from '@/references';
import { useSortedUserAssets } from '@/resources/assets/useSortedUserAssets';
import { EthereumAddress, ETH_ADDRESS as ETH_ADDRESS_AGGREGATORS } from '@rainbow-me/swaps';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ChainId } from '@/chains/types';
import { supportedSwapChainIds } from '@/chains';

type SwappableAddresses = Record<ChainId, EthereumAddress[]>;

export const useSwappableUserAssets = (params: { outputCurrency: SwappableAsset }) => {
  const { outputCurrency } = params;
  const { data: sortedAssets } = useSortedUserAssets();
  const assetsInWallet = sortedAssets as SwappableAsset[];
  const { hiddenCoinsObj } = useCoinListEditOptions();

  const swappableAssetsRef = useRef<SwappableAddresses>(
    supportedSwapChainIds.reduce((acc, chainId) => {
      acc[chainId] = [];
      return acc;
    }, {} as SwappableAddresses)
  );

  const filteredAssetsInWallet = (assetsInWallet || []).filter(asset => {
    // filter out hidden tokens
    if (hiddenCoinsObj[asset.uniqueId]) return true;

    // filter out networks where swaps are not enabled
    if (supportedSwapChainIds.includes(asset.chainId)) return true;

    return false;
  });

  const getSwappableAddressesForChainId = useCallback(
    async (addresses: EthereumAddress[], chainId: keyof SwappableAddresses) => {
      try {
        if (outputCurrency) {
          const outputChainId = outputCurrency.chainId;
          if (outputChainId !== chainId) {
            const swappableAddresses = (await walletFilter({
              addresses,
              fromChainId: chainId,
              toChainId: outputChainId,
            })) as string[];

            swappableAssetsRef.current[chainId] = swappableAddresses;
          } else {
            swappableAssetsRef.current[chainId] = addresses;
          }
        }
      } catch (e) {
        swappableAssetsRef.current[chainId] = addresses;
      }
    },
    [outputCurrency]
  );

  const getSwappableAddressesInWallet = useCallback(async () => {
    const walletFilterRequests: Promise<void>[] = [];
    supportedSwapChainIds.forEach(chainId => {
      const assetsAddressesOnChain = filteredAssetsInWallet
        .filter(asset => (asset?.chainId || ChainId.mainnet) === chainId)
        .map(asset => (asset?.address === ETH_ADDRESS ? ETH_ADDRESS_AGGREGATORS : asset?.address));
      if (assetsAddressesOnChain.length) {
        walletFilterRequests.push(getSwappableAddressesForChainId(assetsAddressesOnChain, chainId));
      }
    });
    await Promise.all(walletFilterRequests);
  }, [filteredAssetsInWallet, getSwappableAddressesForChainId]);

  const swappableUserAssets = useMemo(
    () =>
      filteredAssetsInWallet.filter(asset => {
        const assetChainId = asset?.chainId || ChainId.mainnet;
        const assetAddress = asset?.address === ETH_ADDRESS ? ETH_ADDRESS_AGGREGATORS : asset?.address;

        const isSwappable = swappableAssetsRef.current[assetChainId]?.includes(assetAddress);
        return isSwappable;
      }),
    [filteredAssetsInWallet]
  );

  const unswappableUserAssets = useMemo(
    () =>
      filteredAssetsInWallet.filter(asset => {
        const assetChainId = asset?.chainId || ChainId.mainnet;
        const assetAddress = asset?.address === ETH_ADDRESS ? ETH_ADDRESS_AGGREGATORS : asset?.address;
        const isNotSwappable = !swappableAssetsRef.current[assetChainId]?.includes(assetAddress);
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
