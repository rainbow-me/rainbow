import { createStore } from '../internal/createStore';
import create from 'zustand';
import { ParsedSearchAsset } from '@/__swaps__/types/assets';
import { isSameAsset } from '@/__swaps__/utils/assets';

export interface SwapAssetsState {
  assetToSell: ParsedSearchAsset | null;
  assetToBuy: ParsedSearchAsset | null;
  assetToSellPrice: number;
  assetToBuyPrice: number;

  setAssetToSell: (asset: ParsedSearchAsset) => void;
  setAssetToBuy: (asset: ParsedSearchAsset) => void;
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

    set({ assetToSell: asset, assetToSellPrice: 0 });
  },
  setAssetToBuy: (asset: ParsedSearchAsset) => {
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

export const useSwapAssets = create(swapAssetStore);
