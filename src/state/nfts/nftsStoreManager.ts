import { type Address } from 'viem';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { type NftCollectionSortCriterion, type SortDirection } from '@/graphql/__generated__/arc';
import { type NftsStoreType } from './types';

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
