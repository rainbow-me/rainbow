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

export interface ParsedAddressAsset extends Asset {
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

export interface IndexToken extends Asset {
  amount: string;
}
