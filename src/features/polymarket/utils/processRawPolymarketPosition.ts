import { getAddress } from 'viem';

import { useCurrencyConversionStore } from '@/features/currency/stores/currencyConversionStore';
import { type PolymarketPosition, type PolymarketTeamInfo, type RawPolymarketPosition } from '@/features/polymarket/types';
import { type PolymarketMarket } from '@/features/polymarket/types/polymarket-event';

export function processRawPolymarketPosition(
  position: RawPolymarketPosition,
  market: PolymarketMarket,
  teams?: PolymarketTeamInfo[]
): PolymarketPosition {
  const { convertToNativeCurrency } = useCurrencyConversionStore.getState();

  return {
    ...position,
    proxyWallet: getAddress(position.proxyWallet),
    clobTokenIds: market.clobTokenIds,
    outcomes: market.outcomes,
    outcomePrices: market.outcomePrices,
    nativeCurrency: {
      currentValue: convertToNativeCurrency(position.currentValue),
      cashPnl: convertToNativeCurrency(position.cashPnl),
    },
    market,
    marketHasUniqueImage: market.icon !== market.events[0].icon,
    teams,
  };
}
