import { Address } from 'viem';
import { ChainId, ChainName } from './chains';

export const ETH_ADDRESS = 'eth';
export type AddressOrEth = Address | typeof ETH_ADDRESS;

export interface ZerionAssetPrice {
  value: number;
  relative_change_24h?: number;
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
export type UniqueId = `${Address}_${ChainId}`;
type AssetType = ProtocolType | 'nft';
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
  | 'sushiswap';

export type AssetApiResponse = {
  asset_code: AddressOrEth;
  decimals: number;
  icon_url: string;
  name: string;
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
