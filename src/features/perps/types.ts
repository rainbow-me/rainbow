import * as hl from '@nktkas/hyperliquid';

export type FrontendOrder = hl.FrontendOrder;

export type OrderSide = 'buy' | 'sell';

// TODO (kane): this is a bad name / type, we need to figure out how we want to handle multiple tp/sl orders on the same position
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
  side: OrderSide;
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

export type PerpsPosition = {
  symbol: string;
  side: PerpPositionSide;
  leverage: number;
  liquidationPrice: string | null;
  entryPrice: string;
  equity: string;
  value: string;
  size: string;
  unrealizedPnl: string;
  unrealizedPnlPercent: string;
  funding: string;
  returnOnEquity: string;
  marginUsed: string;
  takeProfit: Order | null;
  stopLoss: Order | null;
};

export type PerpAccount = {
  value: string;
  balance: string;
  positions: Record<string, PerpsPosition>;
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

// This type is an extension of the `hl.Fill` type, but with additional information added from the corresponding `hl.FrontendOrder`
export type HlTrade = {
  id: number;
  clientId?: string;
  description: string;
  symbol: string;
  side: OrderSide;
  price: string;
  size: string;
  fillStartSize: string;
  orderStartSize: string;
  pnl: string;
  fee: string;
  orderId: number;
  tradeId: number;
  txHash: string;
  liquidation?: hl.Fill['liquidation'];
  executedAt: Date;
  direction: string;
  orderType: string;
  triggerOrderType?: TriggerOrderType;
  triggerOrderPrice?: string;
};

export type TriggerOrder = {
  price: string;
  // "1" = 100% of the position size
  orderFraction: string;
  isMarket: boolean;
  type: TriggerOrderType;
};

export type PerpsWalletListData = {
  positions: PerpsPosition[];
  balance: string;
  value: string;
};
