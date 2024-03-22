import { createStore } from '@/state/internal/createStore';
import { useStore } from 'zustand';
import { ParsedSearchAsset } from '../types/assets';
import { SearchAsset } from '../types/search';
import { ChainId } from '@/__swaps__/screens/Swap/types/chains';

export interface AssetToSellState {
  selectedAsset: ParsedSearchAsset | SearchAsset;
  derivedChainId: ChainId | undefined;
  setSelectedAsset: ({ asset }: { asset: ParsedSearchAsset | SearchAsset }) => void;
  clearSelectedAsset: () => void;
}

export const assetToSellStore = (initialAsset: ParsedSearchAsset | SearchAsset) =>
  createStore<AssetToSellState>((set, get) => ({
    selectedAsset: initialAsset,
    derivedChainId: initialAsset.chainId,
    setSelectedAsset: ({ asset }) => {
      const currentAsset = get().selectedAsset;
      // prevent updating the asset to the same asset
      if (currentAsset?.uniqueId === asset.uniqueId) {
        return;
      }

      set({ selectedAsset: asset, derivedChainId: asset.chainId });
    },
    clearSelectedAsset: () => {
      set({ selectedAsset: undefined, derivedChainId: ChainId.mainnet });
    },
  }));

export const useAssetToSellStore = (initialAsset: ParsedSearchAsset | SearchAsset) => useStore(assetToSellStore(initialAsset));
