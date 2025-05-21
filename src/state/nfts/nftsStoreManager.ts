import { Address } from 'viem';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { NftCollectionSortCriterion, SortDirection } from '@/graphql/__generated__/arc';
import { NftsStoreType } from './types';

interface NftsStoreManagerState {
  address: Address | string | null;
  cachedStore: NftsStoreType | null;
  sortBy: NftCollectionSortCriterion;
  sortDirection: SortDirection;
  setSortBy: (sortBy: NftCollectionSortCriterion) => void;
  setSortDirection: (sortDirection: SortDirection) => void;
}

export const nftsStoreManager = createRainbowStore<NftsStoreManagerState>(
  set => ({
    address: null,
    cachedStore: null,
    sortBy: NftCollectionSortCriterion.MostRecent,
    sortDirection: SortDirection.Desc,
    setSortBy: (sortBy: NftCollectionSortCriterion) => set({ sortBy }),
    setSortDirection: (sortDirection: SortDirection) => set({ sortDirection }),
  }),
  {
    partialize: state => ({
      address: state.address,
      sortBy: state.sortBy,
      sortDirection: state.sortDirection,
    }),
    storageKey: 'nftsStoreManager',
    version: 1,
  }
);
