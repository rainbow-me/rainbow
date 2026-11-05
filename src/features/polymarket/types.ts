import { type OrderResponse } from '@polymarket/clob-client-v2';
import { type Address } from 'viem';

import { type PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { type PolymarketTeamInfo } from '@/features/polymarket/types/team-info';

export type RawPolymarketPosition = {
  proxy_wallet: string;
  token_id: string;
  condition_id: string;
  current_size: number;
  entry_cost_usdc: number;
  current_value: number;
  unrealized_pnl: number;
  current_price: number;
  redeemable: boolean;
  slug: string;
  icon: string;
  event_id: string;
  event_slug: string;
  outcome: string;
  outcome_index: number;
  negative_risk: boolean;
};

export type PolymarketPosition = {
  proxyWallet: Address;
  asset: string;
  conditionId: string;
  size: number;
  initialValue: number;
  currentValue: number;
  cashPnl: number;
  curPrice: number;
  redeemable: boolean;
  slug: string;
  icon: string;
  eventId: string;
  eventSlug: string;
  outcome: string;
  outcomeIndex: number;
  negativeRisk: boolean;
  market: PolymarketMarket;
  /**
   * Some events have a unique image for each market, such as "Who will win the 2028 presidential election?"
   * Others use the same image for all markets, such as "Fed decision in December 2025?"
   * For those that do not have unique images, we do not show the image when displaying the market.
   */
  marketHasUniqueImage: boolean;
  teams?: PolymarketTeamInfo[];
};

export type SuccessfulOrderResult = OrderResponse & {
  success: true;
};

export type PolymarketOrderResult =
  | SuccessfulOrderResult
  | (OrderResponse & { success: false })
  | {
      error: string;
      status: number;
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
