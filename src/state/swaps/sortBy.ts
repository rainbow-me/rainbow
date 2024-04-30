import { create } from 'zustand';
import { createStore } from '@/state/internal/createStore';
import { UserAssetFilter } from '@/__swaps__/types/assets';
import { ChainId } from '@/__swaps__/types/chains';

export interface SwapSortByState {
  sortBy: UserAssetFilter;
  outputChainId: ChainId;
  setSortBy: (sortBy: UserAssetFilter) => void;
  setOutputChainId: (chainId: ChainId) => void;
}

export const swapSortByStore = createStore<SwapSortByState>(set => ({
  sortBy: 'all',
  outputChainId: ChainId.mainnet,
  setSortBy: sortBy => set({ sortBy }),
  setOutputChainId: chainId => set({ outputChainId: chainId }),
}));

export const useSwapSortByStore = create(swapSortByStore);
