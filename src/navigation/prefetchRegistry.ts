import { polymarketChartsActions } from '@/features/charts/polymarket/stores/polymarketStore';
import { prefetchCandlestickData } from '@/features/charts/stores/candlestickStore';
import { prefetchPolymarketEvent } from '@/features/polymarket/stores/polymarketEventStore';
import { usePolymarketOrderBookStore } from '@/features/polymarket/stores/polymarketOrderBookStore';
import Routes, { type Route } from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';
import { deepFreeze } from '@/utils/deepFreeze';

type PrefetchRegistry = Readonly<{
  [key in Route]?: [undefined] extends [RootStackParamList[key]] ? () => void : (params: RootStackParamList[key]) => void;
}>;

/**
 * A registry of routes to prefetch functions to be called ahead of navigation.
 */
export const prefetchRegistry = deepFreeze<PrefetchRegistry>({
  [Routes.EXPANDED_ASSET_SHEET_V2]: ({ asset }) => {
    prefetchCandlestickData(asset);
  },

  [Routes.PERPS_DETAIL_SCREEN]: ({ market }) => {
    prefetchCandlestickData(market.symbol);
  },

  [Routes.POLYMARKET_EVENT_SCREEN]: ({ eventId, event }) => {
    prefetchPolymarketEvent(eventId);
    if (event?.slug) polymarketChartsActions.setSelectedEventSlug(event.slug);
  },

  [Routes.POLYMARKET_MARKET_SHEET]: ({ market }) => {
    if (market.clobTokenIds?.length && market.outcomes?.length) {
      polymarketChartsActions.setSelectedMarketFilter({
        tokenIds: market.clobTokenIds,
        labels: market.outcomes,
      });
    }
  },

  [Routes.POLYMARKET_NEW_POSITION_SHEET]: ({ market, outcomeIndex }) => {
    const tokenId = market.clobTokenIds[outcomeIndex];
    usePolymarketOrderBookStore.getState().setTokenId(tokenId);
  },

  [Routes.POLYMARKET_SELL_POSITION_SHEET]: ({ position }) => {
    const tokenId = position.clobTokenIds[position.outcomes.indexOf(position.outcome)];
    usePolymarketOrderBookStore.getState().setTokenId(tokenId);
  },
});
