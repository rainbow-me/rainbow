import { Address } from 'viem';
import { ParsedAddressAsset } from '@/entities';
import { SupportedCurrencyKey } from '@/references';
import { ChainId } from '@/state/backendNetworks/types';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { ParsedAssetsDictByChain, ParsedSearchAsset, UniqueId, UserAssetFilter } from '@/__swaps__/types/assets';

export type UserAssetsStoreType = ReturnType<
  typeof createQueryStore<FetchedUserAssetsData, UserAssetsParams, UserAssetsState, TransformedUserAssetsData>
>;

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
  /** Returns the total balance of the user's assets, or undefined if not yet loaded. */
  getTotalBalance: () => number | undefined;
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
}
