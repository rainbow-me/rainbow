import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { SortCriterion } from '@/graphql/__generated__/arc';

export interface NFTOffersState {
  sortCriterion: SortCriterion;
  setSortCriterion: (criterion: SortCriterion) => void;
}

export const useNFTOffersStore = createRainbowStore<NFTOffersState>(
  set => ({
    sortCriterion: SortCriterion.TopBidValue,
    setSortCriterion: (criterion: SortCriterion) => set({ sortCriterion: criterion }),
  }),
  {
    storageKey: 'nftOffers',
    version: 0,
  }
);

// export static functions
export const { setSortCriterion } = useNFTOffersStore.getState();