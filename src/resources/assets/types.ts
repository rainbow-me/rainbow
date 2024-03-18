import { Network } from '@/helpers/networkTypes';
import { NativeCurrencyKey, ParsedAddressAsset } from '@/entities';
import { TokenColors } from '@/graphql/__generated__/metadata';

export type AddysAccountAssetsResponse = {
  meta: AddysAccountAssetsMeta;
  payload: AddysAccountAssetsPayload;
};

export type AddysAccountAssetsMeta = {
  addresses: string[];
  addresses_with_errors: string[];
  chain_ids: number[];
  chain_ids_with_errors: number[];
  currency: NativeCurrencyKey;
  errors: string[];
  status: string;
};

export type AddysAccountAssetsPayload = {
  assets: AddysAddressAsset[];
};

export type AddysAddressAsset = {
  asset: AddysAsset;
  quantity: string;
};

export type AddysAsset = {
  asset_code: string;
  colors: TokenColors;
  decimals: number;
  icon_url?: string;
  name: string;
  network: Network;
  networks?: Record<string, AddysNetworkDetails>;
  price?: AddysAssetPrice;
  symbol: string;
  type?: string;
};

export type AddysNetworkDetails = {
  address: string;
  decimals: number;
};

export type AddysAssetPrice = {
  changed_at: number;
  relative_change_24h: number;
  value: number;
};

export interface ParsedAsset {
  address: string;
  color?: string;
  colors?: TokenColors;
  chainId?: number;
  chainName?: string;
  decimals: number;
  icon_url?: string;
  isNativeAsset?: boolean;
  name: string;
  mainnet_address?: string;
  network: Network;
  networks?: Record<string, AddysNetworkDetails>;
  native: {
    price?: {
      change: string;
      amount: number;
      display: string;
    };
  };
  price?: {
    changed_at?: number;
    relative_change_24h?: number;
    value?: number;
  };
  symbol: string;
  type?: string;
  uniqueId: string;
}

export type SearchAsset = {
  address: string;
  chainId: number;
  colors?: TokenColors;
  decimals: number;
  highLiquidity: boolean;
  icon_url: string;
  isRainbowCurated: boolean;
  isNativeAsset: boolean;
  isVerified: boolean;
  mainnet_address: string;
  name: string;
  networks?: Record<string, AddysNetworkDetails>;
  network: Network;
  rainbowMetadataId: number;
  symbol: string;
  uniqueId: string;
};

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
export type ParsedAssetsDict = Record<string, ParsedUserAsset>;
export type RainbowAddressAssets = Record<string, ParsedAddressAsset>;
