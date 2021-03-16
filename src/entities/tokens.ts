export interface Asset {
  address: string;
  decimals: number;
  name: string;
  symbol: string;
}

export interface SavingsAsset extends Asset {
  contractAddress: string;
}

export interface ParsedAddressAsset extends Asset {
  balance?: {
    amount?: string;
    display?: string;
  };
  color?: string;
  icon_url?: string;
  is_displayable?: boolean;
  price?: {
    changed_at?: number;
    relative_change_24h?: number;
    value?: number;
  };
  type?: string;
  uniqueId: string;
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
  favorite?: boolean;
  isRainbowCurated?: boolean;
  isVerified?: boolean;
  shadowColor?: string;
  uniqueId: string;
}

export interface IndexToken extends Asset {
  amount: string;
}
