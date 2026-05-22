import { useCallback } from 'react';

import { type PerpMarketWithMetadata } from '@/features/perps/types';
import { navigateToPerpDetailScreen } from '@/features/perps/utils';
import { extractBaseSymbol } from '@/features/perps/utils/hyperliquidSymbols';
import { type PlacementItemAnalyticsMetadata } from '@/features/placements/types';

export function usePerpMarketPress(market: PerpMarketWithMetadata, onPressTracked?: (metadata?: PlacementItemAnalyticsMetadata) => void) {
  const symbol = market.symbol;
  const baseSymbol = extractBaseSymbol(market.baseSymbol);
  const marketName = market.metadata?.name ?? baseSymbol;

  return useCallback(() => {
    navigateToPerpDetailScreen(symbol);
    onPressTracked?.({
      marketId: symbol,
      marketName,
      marketSymbol: baseSymbol,
    });
  }, [baseSymbol, marketName, onPressTracked, symbol]);
}
