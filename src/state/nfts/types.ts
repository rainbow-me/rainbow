import { type OptionallyPersistedStore, type QueryStoreState } from '@storesjs/stores';
import { type Address } from 'viem';

import { type GetNftCollectionsQuery } from '@/graphql/__generated__/arc';

export type NftParams = {
  walletAddress: Address | string;
  limit: number;
  pageKey: string | null;
};

export type FetchedNftCollections = GetNftCollectionsQuery['nftCollections'];
export type Collection = NonNullable<NonNullable<FetchedNftCollections>['data'][number]>;

export interface NftsState {
  collections: Map<string, Collection>;
  nextPageKey: string | null;
  lastPageFetchedAt: number;
  fetchNextNftCollectionPage: () => Promise<void>;
  hasNextNftCollectionPage: () => boolean;
}

export type NftsStoreType = OptionallyPersistedStore<QueryStoreState<FetchedNftCollections, NftParams, NftsState>, PersistedNftsState>;

export interface OpenCollectionsState {
  openCollections: Record<string, boolean>;
  toggleCollection: (collectionKey: string) => boolean;
  isCollectionOpen: (collectionKey: string) => boolean;
  setCollectionOpen: (collectionKey: string, isOpen: boolean) => void;
}

export type OpenCollectionsStoreType = OptionallyPersistedStore<OpenCollectionsState, Partial<OpenCollectionsState>>;

export type PersistedNftsState = Pick<NftsState, 'collections' | 'lastPageFetchedAt' | 'nextPageKey'>;
