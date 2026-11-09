import { createBaseStore, createStoreActions } from '@storesjs/stores';

type SelectedCoinsState = {
  selectedItems: string[];
  clearSelectedCoins: () => void;
  pushSelectedCoin: (uniqueId: string) => void;
  removeSelectedCoin: (uniqueId: string) => void;
  toggleSelectedCoin: (uniqueId: string) => void;
};

const INITIAL_SELECTED_ITEMS: string[] = [];

export const useSelectedCoinsStore = createBaseStore<SelectedCoinsState>(set => ({
  selectedItems: INITIAL_SELECTED_ITEMS,

  clearSelectedCoins: () => set({ selectedItems: INITIAL_SELECTED_ITEMS }),

  pushSelectedCoin: uniqueId =>
    set(state => ({
      selectedItems: state.selectedItems.filter(id => id !== uniqueId).concat(uniqueId),
    })),

  removeSelectedCoin: uniqueId =>
    set(state => ({
      selectedItems: state.selectedItems.filter(id => id !== uniqueId),
    })),

  toggleSelectedCoin: uniqueId =>
    set(state => ({
      selectedItems: state.selectedItems.includes(uniqueId)
        ? state.selectedItems.filter(id => id !== uniqueId)
        : [...state.selectedItems, uniqueId],
    })),
}));

export const selectedCoinsActions = createStoreActions(useSelectedCoinsStore);
