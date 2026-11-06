import omit from 'lodash/omit';
import { type Address } from 'viem';

import { type PolymarketOrderDetails } from '@/features/polymarket/stores/polymarketOrderDetailsStore';
import { type PolymarketOrderAmounts, type PolymarketPosition } from '@/features/polymarket/types';
import { type PolymarketEvent, type PolymarketMarketEvent } from '@/features/polymarket/types/polymarket-event';
import { add, divide, multiply, subtract } from '@/helpers/utilities';

// ============ Types ========================================================== //

type BuildAcceptedBuyPositionParams = PolymarketOrderDetails & {
  currentPosition: PolymarketPosition | undefined;
  positionAmounts: PolymarketOrderAmounts;
  proxyWallet: Address;
};

// ============ Builder ======================================================== //

/**
 * Builds the visible position created by an accepted buy before the indexed positions API catches up.
 */
export function buildAcceptedBuyPosition({
  currentPosition,
  event,
  market,
  positionAmounts,
  outcomeIndex,
  proxyWallet,
}: BuildAcceptedBuyPositionParams): PolymarketPosition | null {
  const asset = market.clobTokenIds[outcomeIndex];
  const outcome = market.outcomes[outcomeIndex];

  if (!asset || !outcome) return null;

  const size = add(currentPosition?.size ?? 0, positionAmounts.tokens);
  const initialValue = add(currentPosition?.initialValue ?? 0, positionAmounts.usd);
  const curPrice = market.outcomePrices[outcomeIndex] ?? (size === '0' ? '0' : divide(initialValue, size));
  const currentValue = multiply(size, curPrice);
  const cashPnl = subtract(currentValue, initialValue);
  const marketEvents = market.events ?? [buildPositionMarketEvent(event)];
  const marketEvent = marketEvents[0];

  return {
    asset,
    cashPnl: Number(cashPnl),
    conditionId: market.conditionId,
    curPrice: Number(curPrice),
    currentValue: Number(currentValue),
    eventId: event.id,
    eventSlug: event.slug,
    icon: market.icon,
    initialValue: Number(initialValue),
    market: { ...market, events: marketEvents },
    marketHasUniqueImage: market.icon !== marketEvent.icon,
    negativeRisk: market.negRisk,
    outcome,
    outcomeIndex,
    proxyWallet,
    redeemable: false,
    size: Number(size),
    slug: market.slug,
    teams: currentPosition?.teams ?? event.teams,
  };
}

function buildPositionMarketEvent(event: PolymarketEvent | PolymarketMarketEvent): PolymarketMarketEvent {
  if (!('markets' in event)) return event;

  return { ...omit(event, 'markets'), sortBy: event.sortBy ?? '', negRiskAugmented: false };
}
