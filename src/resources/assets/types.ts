import { NativeCurrencyKey, ParsedAddressAsset, ZerionAssetPrice } from '@/entities';
import { TokenColors } from '@/graphql/__generated__/metadata';
import { ChainId, Network } from '@/chains/types';
import { AddressOrEth, AssetApiResponse, AssetType, ParsedSearchAsset, UniqueId } from '@/components/swaps/types/assets';
import { ResponseByTheme } from '@/components/swaps/utils/swaps';

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
  colors?: TokenColors;
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
  address: AddressOrEth;
  chainId: ChainId;
  chainName: string;
  colors?: {
    fallback?: string;
    primary: string;
    shadow?: string;
  };
  isNativeAsset?: boolean;
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

export type RainbowAddressAssets = Record<string, ParsedAddressAsset>;
