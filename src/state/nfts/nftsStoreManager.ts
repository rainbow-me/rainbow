import { Address } from 'viem';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { NftCollectionSortCriterion, SortDirection } from '@/graphql/__generated__/arc';
import { NftsStoreType } from './types';

interface NftsStoreManagerState {
  address: Address | string | null;
  cachedStore: NftsStoreType | null;
  sortBy: NftCollectionSortCriterion;
  sortDirection: SortDirection;
  updateSort: (sort: NftSort) => void;
}

export type NftSort = `${NftCollectionSortCriterion}|${SortDirection}`;

export const nftsStoreManager = createRainbowStore<NftsStoreManagerState>(
  set => ({
    address: null,
    cachedStore: null,
    sortBy: NftCollectionSortCriterion.MostRecent,
    sortDirection: SortDirection.Desc,
    updateSort: (sort: NftSort) => {
      const [sortBy, sortDirection] = sort.split('|');
      set({ sortBy: sortBy as NftCollectionSortCriterion, sortDirection: sortDirection as SortDirection });
    },
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
