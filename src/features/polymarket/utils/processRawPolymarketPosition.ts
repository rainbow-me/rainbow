import { getAddress } from 'viem';

import { useCurrencyConversionStore } from '@/features/currency/stores/currencyConversionStore';
import { type PolymarketPosition, type PolymarketTeamInfo, type RawPolymarketPosition } from '@/features/polymarket/types';
import { type RawPolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { getImagePrimaryColor } from '@/features/polymarket/utils/getImageColors';
import { processRawPolymarketMarket } from '@/features/polymarket/utils/transforms';
import { getHighContrastColor } from '@/hooks/useAccountAccentColor';

export async function processRawPolymarketPosition(
  position: RawPolymarketPosition,
  market: RawPolymarketMarket,
  teams?: PolymarketTeamInfo[]
): Promise<PolymarketPosition> {
  const event = market.events[0];
  const marketHasUniqueImage = market.icon !== event.icon;
  const rawEventColor = await getImagePrimaryColor(event.icon);
  const eventColor = { dark: getHighContrastColor(rawEventColor, true), light: getHighContrastColor(rawEventColor, false) };

  return {
    ...position,
    proxyWallet: getAddress(position.proxyWallet),
    clobTokenIds: market.clobTokenIds ? JSON.parse(market.clobTokenIds) : [],
    outcomes: market.outcomes ? JSON.parse(market.outcomes) : [],
    outcomePrices: market.outcomePrices ? JSON.parse(market.outcomePrices) : [],
    nativeCurrency: {
      currentValue: useCurrencyConversionStore.getState().convertToNativeCurrency(position.currentValue),
      cashPnl: useCurrencyConversionStore.getState().convertToNativeCurrency(position.cashPnl),
    },
    market: processRawPolymarketMarket(market, eventColor),
    marketHasUniqueImage,
    teams,
  };
}
