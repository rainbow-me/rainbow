export type PriceReliabilityStatus =
  | 'PRICE_RELIABILITY_STATUS_TRUSTED'
  | 'PRICE_RELIABILITY_STATUS_NOT_TRUSTED'
  | 'PRICE_RELIABILITY_STATUS_UNSPECIFIED';

export interface TokenData {
  price: string;
  // This is exclusively for Hyperliquid markets.
  midPrice?: string | null;
  change: {
    change5mPct: string;
    change1hPct: string;
    change4hPct: string;
    change12hPct: string;
    change24hPct: string;
  };
  marketData: {
    circulatingMarketCap: string;
  };
  reliability: {
    metadata: {
      liquidityCap: string;
    };
    status: PriceReliabilityStatus;
  };
  updateTime: string;
}

export interface LiveTokensData {
  [tokenId: string]: TokenData | undefined;
}
