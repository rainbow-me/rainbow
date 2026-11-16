import { createBaseStore } from '@storesjs/stores';
import { isAddress, type Address } from 'viem';

import { parseUniqueId } from '@/features/nfts/core/uniqueId';

import { type OpenCollectionsState, type OpenCollectionsStoreType } from './types';

const MAX_OPEN_COLLECTIONS = 20;

/**
 * Persists open collections. Opening a twenty-first wallet collection closes the oldest.
 */
export function createOpenCollectionsStore(address: Address | string): OpenCollectionsStoreType {
  return createBaseStore<OpenCollectionsState>(
    (set, get) => ({
      openCollections: { showcase: true },

      isCollectionOpen: key => !!get().openCollections[key.toLowerCase()],

      toggleCollection: key => {
        const isOpen = !get().isCollectionOpen(key);
        get().setCollectionOpen(key, isOpen);
        return isOpen;
      },

      setCollectionOpen: (key, isOpen) =>
        set(state => {
          const id = key.toLowerCase();
          if (!!state.openCollections[id] === isOpen) return state;

          const openCollections = { ...state.openCollections };
          if (!isOpen) {
            delete openCollections[id];
            return { openCollections };
          }

          openCollections[id] = true;
          if (isWalletCollection(id)) {
            let count = 0;
            let oldest: string | undefined;
            for (const key in openCollections) {
              if (!openCollections[key] || !isWalletCollection(key)) continue;
              oldest ??= key;
              count += 1;
              if (count > MAX_OPEN_COLLECTIONS) {
                delete openCollections[oldest];
                break;
              }
            }
          }

          return { openCollections };
        }),
    }),
    address
      ? {
          storageKey: `open-collections_${address.toLowerCase()}`,
          version: 1,
          partialize: state => ({ openCollections: state.openCollections }),
        }
      : undefined
  );
}

function isWalletCollection(key: string): boolean {
  const { network, contractAddress } = parseUniqueId(key);
  return !!network && isAddress(contractAddress);
}
