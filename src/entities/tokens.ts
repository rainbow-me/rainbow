import { AssetType } from './assetTypes';
import { EthereumAddress } from '.';

interface ZerionAssetPrice {
  value: number;
  relative_change_24h: number | null;
  changed_at: number;
}

export interface Asset {
  address: EthereumAddress;
  decimals: number;
  name: string;
  symbol: string;
}

export interface ZerionAsset {
  asset_code: string;
  name: string;
  symbol: string;
  decimals: number;
  type: AssetType | null;
  icon_url?: string | null;
  price?: ZerionAssetPrice | null;
}

// Fields that may or may not be present in a `ZerionAssetFallback` but are
// present in a `ZerionAsset`.
type ZerionAssetFallbackOmittedFields = 'decimals' | 'type';

// An asset fallback for a `ZerionAsset`, which has
// the additional `coingecko_id` property but may or may not have the
// fields specified in `ZerionAssetFallbackOmittedFields`.
export type ZerionAssetFallback = {
  coingecko_id: string;
} & Omit<ZerionAsset, ZerionAssetFallbackOmittedFields> &
  Partial<Pick<ZerionAsset, ZerionAssetFallbackOmittedFields>>;

export interface SavingsAsset extends Asset {
  contractAddress: string;
}

export interface AssetContract {
  address?: string;
  name?: string;
  nft_version?: string;
  schema_name?: string;
  symbol?: string;
  total_supply?: number | null;
}

export interface RainbowToken extends Asset {
  color?: string;
  highLiquidity?: boolean;
  totalLiquidity?: number;
  favorite?: boolean;
  isRainbowCurated?: boolean;
  isVerified?: boolean;
  shadowColor?: string;
  uniqueId: string;
}

// Represents fields in `RainbowToken` that are not present in `Asset`. These
// fields can be included in `ParsedAddressAsset`.
type RainbowTokenOwnFields = Omit<RainbowToken, keyof Asset>;

// `ParsedAddressAsset` extends both `Asset` as well as `Partial<RainbowTokenOwnFields>`
// since `parseAsset` loads token metadata and includes it in the resulting
// `ParsedAddressAsset`. The token metadata is of the type `RainbowToken`, but
// some fields overlap with the guaranteed `Asset` fields, so the
// `Partial<RainbowTokenOwnFields>` type is used.
export interface ParsedAddressAsset
  extends Asset,
    Partial<RainbowTokenOwnFields> {
  balance?: {
    amount?: string;
    display?: string;
  };
  color?: string;
  icon_url?: string;
  price?: {
    changed_at?: number;
    relative_change_24h?: number;
    value?: number;
  };
  asset_contract?: AssetContract;
  type?: string;
  id: string;
  uniqueId: string;
  mainnet_address?: EthereumAddress;
  isNativeAsset?: boolean;
}

export interface UniswapCurrency extends ParsedAddressAsset {
  native?: {
    price?: {
      amount?: string;
    };
  };
}

export interface IndexToken extends Asset {
  amount: string;
}
