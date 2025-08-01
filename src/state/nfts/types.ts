import { Address } from 'viem';
import { QueryStoreState } from '@/state/internal/queryStore/types';
import { OptionallyPersistedRainbowStore } from '@/state/internal/types';
import { UniqueAsset } from '@/entities';

export type CollectionId = string;
export type UniqueId = string;
export type CollectionName = string | 'Showcase';

export type NftParams = {
  walletAddress: Address | string;
  limit: number;
  pageKey: string | null;
  collectionId?: CollectionId;
  isMigration?: boolean;
};

export type PaginationInfo = {
  pageKey: string | null;
  hasNext: boolean;
  total_elements?: number;
};

export type NftsQueryData = {
  collections: Map<CollectionId, Collection>;
  nftsByCollection: Map<CollectionId, Map<UniqueId, UniqueAsset>>;
  pagination: PaginationInfo | null;
};

export type Collection = {
  id: CollectionId;
  name: string;
  imageUrl: string | null | undefined;
  totalCount: string;
};

export type NftsByCollection = Map<CollectionId, Map<UniqueId, UniqueAsset>>;

export interface NftsState {
  collections: Map<CollectionId, Collection>;
  nftsByCollection: NftsByCollection;
  fetchedPages: { [pageKey: string]: number };
  fetchedCollections: { [collectionId: string]: number };
  pagination: PaginationInfo | null;
  fetchNextNftCollectionPage: () => Promise<void>;
  fetchNftCollection: (collectionId: CollectionId, force?: boolean) => Promise<void>;
  getNftCollections: () => Map<CollectionId, Collection> | null;
  getNftCollection: (collectionId: CollectionId) => Collection | null;
  getNftsByCollection: (collectionId: CollectionId) => Map<UniqueId, UniqueAsset> | null;
  getNftByUniqueId: (collectionId: CollectionId, uniqueId: UniqueId) => UniqueAsset | null;
  getNft: (collectionId: CollectionId, index: number) => UniqueAsset | null;
  getNftPaginationInfo: () => PaginationInfo | null;
  hasNextNftCollectionPage: () => boolean;
  getCurrentNftCollectionPageKey: () => string | null;
  getNextNftCollectionPageKey: () => string | null;
}

export type NftsStoreType = OptionallyPersistedRainbowStore<QueryStoreState<NftsQueryData, NftParams, NftsState>, Partial<NftsState>>;

export type QueryEnabledNftsState = ReturnType<NftsStoreType['getState']>;

export type NftsRouter = NftsStoreType & {
  getState(address?: Address | string): QueryEnabledNftsState;
  setState(
    partial:
      | QueryEnabledNftsState
      | Partial<QueryEnabledNftsState>
      | ((state: QueryEnabledNftsState) => QueryEnabledNftsState | Partial<QueryEnabledNftsState>),
    replace?: boolean,
    address?: Address | string
  ): void;
};

export interface OpenCollectionsState {
  openCollections: Record<CollectionId, boolean>;
  insertionOrder: CollectionId[]; // Tracks the order in which collections were opened
  toggleCollection: (collectionIdOrLegacyName: CollectionId | CollectionName) => void;
  isCollectionOpen: (collectionIdOrLegacyName: CollectionId | CollectionName) => boolean;
  setCollectionOpen: (collectionIdOrLegacyName: CollectionId | CollectionName, isOpen: boolean) => void;
}

export type OpenCollectionsStoreType = OptionallyPersistedRainbowStore<OpenCollectionsState, Partial<OpenCollectionsState>>;

export type OpenCollectionsRouter = OpenCollectionsStoreType & {
  getState(address?: Address | string): OpenCollectionsState;
  setState(
    partial:
      | OpenCollectionsState
      | Partial<OpenCollectionsState>
      | ((state: OpenCollectionsState) => OpenCollectionsState | Partial<OpenCollectionsState>),
    replace?: boolean,
    address?: Address | string
  ): void;
};
