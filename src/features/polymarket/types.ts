import { PolymarketMarket } from '@/features/polymarket/types/polymarket-event';

export type Outcome = 'Yes' | 'No';

export type RawPolymarketPosition = {
  proxyWallet: string;
  asset: string;
  conditionId: string;
  size: number;
  avgPrice: number;
  initialValue: number;
  currentValue: number;
  cashPnl: number;
  percentPnl: number;
  totalBought: number;
  realizedPnl: number;
  percentRealizedPnl: number;
  curPrice: number;
  redeemable: boolean;
  mergeable: boolean;
  title: string;
  slug: string;
  icon: string;
  eventId: string;
  eventSlug: string;
  outcome: Outcome;
  outcomeIndex: number;
  oppositeOutcome: Outcome;
  oppositeAsset: string;
  endDate: string;
  negativeRisk: boolean;
};

export type PolymarketPosition = RawPolymarketPosition & {
  nativeCurrency: {
    currentValue: number;
    cashPnl: number;
  };
  market: PolymarketMarket;
  /**
   * Some events have a unique image for each market, such as "Who will win the 2028 presidential election?"
   * Others use the same image for all markets, such as "Fed decision in December 2025?"
   * For those that do not have unique images, we do not show the image when displaying the market.
   */
  marketHasUniqueImage: boolean;
};

export type PolymarketWalletListData = {
  balance: string;
  hasBalance: boolean;
  hasPositions: boolean;
  positions: PolymarketPosition[];
  value: string;
  enabled: boolean;
};
