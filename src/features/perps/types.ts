import * as hl from '@nktkas/hyperliquid';
import { OrderParameters } from '@nktkas/hyperliquid/api/exchange';
import { Hex } from 'viem';
import { SUPPORTED_DEX } from '@/features/perps/constants';

// Derived types from @nktkas/hyperliquid
export type UserFill = hl.UserFillsResponse[number];
export type MarginTier = hl.MarginTableResponse['marginTiers'][number];
export type HistoricalOrder = hl.HistoricalOrdersResponse[number];
export type OrderParams = OrderParameters['orders'][number];
export type TIF = Extract<OrderParams['t'], { limit: unknown }>['limit']['tif'];

export type OrderSide = 'buy' | 'sell';
export type SupportedDex = (typeof SUPPORTED_DEX)[number];

export type PerpMarket = {
  id: number;
  symbol: string;
  baseSymbol: string;
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
  marginTiers?: MarginTier[];
  decimals: number;
  fundingRate: string;
  dex: SupportedDex;
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
  dex: SupportedDex;
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

// This type is based on the `hl.Fill` type, but with additional information added from the corresponding `hl.FrontendOrder`
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
  liquidation?: UserFill['liquidation'];
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
  enabled: boolean;
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
