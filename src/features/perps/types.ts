import * as hl from '@nktkas/hyperliquid';

export type FrontendOrder = hl.FrontendOrder;

// TODO: this is a bad name / type, we need to figure out how we want to handle multiple tp/sl orders on the same position
export type Order = {
  orders: FrontendOrder[];
  price: string;
};

export type PerpMarket = {
  id: number;
  symbol: string;
  price: string;
  midPrice: string | null;
  priceChange: {
    '1h': string;
    '24h': string;
  };
  volume: {
    '24h': string;
  };
  maxLeverage: number;
  marginTiers?: hl.MarginTier[];
  decimals: number;
  fundingRate: string;
};

export type FilledOrder = {
  timestamp: Date;
  symbol: string;
  description: string;
  side: 'Buy' | 'Sell';
  size: string;
  price: string;
  value: string;
  pnl: string;
  fee: string;
  orderId: number;
  tradeId: number;
  txHash: string;
  isLiquidation: boolean;
  liquidationType?: 'market' | 'backstop';
};

// TODO: we need IDs for positions. We can attach an cloid, but we still need to handle displaying positions not created in rainbow.
export type PerpsPosition = {
  symbol: string;
  side: PerpPositionSide;
  leverage: number;
  liquidationPrice: string | null;
  entryPrice: string;
  value: string;
  unrealizedPnl: string;
  unrealizedPnlPercent: string;
  funding: string;
  takeProfit: Order | null;
  stopLoss: Order | null;
};

export type PerpAccount = {
  balance: string;
  positions: PerpsPosition[];
};

export enum PerpPositionSide {
  LONG = 'LONG',
  SHORT = 'SHORT',
}

export enum OrderType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
}

export enum MarketSortOrder {
  VOLUME = 'volume',
  PRICE = 'price',
  CHANGE = 'change',
  SYMBOL = 'symbol',
}

export enum TriggerOrderType {
  STOP_LOSS = 'sl',
  TAKE_PROFIT = 'tp',
}
