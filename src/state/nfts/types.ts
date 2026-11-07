import { type OptionallyPersistedStore, type QueryStoreState } from '@storesjs/stores';
import { type Address } from 'viem';

import type { UniqueAsset } from '@/entities/uniqueAssets';

export type CollectionId = string;
export type UniqueId = string;
export type CollectionName = string | 'Showcase';

export type NftParams = {
  walletAddress: Address | string;
  limit: number;
  pageKey: string | null;
  collectionId?: CollectionId;
};

export type PaginationInfo = {
  pageKey: string | null;
  hasNext: boolean;
  total_elements?: number;
};

/** A collection summary and, when fetched, its complete ordered ownership result. */
export type Collection = {
  id: CollectionId;
  name: string;
  imageUrl: string | null | undefined;
  totalCount: string;
  nfts?: { ids: UniqueId[]; fetchedAt: number };
};

/** Parsed summary pages or token metadata. The collection action establishes owned IDs. */
export type NftsQueryData =
  | {
      kind: 'page';
      collections: Map<CollectionId, Collection>;
      pagination: PaginationInfo | null;
    }
  | { kind: 'tokens'; nfts: Map<UniqueId, UniqueAsset> };

export interface NftsState {
  collections: Map<CollectionId, Collection>;
  nfts: Map<UniqueId, UniqueAsset>;
  fetchedPages: { [pageKey: string]: number };
  pagination: PaginationInfo | null;
  fetchNextNftCollectionPage: () => Promise<void>;
  fetchNftCollection: (collectionId: CollectionId, force?: boolean) => Promise<void>;
  getNftCollections: () => Map<CollectionId, Collection> | null;
  getNftCollection: (collectionId: CollectionId) => Collection | null;
  getNftByUniqueId: (uniqueId: UniqueId) => UniqueAsset | null;
  getNft: (collectionId: CollectionId, index: number) => UniqueAsset | null;
  getNftPaginationInfo: () => PaginationInfo | null;
  hasNextNftCollectionPage: () => boolean;
  getCurrentNftCollectionPageKey: () => string | null;
  getNextNftCollectionPageKey: () => string | null;
}

export type NftsStoreType = OptionallyPersistedStore<QueryStoreState<NftsQueryData, NftParams, NftsState>, PersistedNftsState>;

export interface OpenCollectionsState {
  openCollections: Record<CollectionId, boolean>;
  insertionOrder: CollectionId[]; // Tracks the order in which collections were opened
  toggleCollection: (collectionIdOrLegacyName: CollectionId | CollectionName) => boolean;
  isCollectionOpen: (collectionIdOrLegacyName: CollectionId | CollectionName) => boolean;
  setCollectionOpen: (collectionIdOrLegacyName: CollectionId | CollectionName, isOpen: boolean) => void;
}

export type OpenCollectionsStoreType = OptionallyPersistedStore<OpenCollectionsState, Partial<OpenCollectionsState>>;

/** Stored parsed data. The legacy nested map is accepted only by the version migration. */
export type PersistedNftsState = Partial<Pick<NftsState, 'collections' | 'nfts' | 'fetchedPages' | 'pagination'>> & {
  nftsByCollection?: Map<CollectionId, Map<UniqueId, UniqueAsset>>;
};
