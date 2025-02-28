import { Address } from 'viem';
import { ChainId } from '@/state/backendNetworks/types';
import { AddressOrEth, AssetType, ParsedAsset, UniqueId } from '@/__swaps__/types/assets';

export type TokenSearchAssetKey = keyof ParsedAsset;

export type TokenSearchThreshold = 'CONTAINS' | 'CASE_SENSITIVE_EQUAL';

export type TokenSearchListId = 'highLiquidityAssets' | 'lowLiquidityAssets' | 'verifiedAssets';

interface Market {
  market_cap: {
    value: number;
  };
  volume_24h: number;
  circulating_supply: number;
}

export type SearchAsset = {
  address: AddressOrEth;
  chainId: ChainId;
  colors?: { primary?: string; fallback?: string };
  decimals: number;
  highLiquidity: boolean;
  icon_url?: string;
  isPopular?: boolean;
  isRainbowCurated: boolean;
  isNativeAsset?: boolean;
  isVerified: boolean;
  mainnetAddress: AddressOrEth;
  market?: Market;
  name: string;
  networks: {
    [chainId in ChainId]?: {
      address: chainId extends ChainId.mainnet ? AddressOrEth : Address;
      decimals: number;
    };
  };
  rainbowMetadataId?: number;
  sectionId?: AssetToBuySectionId;
  symbol: string;
  type?: AssetType;
  uniqueId: UniqueId;
};

export type FavoritedAsset = SearchAsset & { favorite: boolean };

export type AssetToBuySectionId = 'bridge' | 'recent' | 'favorites' | 'verified' | 'unverified' | 'other_networks' | 'popular';

export interface AssetToBuySection {
  data: SearchAsset[];
  id: AssetToBuySectionId;
}

export type HeaderItem = { listItemType: 'header'; id: AssetToBuySectionId; data: SearchAsset[] };
export type CoinRowItem = SearchAsset & { favorite?: boolean; listItemType: 'coinRow'; sectionId: AssetToBuySectionId };
export type TokenToBuyListItem = HeaderItem | CoinRowItem;
