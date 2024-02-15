import { ChainId } from '@rainbow-me/swaps';
import { EthereumAddress } from '.';
import { Chain } from '@wagmi/chains';
import { Network } from '@/networks/types';
import { TokenColors } from '@/graphql/__generated__/metadata';

export interface ZerionAssetPrice {
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

export interface Token extends Asset {
  chainId: ChainId;
}

export interface ZerionAsset {
  asset_code: string;
  name: string;
  symbol: string;
  decimals: number;
  type?: string;
  icon_url?: string | null;
  price?: ZerionAssetPrice | null;
}

export interface AssetContract {
  address?: string;
  name?: string;
  nft_version?: string;
  schema_name?: string;
  symbol?: string;
  total_supply?: number | null;
}

// Represents fields in `RainbowToken` that are not present in `Asset`. These
// fields can be included in `ParsedAddressAsset`.
type RainbowTokenOwnFields = Omit<RainbowToken, keyof Asset>;

// `ParsedAddressAsset` extends both `Asset` as well as `Partial<RainbowTokenOwnFields>`
// since `parseAsset` loads token metadata and includes it in the resulting
// `ParsedAddressAsset`. The token metadata is of the type `RainbowToken`, but
// some fields overlap with the guaranteed `Asset` fields, so the
// `Partial<RainbowTokenOwnFields>` type is used.
export interface ParsedAddressAsset extends Asset, Partial<RainbowTokenOwnFields> {
  balance?: {
    amount?: string;
    display?: string;
  };
  chainId?: number;
  color?: string;
  colors?: TokenColors;
  icon_url?: string;
  price?: {
    changed_at?: number;
    relative_change_24h?: number;
    value?: number;
  };
  asset_contract?: AssetContract;
  type?: string;
  id?: string;
  uniqueId: string;
  mainnet_address?: EthereumAddress;
  isNativeAsset?: boolean;
  network: Network;
}

export interface SwappableAsset extends ParsedAddressAsset {
  native?: {
    price?: {
      amount?: string;
    };
  };
  implementations?: {
    [network: string]: { address: EthereumAddress; decimals: number };
  };
  network: Network;
}

export interface TokenSearchNetwork {
  address: string;
  decimals: number;
}

export interface TokenSearchToken {
  decimals: number;
  highLiquidity: boolean;
  name: string;
  symbol: string;
  uniqueId: string;
  colors: { primary: string; fallback: string };
  icon_url: string;
  color: string;
  shadowColor: string;
  rainbowMetadataId: number;
  isRainbowCurated: boolean;
  isVerified: boolean;
  networks: {
    [chainId in Chain['id']]: TokenSearchNetwork;
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
  type?: string;
  network: Network;
  mainnet_address?: EthereumAddress;
  networks?: any;
}

export interface IndexToken extends Asset {
  amount: string;
}

export interface TokenMetadata {
  address: EthereumAddress;
  name: string;
  symbol: string;
  color?: string;
  isRainbowCurated?: boolean;
  isVerified?: boolean;
  shadowColor?: string;
  chainId?: number;
  decimals?: number;
}
