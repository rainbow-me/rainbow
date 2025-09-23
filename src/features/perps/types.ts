import * as hl from '@nktkas/hyperliquid';
import { Hex } from 'viem';

export type OrderSide = 'buy' | 'sell';

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

export type HyperliquidTokenMetadata = {
  id: string;
  address: string;
  name: string;
  symbol: string;
  colors: {
    color?: string;
    fallbackColor: string;
    shadowColor: string;
  };
  iconUrl?: string;
};

export type PerpMarketWithMetadata = PerpMarket & {
  metadata?: HyperliquidTokenMetadata;
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
  funding: string;
  returnOnEquity: string;
  marginUsed: string;
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
  netPnl: string;
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
  /** Fraction from `0` to `1`, where `1` is 100% of the position size. */
  orderFraction: string;
  isMarket: boolean;
  type: TriggerOrderType;
};

export type PerpsWalletListData = {
  balance: string;
  hasBalance: boolean;
  hasPositions: boolean;
  positions: PerpsPosition[];
  value: string;
};

export type HlBuilderSettings = {
  /** The builder address. */
  b: Hex;
  /** The builder fee in tenths of a basis point (e.g., `10` = 1 basis point). */
  f: number;
};

export enum TriggerOrderSource {
  NEW = 'new',
  EXISTING = 'existing',
}
