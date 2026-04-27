import { createBaseStore } from '@storesjs/stores';

import { DEFAULT_CATEGORY_KEY } from '@/features/polymarket/constants';

type PolymarketCategoryStoreState = {
  tagId: string;
  setTagId: (tagId: string) => void;
};

export const usePolymarketCategoryStore = createBaseStore<PolymarketCategoryStoreState>(
  set => ({
    tagId: DEFAULT_CATEGORY_KEY,
    setTagId: (tagId: string) => set({ tagId }),
  }),
  { storageKey: 'polymarketCategoryStore' }
);
