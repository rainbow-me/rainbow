import React, { useCallback, useMemo } from 'react';

import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { convertStoredPerpPriceChangeToPercent, formatCompactPerpPercentChange } from '@/features/perps/utils';
import { navigateToPerpsSearch } from '@/features/perps/utils/navigateToPerps';
import { PLACEMENT_IDS } from '@/features/placements/constants';
import { trackPlacementInteraction } from '@/features/placements/engagement/trackInteraction';
import { useDiscoverPerpsStore } from '@/features/placements/stores/discover/discoverPerpsStore';
import { useDiscoverPlacementsStore } from '@/features/placements/stores/discover/discoverPlacementsStore';
import { type Placement, type PlacementItem } from '@/features/placements/types';
import * as i18n from '@/languages';

import { MarketCarousel } from './MarketCarousel';
import { computePerpCardWidth, PERP_MARKET_CARD_HEIGHT, PerpMarketCard } from './PerpMarketCard';

const PLACEMENT_ID = PLACEMENT_IDS.DISCOVER_PERPS_CAROUSEL;

export function PerpsMarketCarousel() {
  const placement = useDiscoverPlacementsStore<Placement | undefined>(state => state[PLACEMENT_ID]);
  const placementsLoading = useDiscoverPlacementsStore(state => {
    const items = state[PLACEMENT_ID]?.items ?? [];
    return items.length === 0 && state.isInitialLoad;
  });
  const markets = useHyperliquidMarketsStore(state => state.markets);
  const chartsBySymbol = useDiscoverPerpsStore(state => state.chartsBySymbol);
  const marketsLoading = useHyperliquidMarketsStore(state => {
    const hasMarkets = Object.keys(state.markets).length > 0;
    return !hasMarkets && (state.status === 'loading' || state.status === 'idle');
  });

  const items = useMemo(
    () => placement?.items.filter(item => item.ref.source === 'hyperliquid' && markets[item.ref.id] !== undefined) ?? [],
    [placement, markets]
  );
  const isLoading = placementsLoading || marketsLoading;
  const getPerpCardWidth = useCallback(
    (item: PlacementItem): number => {
      const market = markets[item.ref.id];
      const percentChange =
        chartsBySymbol[item.ref.id]?.percentChange ??
        (market ? convertStoredPerpPriceChangeToPercent(market.priceChange['1h'] ?? market.priceChange['24h']) : undefined);

      return computePerpCardWidth({
        percentChangeText: percentChange === undefined ? undefined : formatCompactPerpPercentChange(percentChange),
        symbol: market?.baseSymbol ?? item.ref.id,
      });
    },
    [chartsBySymbol, markets]
  );
  const handlePressSeeAll = useCallback(() => {
    if (placement) trackPlacementInteraction({ placement });
    analytics.track(event.discoverFeaturedCarouselSeeAllPressed, {
      placementId: PLACEMENT_ID,
      type: 'perps',
      provider: 'hyperliquid',
    });
    navigateToPerpsSearch();
  }, [placement]);
  const handleScrollSettle = useCallback(() => {
    if (placement) trackPlacementInteraction({ placement });
    analytics.track(event.discoverFeaturedCarouselScrolled, {
      placementId: PLACEMENT_ID,
      type: 'perps',
      provider: 'hyperliquid',
    });
  }, [placement]);

  if (!isLoading && items.length === 0) return null;

  const renderItem = (item: PlacementItem) => (placement ? <PerpMarketCard item={item} placement={placement} /> : <></>);

  return (
    <MarketCarousel
      data={items}
      getItemWidth={getPerpCardWidth}
      itemHeight={PERP_MARKET_CARD_HEIGHT}
      itemWidth={computePerpCardWidth({})}
      loading={isLoading}
      onPressSeeAll={handlePressSeeAll}
      onScrollSettle={handleScrollSettle}
      renderItem={renderItem}
      title={i18n.t(i18n.l.discover.placements.perps_title)}
    />
  );
}
