import { Address } from 'viem';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { NftCollectionSortCriterion, SortDirection } from '@/graphql/__generated__/arc';
import { NftsStoreType } from './types';

interface NftsStoreManagerState {
  address: Address | string | null;
  cachedStore: NftsStoreType | null;
}

export type NftSort = `${NftCollectionSortCriterion}|${SortDirection}`;

export const nftsStoreManager = createRainbowStore<NftsStoreManagerState>(
  () => ({
    address: null,
    cachedStore: null,
  }),
  {
    partialize: state => ({
      address: state.address,
    }),
    storageKey: 'nftsStoreManager',
    version: 1,
  }
);
