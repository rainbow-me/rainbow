import { createRainbowStore } from '@/state/internal/createRainbowStore';

export interface SmallBalancesState {
  areOpenSmallBalances: boolean;
  toggleOpenSmallBalances: () => void;
}

export const useSmallBalancesStore = createRainbowStore<SmallBalancesState>(
  (set, get) => ({
    areOpenSmallBalances: false,
    toggleOpenSmallBalances: () => set({ areOpenSmallBalances: !get().areOpenSmallBalances }),
  })
);

export const getSmallBalancesStore = () => useSmallBalancesStore.getState();