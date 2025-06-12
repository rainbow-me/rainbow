import { createRainbowStore } from '@/state/internal/createRainbowStore';

export interface CoinListEditState {
  isCoinListEdited: boolean;
  selectedItems: string[];
  setIsCoinListEdited: (edited: boolean) => void;
  setSelectedItems: (items: string[]) => void;
}

export const useCoinListEditStore = createRainbowStore<CoinListEditState>(
  set => ({
    isCoinListEdited: false,
    selectedItems: [],
    setIsCoinListEdited: (edited: boolean) => set({ isCoinListEdited: edited }),
    setSelectedItems: (items: string[]) => set({ selectedItems: items }),
  })
);

export const getCoinListEditStore = () => useCoinListEditStore.getState();

// Static function exports for legacy compatibility
export const setIsCoinListEdited = (edited: boolean) => getCoinListEditStore().setIsCoinListEdited(edited);
export const setCoinListSelectedItems = (items: string[] | ((prev: string[]) => string[])) => {
  if (typeof items === 'function') {
    const currentItems = getCoinListEditStore().selectedItems;
    getCoinListEditStore().setSelectedItems(items(currentItems));
  } else {
    getCoinListEditStore().setSelectedItems(items);
  }
};