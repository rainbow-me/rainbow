import { createDerivedStore } from '@storesjs/stores';

import { type NftCell } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { useNftsStore } from '@/state/nfts/nfts';

import { appendNftCollectionRows } from './appendNftCollectionRows';

/** The selected wallet's collection headers and selectable NFTs, without saved-token exclusions. */
export const useSelectableNftRows = createDerivedStore(
  $ => {
    const collections = $(useNftsStore, s => s.collections);
    const collectionNfts = $(useNftsStore, s => s.collectionNfts);
    const openCollections = $(useNftsStore, s => s.openCollections);

    const rows: NftCell[] = [];
    appendNftCollectionRows(rows, collections, openCollections, collectionNfts);
    return rows;
  },
  { lockDependencies: true }
);
