import { getAddress } from 'viem';

import { type PolymarketPosition, type PolymarketTeamInfo, type RawPolymarketPosition } from '@/features/polymarket/types';
import { type PolymarketMarket } from '@/features/polymarket/types/polymarket-event';

export function processRawPolymarketPosition(
  position: RawPolymarketPosition,
  market: PolymarketMarket,
  teams?: PolymarketTeamInfo[]
): PolymarketPosition {
  return {
    proxyWallet: getAddress(position.proxy_wallet),
    asset: position.token_id,
    conditionId: position.condition_id,
    size: position.current_size,
    initialValue: position.entry_cost_usdc,
    currentValue: position.current_value,
    cashPnl: position.unrealized_pnl,
    curPrice: position.current_price,
    redeemable: position.redeemable,
    slug: position.slug,
    icon: position.icon,
    eventId: position.event_id,
    eventSlug: position.event_slug,
    outcome: position.outcome,
    outcomeIndex: position.outcome_index,
    negativeRisk: position.negative_risk,
    market,
    marketHasUniqueImage: market.icon !== market.events[0].icon,
    teams,
  };
}
