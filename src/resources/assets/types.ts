import { Network } from '@/helpers/networkTypes';
import { NativeCurrencyKey, ParsedAddressAsset } from '@/entities';

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
  colors: AddysAssetColors;
  decimals: number;
  icon_url?: string;
  name: string;
  network: Network;
  networks?: Record<string, AddysNetworkDetails>;
  price?: AddysAssetPrice;
  symbol: string;
  type?: string;
};

export type AddysAssetColors = {
  fallback?: string;
  primary: string;
  shadow?: string;
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
  colors?: {
    primary?: string;
    fallback?: string;
    shadow?: string;
  };
  chainId?: number;
  chainName?: string;
  decimals: number;
  icon_url?: string;
  isNativeAsset?: boolean;
  name: string;
  mainnet_address?: string;
  network?: Network;
  networks?: Record<string, AddysNetworkDetails>;
  price?: {
    changed_at?: number;
    relative_change_24h?: number;
    value?: number;
  };
  symbol: string;
  type: string;
  uniqueId: string;
}

export type RainbowAddressAssets = Record<string, ParsedAddressAsset>;
