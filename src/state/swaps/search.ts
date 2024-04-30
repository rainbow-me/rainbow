import { create } from 'zustand';
import { createStore } from '@/state/internal/createStore';

export interface SwapSearchState {
  query: string;
  setQuery: (query: string) => void;
}

export const swapSearchStore = createStore<SwapSearchState>(set => ({
  query: '',
  setQuery: query => set({ query }),
}));

export const useSwapSearchStore = create(swapSearchStore);
