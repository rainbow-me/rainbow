import { createDerivedStore } from '@storesjs/stores';

import { type NftCell } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { useNftsStore } from '@/state/nfts/nfts';
import { useOpenCollectionsStore } from '@/state/nfts/openCollectionsStore';

import { appendNftCollectionRows } from './appendNftCollectionRows';
import { useNftCollectionAssets } from './nftCollectionAssetsStore';

export const useSelectableNftRows = createDerivedStore(
  $ => {
    const collections = $(useNftsStore, s => s.collections);
    const collectionNfts = $(useNftCollectionAssets, s => s);
    const openCollections = $(useOpenCollectionsStore, s => s.openCollections);

    const rows: NftCell[] = [];
    appendNftCollectionRows(rows, collections, openCollections, collectionNfts);
    return rows;
  },
  { lockDependencies: true }
);
