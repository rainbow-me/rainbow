import { useStore } from 'zustand';
import { createStore } from '@/state/internal/createStore';
import { SortMethod } from '@/__swaps__/types/swap';

export interface SwapSortByState {
  sortBy: SortMethod;
  setSortBy: (sortBy: SortMethod) => void;
}

export const swapSortByStore = createStore<SwapSortByState>(set => ({
  sortBy: SortMethod.token,
  setSortBy: sortBy => set({ sortBy }),
}));

export const useSwapSortByStore = () => useStore(swapSortByStore);
