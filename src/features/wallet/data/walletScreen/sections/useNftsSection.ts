import { createDerivedStore } from '@storesjs/stores';

import { type CellTypes } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { useHiddenNftsStore } from '@/features/nfts/data/hiddenNftsStore';
import { useShowcaseStore } from '@/features/nfts/data/showcaseStore';
import { useNftsStore } from '@/state/nfts/nfts';
import { useOpenCollectionsStore } from '@/state/nfts/openCollectionsStore';
import { useWalletsStore } from '@/state/wallets/walletsStore';

import { useEditTokensStore } from '../base/editStateStore';
import { buildNftRows } from './buildNftRows';

const EMPTY_ROWS: CellTypes[] = [];
const EMPTY_TOKENS: string[] = [];

export const useNftsSection = createNftSectionStore(false);
export const useSelectableNftsSection = createNftSectionStore(true);

function createNftSectionStore(selecting: boolean) {
  return createDerivedStore($ => {
    const editing = $(useEditTokensStore, state => state.isCoinListEdited);
    const collections = $(useNftsStore, state => state.collections);
    const loading = $(useNftsStore, state => state.getStatus('isInitialLoad'));
    const hasMore = $(useNftsStore, state => state.hasNextNftCollectionPage());
    const readOnly = $(useWalletsStore, state => state.getIsReadOnlyWallet());
    const openCollections = $(useOpenCollectionsStore, state => state.openCollections);
    const showcase = $(useShowcaseStore, state => state.getData() ?? EMPTY_TOKENS);
    const hidden = $(useHiddenNftsStore, state => state.getData() ?? EMPTY_TOKENS);

    if (editing && !selecting) return EMPTY_ROWS;
    return buildNftRows({
      collections,
      loading,
      hasMore,
      readOnly,
      openCollections,
      showcase,
      hidden,
      selecting,
    });
  });
}
