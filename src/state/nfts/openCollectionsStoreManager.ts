import { type Address } from 'viem';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { type OpenCollectionsStoreType } from './types';

interface OpenCollectionsStoreManagerState {
  address: Address | string | null;
  cachedStore: OpenCollectionsStoreType | null;
}

export const openCollectionsStoreManager = createRainbowStore<OpenCollectionsStoreManagerState>(
  () => ({
    address: null,
    cachedStore: null,
  }),
  {
    partialize: state => ({
      address: state.address,
    }),
    storageKey: 'openCollectionsStoreManager',
    version: 1,
  }
);
