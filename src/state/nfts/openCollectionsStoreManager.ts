import { createBaseStore } from '@storesjs/stores';
import { type Address } from 'viem';

import { type OpenCollectionsStoreType } from './types';

interface OpenCollectionsStoreManagerState {
  address: Address | string | null;
  cachedStore: OpenCollectionsStoreType | null;
}

export const openCollectionsStoreManager = createBaseStore<OpenCollectionsStoreManagerState>(
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
