import { Address } from 'viem';
import { ParsedAddressAsset } from '@/entities';
import { SupportedCurrencyKey } from '@/references';
import { ChainId } from '@/state/backendNetworks/types';
import { QueryStoreState } from '@/state/internal/queryStore/types';
import { OptionallyPersistedRainbowStore } from '@/state/internal/types';
import { ParsedAssetsDictByChain, ParsedSearchAsset, UniqueId, UserAssetFilter } from '@/__swaps__/types/assets';
import { UserAssetsStateToPersist } from './persistence';
import { LiveTokensData } from '../liveTokens/liveTokensStore';

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
  parsedAssetsDict: ParsedAssetsDictByChain | null;
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
  getTotalBalance: () => number;
  getUserAsset: (uniqueId: UniqueId) => ParsedSearchAsset | null;
  getUserAssets: () => ParsedSearchAsset[];
  selectUserAssetIds: (selector: (asset: ParsedSearchAsset) => boolean, filter?: UserAssetFilter) => Generator<UniqueId, void, unknown>;
  selectUserAssets: (selector: (asset: ParsedSearchAsset) => boolean) => Generator<[UniqueId, ParsedSearchAsset], void, unknown>;
  setHiddenAssets: (uniqueIds: UniqueId[]) => void;
  setSearchCache: (queryKey: string, filteredIds: UniqueId[]) => void;
  setSearchQuery: (query: string) => void;
  setUserAssets: ({
    address,
    chainIdsWithErrors,
    userAssets,
    state,
  }: {
    address: Address | string;
    chainIdsWithErrors: ChainId[] | null;
    userAssets: ParsedSearchAsset[] | ParsedAssetsDictByChain | null;
    state: UserAssetsState | undefined;
  }) => UserAssetsState | null;
  updateTokens: (tokens: LiveTokensData) => void;
}
