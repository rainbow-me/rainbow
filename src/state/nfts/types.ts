import { Address } from 'viem';
import { UniqueAsset } from '@/entities';
import { NftCollectionSortCriterion, SortDirection } from '@/graphql/__generated__/arc';
import { QueryStoreState } from '@/state/internal/queryStore/types';
import { OptionallyPersistedRainbowStore } from '@/state/internal/types';

export type CollectionId = string;
export type UniqueId = string;
export type CollectionName = string | 'Showcase';

export type NftParams = {
  walletAddress: Address | string;
  sortBy: NftCollectionSortCriterion;
  sortDirection: SortDirection;
};

export type NftStore = {
  collections: Map<CollectionId, Collection>;
};

export type Collection = {
  uniqueId: string;
  image: string | null | undefined;
  name: string;
  total: string;
};

export interface NftsState {
  address: Address | string;
  nftsByCollection: Map<CollectionId, Map<UniqueId, UniqueAsset>>;
  collections: Map<CollectionId, Collection>;
  getCollection: (name: CollectionName) => Collection | undefined;
  getCollections: () => Collection[];
  getNftsByCollection: (collectionName: CollectionName) => Map<UniqueId, UniqueAsset> | undefined;
  getNft: (collectionName: CollectionName, uniqueId: UniqueId) => UniqueAsset | undefined;
}

export type NftsStateRequiredForPersistence = Pick<NftsState, 'nftsByCollection' | 'collections'>;

export type NftsStoreType = OptionallyPersistedRainbowStore<
  QueryStoreState<NftStore, NftParams, NftsState>,
  Partial<NftsStateRequiredForPersistence>
>;

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
