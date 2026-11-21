import { createDerivedStore } from '@storesjs/stores';

import { useHiddenNftsStore } from '@/features/nfts/data/hiddenNftsStore';
import { useNftMetadataStore } from '@/features/nfts/data/nftMetadataStore';
import { useShowcaseStore } from '@/features/nfts/data/showcaseStore';
import { useNftsStore } from '@/state/nfts/nfts';
import { useWalletsStore } from '@/state/wallets/walletsStore';

import { buildNftPreferences, buildNftRows } from './buildNftRows';

const EMPTY_TOKENS: string[] = [];

const useNftPreferences = createDerivedStore(
  $ => {
    const showcase = $(useShowcaseStore, s => s.getData() ?? EMPTY_TOKENS);
    const hidden = $(useHiddenNftsStore, s => s.getData() ?? EMPTY_TOKENS);
    return buildNftPreferences(showcase, hidden);
  },
  { lockDependencies: true }
);

/** Prepared wallet NFT rows, including showcase, hidden and loading sections. */
export const useWalletNftRows = createDerivedStore(
  $ => {
    const collections = $(useNftsStore, s => s.collections);
    const collectionNfts = $(useNftsStore, s => s.collectionNfts);
    const openCollections = $(useNftsStore, s => s.openCollections);
    const loading = $(useNftsStore, s => s.getStatus('isInitialLoad'));
    const hasMore = $(useNftsStore, s => !!s.nextPageKey);
    const metadata = $(useNftMetadataStore, s => s.nfts);
    const readOnly = $(useWalletsStore, s => s.getIsReadOnlyWallet());
    const preferences = $(useNftPreferences, s => s);

    return buildNftRows({ collections, collectionNfts, metadata, preferences, openCollections, loading, hasMore, readOnly });
  },
  { lockDependencies: true }
);
