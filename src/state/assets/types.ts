import { Address } from 'viem';
import { ParsedAddressAsset } from '@/entities';
import { SupportedCurrencyKey } from '@/references';
import { ChainId } from '@/state/backendNetworks/types';
import { QueryStoreState } from '@/state/internal/queryStore/types';
import { OptionallyPersistedRainbowStore } from '@/state/internal/types';
import { ParsedSearchAsset, UniqueId, UserAssetFilter } from '@/__swaps__/types/assets';
import { UserAssetsStateToPersist } from './persistence';

export type UserAssetsStoreType = OptionallyPersistedRainbowStore<
  QueryStoreState<TransformedUserAssetsData, UserAssetsParams, UserAssetsState>,
  UserAssetsStateToPersist
>;

export type UserAssetsRouter = UserAssetsStoreType & {
  getState(address?: Address | string): QueryEnabledUserAssetsState;
  setState(
    partial:
      | QueryEnabledUserAssetsState
      | Partial<QueryEnabledUserAssetsState>
      | ((state: QueryEnabledUserAssetsState) => QueryEnabledUserAssetsState | Partial<QueryEnabledUserAssetsState>),
    replace?: boolean,
    address?: Address | string
  ): void;
};

export type FetchedUserAssetsData = {
  chainIdsWithErrors: ChainId[] | null;
  userAssets: UserAsset[] | null;
} | null;

export type TransformedUserAssetsData = {
  chainIdsWithErrors: ChainId[] | null;
  userAssets: ParsedSearchAsset[] | null;
} | null;

export type UserAssetsParams = {
  address: Address | string;
  currency: SupportedCurrencyKey;
  testnetMode: boolean;
};

export type QueryEnabledUserAssetsState = ReturnType<UserAssetsStoreType['getState']>;

export interface UserAssetsState {
  address: Address | string;
  chainBalances: Map<ChainId, number>;
  currentAbortController: AbortController;
  filter: UserAssetFilter;
  hiddenAssets: Set<UniqueId>;
  hiddenAssetsBalance: string | null;
  idsByChain: Map<UserAssetFilter, UniqueId[]>;
  inputSearchQuery: string;
  legacyUserAssets: ParsedAddressAsset[];
  searchCache: Map<string, UniqueId[]>;
  userAssets: Map<UniqueId, ParsedSearchAsset>;
  getBalanceSortedChainList: () => ChainId[];
  getChainsWithBalance: () => ChainId[];
  getFilteredUserAssetIds: () => UniqueId[];
  getHiddenAssetsIds: () => UniqueId[];
  getHighestValueNativeAsset: () => ParsedSearchAsset | null;
  getLegacyUserAsset: (uniqueId: UniqueId) => ParsedAddressAsset | null;
  getNativeAssetForChain: (chainId: ChainId) => ParsedSearchAsset | null;
  /** Returns the total balance of the user's assets, or undefined if not yet loaded. */
  getTotalBalance: () => number | undefined;
  getUserAsset: (uniqueId: UniqueId) => ParsedSearchAsset | null;
  getUserAssets: () => ParsedSearchAsset[];
  selectUserAssetIds: (selector: (asset: ParsedSearchAsset) => boolean, filter?: UserAssetFilter) => Generator<UniqueId, void, unknown>;
  selectUserAssets: (selector: (asset: ParsedSearchAsset) => boolean) => Generator<[UniqueId, ParsedSearchAsset], void, unknown>;
  setHiddenAssets: (uniqueIds: UniqueId[]) => void;
  setSearchCache: (queryKey: string, filteredIds: UniqueId[]) => void;
  setSearchQuery: (query: string) => void;
  // TODO (kane): confirm that this is safe to remove
  // setUserAssets: ({
  //   address,
  //   chainIdsWithErrors,
  //   userAssets,
  //   state,
  // }: {
  //   address: Address | string;
  //   chainIdsWithErrors: ChainId[] | null;
  //   userAssets: ParsedSearchAsset[] | ParsedAssetsDictByChain | null;
  //   state: UserAssetsState | undefined;
  // }) => UserAssetsState | null;
}

export type Asset = {
  address: string;
  chainId: number;
  name: string;
  symbol: string;
  decimals: number;
  type: string;
  iconUrl?: string;
  network: string;
  verified: boolean;
  transferable: boolean;
  probableSpam?: boolean;
  creationDate?: string;
  colors: {
    primary: string;
    fallback?: string;
  };
  price: {
    value: number;
    changedAt: number;
    relativeChange24h: number;
  };
  networks: Record<
    string,
    {
      address: string;
      decimals: number;
    }
  >;
  bridging: {
    bridgeable: boolean;
    networks: Record<
      string,
      {
        bridgeable: boolean;
      }
    >;
  };
};

// same structre as ParsedAsset & ParsedUserAsset
export type EnrichedAsset = Asset & {
  balance: {
    amount: string;
    display: string;
  };
  native: {
    balance: {
      amount: string;
      display: string;
    };
    price?: {
      change: string;
      amount: number;
      display: string;
    };
  };
};

export type UserAsset = {
  asset: Asset;
  quantity: string;
  updatedAt: string;
  value: string;
  smallBalance?: boolean;
};

export type EnrichedUserAsset = UserAsset & {
  asset: EnrichedAsset;
};

export type GetAssetsResponse = {
  metadata: {
    requestTime: string;
    responseTime: string;
    requestId: string;
    currency: string;
    success: boolean;
    chainIdsWithErrors?: ChainId[];
  };
  result: Record<string, UserAsset>;
  errors: { chainId: ChainId; error: string }[];
};
