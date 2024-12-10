import { Address } from 'viem';

import { AddressOrEth, AssetType, ParsedAsset, UniqueId } from '@/__swaps__/types/assets';
import { ChainId } from '@/state/backendNetworks/types';
import { AssetToBuySectionId } from '../screens/Swap/hooks/useSearchCurrencyLists';

export type TokenSearchAssetKey = keyof ParsedAsset;

export type TokenSearchThreshold = 'CONTAINS' | 'CASE_SENSITIVE_EQUAL';

export type TokenSearchListId = 'highLiquidityAssets' | 'lowLiquidityAssets' | 'verifiedAssets';

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
