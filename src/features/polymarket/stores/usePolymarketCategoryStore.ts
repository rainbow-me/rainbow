import { createBaseStore } from '@storesjs/stores';

import { DEFAULT_CATEGORY_KEY, type CategoryKey } from '@/features/polymarket/constants';

type PolymarketCategoryStoreState = {
  tagId: CategoryKey;
  setTagId: (tagId: CategoryKey) => void;
};

export const usePolymarketCategoryStore = createBaseStore<PolymarketCategoryStoreState>(
  set => ({
    tagId: DEFAULT_CATEGORY_KEY,
    setTagId: (tagId: CategoryKey) => set({ tagId }),
  }),
  { storageKey: 'polymarketCategoryStore' }
);
