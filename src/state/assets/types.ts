import { type OptionallyPersistedStore, type QueryStoreState } from '@storesjs/stores';
import { type Address, type Prettify } from 'viem';

import { type AddressOrEth, type ParsedSearchAsset, type UniqueId } from '@/__swaps__/types/assets';
import type { ParsedAddressAsset } from '@/entities/tokens';
import type { SupportedCurrencyKey } from '@/features/currency/supportedCurrencies';
import { type ChainId } from '@/features/network/types/backendNetworks';

import { type LiveTokensData } from '../liveTokens/types';
import { type UserAssetsStateToPersist } from './persistence';

export type QueryEnabledUserAssetsState = QueryStoreState<FetchedUserAssetsData, UserAssetsParams, UserAssetsState>;
export type UserAssetsStoreType = OptionallyPersistedStore<QueryEnabledUserAssetsState, UserAssetsStateToPersist>;

export type FetchedUserAssetsData = UserAsset[] | null;

export type HighestValueAssetOptions = {
  /** Excludes the token with this ID before applying native asset and chain preferences. */
  excludeAssetId?: UniqueId;
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
  hiddenAssets: Set<UniqueId>;
  /** Complete holdings in balance order, including tokens represented by positions. */
  userAssets: Map<UniqueId, ParsedSearchAsset>;
  getBalanceSortedChainList: () => ChainId[];
  getChainsWithBalance: () => ChainId[];
  getHiddenAssetsIds: () => UniqueId[];
  getHighestValueAsset: (options?: Prettify<HighestValueAssetOptions>) => ParsedSearchAsset | null;
  getLegacyUserAsset: (uniqueId: UniqueId) => ParsedAddressAsset | null;
  getNativeAssetForChain: (chainId: ChainId) => ParsedSearchAsset | null;
  getUserAsset: (uniqueId: UniqueId) => ParsedSearchAsset | null;
  getUserAssets: () => ParsedSearchAsset[];
  isHidden: (uniqueId: UniqueId) => boolean;
  isInitialLoad: () => boolean;
  setHiddenAssets: (uniqueIds: UniqueId[]) => void;
  updateTokens: (tokens: LiveTokensData) => void;
  /** Replaces holdings on the specified chains, or all holdings when chains are omitted. */
  updateAssets: (userAssets: UserAsset[], chainIdsToUpdate?: ChainId[]) => void;
}

export type Asset = {
  address: AddressOrEth;
  chainId: ChainId;
  name?: string;
  symbol?: string;
  decimals?: number;
  type?: string;
  iconUrl?: string;
  network?: string;
  mainnetAddress?: AddressOrEth;
  verified?: boolean;
  transferable?: boolean;
  creationDate?: string;
  colors: {
    primary?: string;
    fallback?: string;
  };
  price: {
    value?: number;
    /** RFC3339 timestamp of the last price update, when known. */
    changedAt?: string;
    relativeChange24h?: number;
  };
  networks?: {
    [chainId in ChainId]?: {
      address: chainId extends ChainId.mainnet ? AddressOrEth : Address;
      decimals?: number;
    };
  };
  bridging?: {
    bridgeable?: boolean;
    networks?: { [chainId in ChainId]?: { bridgeable?: boolean } };
  };
};

export type UserAsset = {
  asset: Asset;
  quantity: string;
  updatedAt?: string;
  value: string;
  smallBalance?: boolean;
};

export type GetAssetsResponse = {
  metadata: {
    requestTime: string;
    responseTime: string;
    requestId: string;
    currency?: SupportedCurrencyKey;
    success: boolean;
  };
  result?: Record<string, UserAsset>;
  errors?: { code?: string; message?: string; details?: Record<string, string> }[];
};
