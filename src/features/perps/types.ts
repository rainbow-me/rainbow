export type Order = {
  price: string;
  // TODO:
  orders: any[];
};

export type Market = {
  id: number;
  symbol: string;
  price: string;
  priceChange: {
    '1h': string;
    '24h': string;
  };
  volume: {
    '24h': string;
  };
  maxLeverage: number;
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
export type Position = {
  symbol: string;
  side: PositionSide;
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

export type AccountStats = {
  pnl: string;
};

export type PerpAccount = {
  balance: string;
  positions: Position[];
};

export type PositionSide = 'LONG' | 'SHORT';
export type OrderType = 'MARKET' | 'LIMIT';
export type MarketSortOrder = 'volume' | 'price' | 'change' | 'symbol';
