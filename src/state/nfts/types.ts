import { Address } from 'viem';
import { UniqueAsset } from '@/entities';
import { NftCollectionSortCriterion, SortDirection } from '@/graphql/__generated__/arc';
import { QueryStoreState } from '@/state/internal/queryStore/types';
import { OptionallyPersistedRainbowStore } from '@/state/internal/types';

export type UniqueId = string;

export type NftParams = {
  walletAddress: Address | string;
  sortBy: NftCollectionSortCriterion;
  sortDirection: SortDirection;
};

export type NftStore = {
  nfts: Map<UniqueId, UniqueAsset>;
};

export interface NftsState {
  address: Address | string;
  nfts: Map<UniqueId, UniqueAsset>;
  getNft: (uniqueId: UniqueId) => UniqueAsset | null;
  getNfts: () => UniqueAsset[];
  getUniqueIds: () => UniqueId[];
}

export type NftsStoreType = OptionallyPersistedRainbowStore<QueryStoreState<NftStore, NftParams, NftsState>, Partial<NftsState>>;

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
