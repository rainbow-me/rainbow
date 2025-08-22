import { ParsedAddressAsset } from '@/entities';
import { TokenColors } from '@/graphql/__generated__/metadata';

export type AddysNetworkDetails = {
  address: string;
  decimals: number;
};

export interface ParsedAsset {
  address: string;
  color?: string;
  colors?: TokenColors;
  chainId: number;
  chainName?: string;
  decimals: number;
  icon_url?: string;
  isNativeAsset?: boolean;
  name: string;
  mainnet_address?: string;
  network: string;
  networks?: Record<string, AddysNetworkDetails>;
  price?: {
    changed_at?: number;
    relative_change_24h?: number;
    value?: number;
  };
  symbol: string;
  type?: string;
  uniqueId: string;
}

export type RainbowAddressAssets = Record<string, ParsedAddressAsset>;
