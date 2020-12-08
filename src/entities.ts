export interface Asset {
  address: string;
  decimals: number;
  name: string;
  symbol: string;
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
