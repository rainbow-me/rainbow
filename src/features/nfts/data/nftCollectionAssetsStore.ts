import { createDerivedStore, shallowEqual } from '@storesjs/stores';

import { useNftsStore } from '@/state/nfts/nfts';
import { useOpenCollectionsStore } from '@/state/nfts/openCollectionsStore';
import { useWalletsStore } from '@/state/wallets/walletsStore';

import { useCollectionNftsStore, type CollectionNfts } from './collectionNftsStore';

/**
 * Reads cached collection assets and keeps open collections in the refresh set.
 */
export const useNftCollectionAssets = createDerivedStore(
  $ => {
    const walletAddress = $(useWalletsStore, s => s.accountAddress);
    const openCollections = $(useOpenCollectionsStore, s => s.openCollections);
    const summaries = $(useNftsStore, s => s.collections);
    $(useCollectionNftsStore, s => s.queryCache);

    const cached = useCollectionNftsStore.getState();
    const collections = new Map<string, CollectionNfts>();

    for (const collectionId of summaries.keys()) {
      const params = { walletAddress, collectionId };
      const nfts = openCollections[collectionId] ? $(useCollectionNftsStore, s => s.get(params)) : cached.get(params);
      if (nfts) collections.set(collectionId, nfts);
    }

    return collections;
  },
  { equalityFn: shallowEqual }
);
