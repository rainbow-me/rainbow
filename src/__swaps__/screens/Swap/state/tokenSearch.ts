import { createStore } from '@/state/internal/createStore';
import { useStore } from 'zustand';

export interface TokenSearchState {
  searchQuery: string;
}

export const tokenSearchStore = createStore<TokenSearchState>(set => ({
  searchQuery: '',
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },
}));

export const useTokenSearchStore = () => useStore(tokenSearchStore);
