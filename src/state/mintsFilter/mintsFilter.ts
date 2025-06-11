import { createRainbowStore } from '@/state/internal/createRainbowStore';

export enum MintsFilter {
  All = 'all',
  Paid = 'paid',
  Free = 'free',
}

export interface MintsFilterState {
  filter: MintsFilter;
  setFilter: (filter: MintsFilter) => void;
}

export const useMintsFilterStore = createRainbowStore<MintsFilterState>(
  set => ({
    filter: MintsFilter.All,
    setFilter: (filter: MintsFilter) => set({ filter }),
  }),
  {
    storageKey: 'mintsFilter',
    version: 0,
  }
);

export const getMintsFilterStore = () => useMintsFilterStore.getState();