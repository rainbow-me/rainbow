import { createStore } from '@/state/internal/createStore';
import { useStore } from 'zustand';
import { ParsedSearchAsset } from '../types/assets';
import { SearchAsset } from '../types/search';
import { ChainId } from '@/__swaps__/screens/Swap/types/chains';

export interface AssetToBuyState {
  selectedAsset: ParsedSearchAsset | SearchAsset | undefined;
  derivedChainId: ChainId | undefined;
  setSelectedAsset: ({ asset }: { asset: ParsedSearchAsset | SearchAsset }) => void;
  clearSelectedAsset: () => void;
}

export const assetToBuyStore = createStore<AssetToBuyState>((set, get) => ({
  selectedAsset: undefined,
  derivedChainId: undefined,
  setSelectedAsset: ({ asset }) => {
    const currentAsset = get().selectedAsset;
    // prevent updating the asset to the same asset
    if (currentAsset?.uniqueId === asset.uniqueId) {
      return;
    }

    set({ selectedAsset: asset, derivedChainId: asset.chainId });
  },
  clearSelectedAsset: () => {
    set({ selectedAsset: undefined, derivedChainId: undefined });
  },
}));

export const useAssetToBuyStore = () => useStore(assetToBuyStore);
