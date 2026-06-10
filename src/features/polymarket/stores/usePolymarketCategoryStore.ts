import { DEFAULT_CATEGORY_KEY, type CategoryKey } from '@/features/polymarket/constants';
import { createRainbowStore } from '@/state/internal/createRainbowStore';

type PolymarketCategoryStoreState = {
  tagId: CategoryKey;
  setTagId: (tagId: CategoryKey) => void;
};

export const usePolymarketCategoryStore = createRainbowStore<PolymarketCategoryStoreState>(
  set => ({
    tagId: DEFAULT_CATEGORY_KEY,
    setTagId: (tagId: CategoryKey) => set({ tagId }),
  }),
  { storageKey: 'polymarketCategoryStore' }
);
