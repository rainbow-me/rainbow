import { polymarketChartsActions } from '@/features/charts/polymarket/stores/polymarketStore';
import { prefetchCandlestickData } from '@/features/charts/stores/candlestickStore';
import { usePerpAnnotationsStore } from '@/features/perps/stores/perpAnnotationsStore';
import { prefetchPolymarketEvent } from '@/features/polymarket/stores/polymarketEventIdStore';
import { usePolymarketOrderStore } from '@/features/polymarket/stores/polymarketOrderStore';
import Routes, { type Route } from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';

type PrefetchRegistry = Readonly<{
  [key in Route]?: [undefined] extends [RootStackParamList[key]] ? () => void : (params: RootStackParamList[key]) => void;
}>;

const prefetchRegistry: PrefetchRegistry = {
  [Routes.EXPANDED_ASSET_SHEET_V2]: ({ asset }) => {
    prefetchCandlestickData(asset);
  },

  [Routes.PERPS_DETAIL_SCREEN]: ({ market }) => {
    prefetchCandlestickData(market.symbol);
    usePerpAnnotationsStore.getState().setSymbol(market.symbol);
  },

  [Routes.POLYMARKET_EVENT_SCREEN]: params => {
    if ('gameId' in params) {
      prefetchPolymarketEvent(params.gameId);
      return;
    }
    prefetchPolymarketEvent(params.eventId);
    polymarketChartsActions.setSelectedEventSlug(params.event.slug);
  },

  [Routes.POLYMARKET_MARKET_SHEET]: ({ market }) => {
    if (market.clobTokenIds?.length && market.outcomes?.length) {
      polymarketChartsActions.setSelectedMarketFilter({
        tokenIds: market.clobTokenIds,
        labels: market.outcomes,
      });
    }
  },

  [Routes.POLYMARKET_NEW_POSITION_SHEET]: usePolymarketOrderStore.getState().setBuyParams,

  [Routes.POLYMARKET_SELL_POSITION_SHEET]: ({ position }) => {
    usePolymarketOrderStore.getState().setSellParams(position);
  },
};

/**
 * Runs a route's prefetch handler synchronously. Routes without a handler are ignored.
 */
export function prefetchRoute<RouteName extends Route>(routeName: RouteName, params: RootStackParamList[RouteName]): void {
  prefetchRegistry[routeName]?.(params);
}
