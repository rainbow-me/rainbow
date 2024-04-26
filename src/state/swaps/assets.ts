import { createStore } from '../internal/createStore';
import create from 'zustand';
import { ParsedSearchAsset } from '@/__swaps__/types/assets';
import { isSameAsset } from '@/__swaps__/utils/assets';

export interface SwapAssetsState {
  assetToSell: ParsedSearchAsset | null;
  assetToBuy: ParsedSearchAsset | null;
  assetToSellPrice: number;
  assetToBuyPrice: number;

  inputAmount: number | string;
  outputAmount: number | string;

  assetToSellColor: string;
  assetToBuyColor: string;

  assetToSellSymbol: string;
  assetToBuySymbol: string;

  setAssetToSell: (asset: ParsedSearchAsset) => void;
  setAssetToBuy: (asset: ParsedSearchAsset) => void;
  setAssetToSellPrice: (price: number) => void;
  setAssetToBuyPrice: (price: number) => void;
  setInputAmount: (amount: number | string) => void;
  setOutputAmount: (amount: number | string) => void;
}

export const swapAssetStore = createStore<SwapAssetsState>(
  (set, get) => ({
    assetToSell: null,
    assetToBuy: null,
    assetToSellPrice: 0,
    assetToBuyPrice: 0,
    inputAmount: 0,
    outputAmount: 0,
    assetToSellColor: '',
    assetToBuyColor: '',
    assetToSellSymbol: '',
    assetToBuySymbol: '',

    setAssetToSell: (asset: ParsedSearchAsset) => {
      // NOTE: If the asset to sell is the same as the asset to buy, we need to clear the asset to buy
      const assetToBuy = get().assetToBuy;
      if (assetToBuy && isSameAsset(asset, assetToBuy)) {
        set({ assetToBuy: null, assetToBuyPrice: 0 });
      }

      set({ assetToSell: asset, assetToSellPrice: 0 });
    },
    setAssetToBuy: (asset: ParsedSearchAsset) => set({ assetToBuy: asset }),
    setAssetToSellPrice: (price: number) => set({ assetToSellPrice: price }),
    setAssetToBuyPrice: (price: number) => set({ assetToBuyPrice: price }),
    setInputAmount: (amount: number | string) => set({ inputAmount: amount }),
    setOutputAmount: (amount: number | string) => set({ outputAmount: amount }),
  }),
  {
    persist: {
      name: 'swapAssets',
      version: 1,
    },
  }
);

export const useSwapAssets = create(swapAssetStore);
