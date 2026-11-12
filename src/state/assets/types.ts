import { type OptionallyPersistedStore, type QueryStoreState } from '@storesjs/stores';
import { type Address, type Prettify } from 'viem';

import { type ParsedSearchAsset, type UniqueId, type UserAssetFilter } from '@/__swaps__/types/assets';
import type { ParsedAddressAsset } from '@/entities/tokens';
import type { SupportedCurrencyKey } from '@/features/currency/supportedCurrencies';
import { type ChainId } from '@/features/network/types/backendNetworks';

import { type LiveTokensData } from '../liveTokens/types';
import { type UserAssetsStateToPersist } from './persistence';

export type QueryEnabledUserAssetsState = QueryStoreState<FetchedUserAssetsData, UserAssetsParams, UserAssetsState>;
export type UserAssetsStoreType = OptionallyPersistedStore<QueryEnabledUserAssetsState, UserAssetsStateToPersist>;

export type FetchedUserAssetsData = {
  chainIdsWithErrors: ChainId[] | null;
  userAssets: UserAsset[] | null;
} | null;

export type HighestValueAssetOptions = {
  /** Restricts search to native assets or prefers native assets when available. */
  nativeAsset?: 'preferred' | 'required';
  /** Chain to prioritize, if assets are available on the specified chain. */
  preferredChainId?: ChainId;
};

export type UserAssetsParams = {
  address: Address;
  currency: SupportedCurrencyKey;
  testnetMode: boolean;
};

export interface UserAssetsState {
  address: Address;
  chainBalances: Map<ChainId, number>;
  filter: UserAssetFilter;
  hiddenAssets: Set<UniqueId>;
  hiddenAssetsBalance: string | null;
  inputSearchQuery: string;
  /** Balance-ordered references to assets not represented by positions, including hidden assets. */
  listAssets: Map<UniqueId, ParsedSearchAsset>;
  /** Complete parsed holdings, including tokens represented by positions. */
  userAssets: Map<UniqueId, ParsedSearchAsset>;
  getBalanceSortedChainList: () => ChainId[];
  getChainsWithBalance: () => ChainId[];
  getHiddenAssetsIds: () => UniqueId[];
  getHighestValueAsset: (options?: Prettify<HighestValueAssetOptions>) => ParsedSearchAsset | null;
  getLegacyUserAsset: (uniqueId: UniqueId) => ParsedAddressAsset | null;
  getNativeAssetForChain: (chainId: ChainId) => ParsedSearchAsset | null;
  getTotalBalance: () => number;
  getUserAsset: (uniqueId: UniqueId) => ParsedSearchAsset | null;
  getUserAssets: () => ParsedSearchAsset[];
  isHidden: (uniqueId: UniqueId) => boolean;
  isInitialLoad: () => boolean;
  setHiddenAssets: (uniqueIds: UniqueId[]) => void;
  setSearchQuery: (query: string) => void;
  updateTokens: (tokens: LiveTokensData) => void;
  reprocessAssetsData: (positionTokenAddresses: ReadonlySet<string>) => void;
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
  networks?: Record<
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

export type UserAsset = {
  asset: Asset;
  quantity: string;
  updatedAt: string;
  value: string;
  smallBalance?: boolean;
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
  result?: Record<string, UserAsset>;
  errors: { chainId: ChainId; error: string }[];
};
