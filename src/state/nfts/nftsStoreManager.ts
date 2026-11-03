import { createBaseStore } from '@storesjs/stores';
import { type Address } from 'viem';

import { type NftsStoreType } from './types';

interface NftsStoreManagerState {
  address: Address | string | null;
  cachedStore: NftsStoreType | null;
}

export const nftsStoreManager = createBaseStore<NftsStoreManagerState>(
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
