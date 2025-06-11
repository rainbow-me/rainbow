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

// export static functions
export const { setIsCoinListEdited, setSelectedItems } = useCoinListEditStore.getState();