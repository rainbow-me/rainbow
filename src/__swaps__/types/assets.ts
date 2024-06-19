import type { Address } from 'viem';

import { ETH_ADDRESS } from '@/references';
import { ChainId, ChainName } from '@/__swaps__/types/chains';
import { SearchAsset } from '@/__swaps__/types/search';
import { ResponseByTheme } from '../utils/swaps';

export type AddressOrEth = Address | typeof ETH_ADDRESS;

export type UserAssetFilter = 'all' | ChainId;

export interface ExtendedAnimatedAssetWithColors extends ParsedSearchAsset {
  // colors
  color: ResponseByTheme<string>;
  shadowColor: ResponseByTheme<string>;
  mixedShadowColor: ResponseByTheme<string>;
  textColor: ResponseByTheme<string>;
  tintedBackgroundColor: ResponseByTheme<string>;
  highContrastColor: ResponseByTheme<string>;

  // total balance minus gas fee if native token
  maxSwappableAmount: string;

  // price information
  nativePrice: number | undefined;
}

export interface ParsedAsset {
  address: AddressOrEth;
  chainId: ChainId;
  chainName: ChainName;
  colors?: {
    primary?: string;
    fallback?: string;
    shadow?: string;
  };
  isNativeAsset: boolean;
  name: string;
  native: {
    price?: {
      change: string;
      amount: number;
      display: string;
    };
  };
  mainnetAddress?: AddressOrEth;
  price?: ZerionAssetPrice;
  symbol: string;
  uniqueId: UniqueId;
  decimals: number;
  icon_url?: string;
  type?: AssetType;
  smallBalance?: boolean;
  standard?: 'erc-721' | 'erc-1155';
  networks?: AssetApiResponse['networks'];
  bridging?: {
    isBridgeable: boolean;
    networks: { [id in ChainId]?: { bridgeable: boolean } };
  };
}

export interface ParsedUserAsset extends ParsedAsset {
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
}

export type SearchAssetWithPrice = SearchAsset & ParsedAsset;
export type ParsedSearchAsset = SearchAsset & ParsedUserAsset;

export type ParsedAssetsDict = Record<UniqueId, ParsedUserAsset>;

export type ParsedAssetsDictByChain = Record<ChainId | number, ParsedAssetsDict>;

export interface ZerionAssetPrice {
  value: number;
  relative_change_24h?: number;
}

export type AssetApiResponse = {
  asset_code: AddressOrEth;
  bridging: {
    bridgeable: boolean;
    networks: { [id in ChainId]?: { bridgeable: boolean } };
  };
  decimals: number;
  icon_url: string;
  name: string;
  chain_id: number;
  price?: {
    value: number;
    changed_at: number;
    relative_change_24h: number;
  };
  symbol: string;
  colors?: { primary?: string; fallback?: string; shadow?: string };
  network?: ChainName;
  networks?: {
    [chainId in ChainId]?: {
      address: chainId extends ChainId.mainnet ? AddressOrEth : Address;
      decimals: number;
    };
  };
  type?: AssetType;
  interface?: 'erc-721' | 'erc-1155';
};

export type AssetType = ProtocolType | 'nft';

export interface ZerionAsset {
  asset_code: AddressOrEth;
  colors?: {
    primary: string;
    fallback: string;
  };
  implementations?: Record<string, { address: Address | null; decimals: number }>;
  mainnet_address?: AddressOrEth;
  name: string;
  symbol: string;
  decimals: number;
  type?: AssetType;
  icon_url?: string;
  is_displayable?: boolean;
  is_verified?: boolean;
  price?: ZerionAssetPrice;
  network?: ChainName;
  bridging: {
    bridgeable: boolean;
    networks: { [id in ChainId]?: { bridgeable: boolean } };
  };
}

// protocols https://github.com/rainbow-me/go-utils-lib/blob/master/pkg/enums/token_type.go#L44
export type ProtocolType =
  | 'aave-v2'
  | 'balancer'
  | 'curve'
  | 'compound'
  | 'compound-v3'
  | 'maker'
  | 'one-inch'
  | 'piedao-pool'
  | 'yearn'
  | 'yearn-v2'
  | 'uniswap-v2'
  | 'aave-v3'
  | 'harvest'
  | 'lido'
  | 'uniswap-v3'
  | 'convex'
  | 'convex-frax'
  | 'pancake-swap'
  | 'balancer-v2'
  | 'frax'
  | 'gmx'
  | 'aura'
  | 'pickle'
  | 'yearn-v3'
  | 'venus'
  | 'sushiswap'
  | 'native'
  | 'wrappedNative'
  | 'stablecoin';

export type AssetMetadata = {
  circulatingSupply: number;
  colors?: { primary: string; fallback?: string; shadow?: string };
  decimals: number;
  description: string;
  fullyDilutedValuation: number;
  iconUrl: string;
  marketCap: number;
  name: string;
  networks?: {
    [chainId in ChainId]?: {
      address: chainId extends ChainId.mainnet ? AddressOrEth : Address;
      decimals: number;
    };
  };
  price: {
    value: number;
    relativeChange24h: number;
  };
  symbol: string;
  totalSupply: number;
  volume1d: number;
};

export type UniqueId = `${Address}_${ChainId}`;
