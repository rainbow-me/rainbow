export interface Asset {
  address: string;
  decimals: number;
  name: string;
  symbol: string;
}

export interface SavingsAsset extends Asset {
  contractAddress: string;
}

export interface ParsedAddressAsset {
  address: string;
  balance?: {
    amount?: string;
    display?: string;
  };
  color?: string;
  decimals: number;
  icon_url?: string;
  is_displayable?: boolean;
  name: string;
  price?: {
    changed_at?: number;
    relative_change_24h?: number;
    value?: number;
  };
  symbol: string;
  type?: string;
  uniqueId: string;
}

export interface UniswapCurrency extends Asset {
  native?: {
    price?: {
      amount?: string;
    };
  };
}

export interface RainbowToken extends Asset {
  color?: string;
  favorite?: boolean;
  isRainbowCurated?: boolean;
  isVerified?: boolean;
  shadowColor?: string;
  uniqueId: string;
}

export interface UniswapSubgraphAsset extends RainbowToken {
  derivedETH: string;
  totalLiquidity: string;
}

export interface RawUniswapSubgraphAsset extends UniswapSubgraphAsset {
  id: string;
}
