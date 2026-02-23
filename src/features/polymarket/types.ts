import { type PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { type PolymarketTeamInfo } from '@/features/polymarket/types/team-info';

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
  outcome: string;
  outcomeIndex: number;
  oppositeOutcome: string;
  oppositeAsset: string;
  endDate: string;
  negativeRisk: boolean;
};

export type PolymarketPosition = RawPolymarketPosition & {
  // These are returned in the response as stringified JSON arrays
  clobTokenIds: string[];
  outcomes: string[];
  outcomePrices: string[];
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
  teams?: PolymarketTeamInfo[];
};

export type PolymarketWalletListData = {
  balance: string;
  hasBalance: boolean;
  hasPositions: boolean;
  positions: PolymarketPosition[];
  value: string;
  enabled: boolean;
};

export type { PolymarketGameMetadata, PolymarketTeamInfo, RawPolymarketTeamInfo, TeamSide } from '@/features/polymarket/types/team-info';
