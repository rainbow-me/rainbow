import { createStore } from '../internal/createStore';
import create from 'zustand';
import { ParsedSearchAsset } from '@/__swaps__/types/assets';
import { isSameAsset } from '@/__swaps__/utils/assets';
import { swapQuoteStore } from './quote';
import { swapSortByStore } from './sortBy';
import { queryClient } from '@/react-query';
import { FormattedExternalAsset, externalTokenQueryKey, fetchExternalToken } from '@/resources/assets/externalAssetsQuery';
import { ethereumUtils } from '@/utils';
import { NativeCurrencyKeys } from '@/entities';
import { RainbowError, logger } from '@/logger';

export interface SwapAssetsState {
  assetToSell: ParsedSearchAsset | null;
  assetToBuy: ParsedSearchAsset | null;
  assetToSellPrice: number;
  assetToBuyPrice: number;

  setAssetToSell: (asset: ParsedSearchAsset) => void;
  setAssetToBuy: (asset: ParsedSearchAsset) => Promise<void>;
  setAssetToSellPrice: (price: number) => void;
  setAssetToBuyPrice: (price: number) => void;
}

export const swapAssetStore = createStore<SwapAssetsState>((set, get) => ({
  assetToSell: null,
  assetToBuy: null,
  assetToSellPrice: 0,
  assetToBuyPrice: 0,

  setAssetToSell: (asset: ParsedSearchAsset) => {
    const currentAssetToSell = get().assetToSell;
    // Do nothing if the user is trying to set the same asset as what's already set
    if (currentAssetToSell && isSameAsset(asset, currentAssetToSell)) {
      return;
    }

    // NOTE: If the asset to sell is the same as the asset to buy, we need to clear the asset to buy
    const assetToBuy = get().assetToBuy;
    if (assetToBuy && isSameAsset(asset, assetToBuy)) {
      set({ assetToBuy: null, assetToBuyPrice: 0 });
    }

    set({ assetToSell: asset, assetToSellPrice: asset.native.price?.amount ?? 0 });
  },
  setAssetToBuy: async (asset: ParsedSearchAsset) => {
    const currentAssetToBuy = get().assetToBuy;
    // Do nothing if the user is trying to set the same asset as what's already set
    if (currentAssetToBuy && isSameAsset(asset, currentAssetToBuy)) {
      return;
    }

    // NOTE: If the asset to buy is the same as the asset to sell, we need to clear the asset to sell
    const assetToSell = get().assetToSell;
    if (assetToSell && isSameAsset(asset, assetToSell)) {
      set({ assetToSell: null, assetToSellPrice: 0 });
    }

    set({ assetToBuy: asset, assetToBuyPrice: 0 });
  },
  setAssetToSellPrice: (price: number) => set({ assetToSellPrice: price }),
  setAssetToBuyPrice: (price: number) => set({ assetToBuyPrice: price }),
}));

type AssetPricePromise = Record<string, Promise<FormattedExternalAsset | null>>;

export const fetchAssetPrices = async () => {
  const promises: AssetPricePromise = {};

  const assetToSell = swapAssetStore.getState().assetToSell;
  if (assetToSell) {
    promises[assetToSell.uniqueId] = queryClient.fetchQuery<FormattedExternalAsset | null>(
      externalTokenQueryKey({
        address: assetToSell.address,
        network: ethereumUtils.getNetworkFromChainId(assetToSell.chainId),
        currency: NativeCurrencyKeys.USD,
      }),
      () =>
        fetchExternalToken({
          address: assetToSell.address,
          network: ethereumUtils.getNetworkFromChainId(assetToSell.chainId),
          currency: NativeCurrencyKeys.USD,
        }),
      {
        staleTime: Infinity,
      }
    );
  }

  const assetToBuy = swapAssetStore.getState().assetToBuy;
  if (assetToBuy) {
    promises[assetToBuy.uniqueId] = queryClient.fetchQuery<FormattedExternalAsset | null>(
      externalTokenQueryKey({
        address: assetToBuy.address,
        network: ethereumUtils.getNetworkFromChainId(assetToBuy.chainId),
        currency: NativeCurrencyKeys.USD,
      }),
      () =>
        fetchExternalToken({
          address: assetToBuy.address,
          network: ethereumUtils.getNetworkFromChainId(assetToBuy.chainId),
          currency: NativeCurrencyKeys.USD,
        }),
      {
        staleTime: Infinity,
      }
    );
  }

  const results = await Promise.all(
    Object.entries(promises).map(async ([uniqueId, promise]) => {
      const result = await promise;
      return { uniqueId, result };
    })
  );

  results.forEach(({ uniqueId, result }) => {
    if (!result) {
      logger.error(new RainbowError(`[swapAssetStore]: Failed to fetch asset price for asset ${uniqueId}`));
      return;
    }

    console.log(`[swapAssetStore]: Fetched price for ${result.name}: ${result.native.price.amount}`);

    if (assetToBuy?.uniqueId === uniqueId) {
      swapAssetStore.setState({
        assetToBuyPrice: Number(result.native.price.amount),
      });
    }

    if (assetToSell?.uniqueId === uniqueId) {
      swapAssetStore.setState({
        assetToSellPrice: Number(result.native.price.amount),
      });
    }
  });
};

/**
 * TODO:
 * 1. get price if assetToBuy => assetToSell
 * 2. trigger quote re-fetch if assetToSell && assetToBuy and inputAmount || outputAmount > 0
 * 3. if !assetToBuy after swapping, open the token list for the user to select a token
 * 4. if !assetToSell after swapping, open the user asset list for the user to select a token
 */
export const flipAssets = () => {
  const assetToSell = swapAssetStore.getState().assetToSell;
  const assetToBuy = swapAssetStore.getState().assetToBuy;

  const assetToSellPrice = swapAssetStore.getState().assetToSellPrice;
  const assetToBuyPrice = swapAssetStore.getState().assetToBuyPrice;

  // Always reset quote no matter what
  swapQuoteStore.setState({ quote: null });

  if (assetToSell) {
    swapAssetStore.setState({
      assetToBuy: assetToSell,
      assetToBuyPrice: assetToSellPrice,
    });
    swapSortByStore.setState({
      outputChainId: assetToSell.chainId,
    });
  } else {
    swapAssetStore.setState({
      assetToBuy: null,
      assetToBuyPrice: 0,
    });
  }

  if (assetToBuy) {
    swapAssetStore.setState({
      assetToSell: assetToBuy,
      assetToSellPrice: assetToBuyPrice,
    });
    swapSortByStore.setState({
      outputChainId: assetToBuy.chainId,
    });
  }

  const currentAssetToSell = swapAssetStore.getState().assetToSell;
  const currentAssetToBuy = swapAssetStore.getState().assetToBuy;
  if (currentAssetToSell && currentAssetToBuy) {
    // TODO: Fetch quote here?
  }
};

export const useSwapAssets = create(swapAssetStore);
