import { useStore } from 'zustand';
import { createStore } from '@/state/internal/createStore';
import { ParsedSearchAsset } from '@/__swaps__/types/assets';
import { ChainId } from '@/__swaps__/types/chains';
import { SortMethod } from '@/__swaps__/types/swap';

export interface SwapAssetState {
  assetToSell: ParsedSearchAsset | null;
  assetToBuy: ParsedSearchAsset | null;
  outputChainId: ChainId;
  sortMethod: SortMethod;
  searchFilter: string;
  setAssetToSell: (asset: ParsedSearchAsset) => void;
  setAssetToBuy: (asset: ParsedSearchAsset) => void;
  setOutputChainId: (chainId: ChainId) => void;
  setSortMethod: (sortMethod: SortMethod) => void;
  setSearchFilter: (searchFilter: string) => void;
}

export const swapAssetStore = createStore<SwapAssetState>((set, get) => ({
  assetToSell: null, // TODO: Default to their largest balance asset (or ETH mainnet if user has no assets)
  assetToBuy: null,
  outputChainId: ChainId.mainnet,
  sortMethod: SortMethod.token,
  searchFilter: '',

  setAssetToSell(asset) {
    const assetToBuy = get().assetToBuy;
    const prevAssetToSell = get().assetToSell;

    // if the asset to buy is the same as the asset to sell, then clear the asset to buy
    if (assetToBuy && asset && assetToBuy.address === asset.address && assetToBuy.chainId === asset.chainId) {
      set({ assetToBuy: prevAssetToSell === undefined ? undefined : prevAssetToSell });
    }

    set({ assetToSell: asset, outputChainId: asset.chainId });
  },

  setAssetToBuy(asset) {
    const currentAsset = get().assetToBuy;
    const currentAssetToSell = get().assetToSell;
    // prevent updating the asset to the same asset
    if (currentAsset?.uniqueId === asset.uniqueId) {
      return;
    }

    if (currentAssetToSell && asset && currentAssetToSell.address === asset.address && currentAssetToSell.chainId === asset.chainId) {
      return;
    }

    set({ assetToBuy: asset, outputChainId: asset.chainId });
  },

  setOutputChainId(chainId) {
    set({ outputChainId: chainId });
  },

  setSortMethod(sortMethod) {
    set({ sortMethod });
  },

  setSearchFilter(searchFilter) {
    set({ searchFilter });
  },
}));

export const useSwapAssetStore = () => useStore(swapAssetStore);
