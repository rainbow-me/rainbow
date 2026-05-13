import React, { useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import { PLACEMENT_IDS } from '@/features/placements/constants';
import { trackPlacementInteraction } from '@/features/placements/engagement/trackInteraction';
import { useDiscoverPlacementsStore } from '@/features/placements/stores/discover/discoverPlacementsStore';
import { useDiscoverPredictionsStore } from '@/features/placements/stores/discover/discoverPredictionsStore';
import { type Placement, type PlacementItem } from '@/features/placements/types';
import {
  LoadingSkeleton,
  HEIGHT as POLYMARKET_EVENTS_LIST_ITEM_HEIGHT,
  PolymarketEventsListItem,
} from '@/features/polymarket/components/polymarket-events-list/PolymarketEventsListItem';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { navigateToPolymarket, navigateToPolymarketEvent } from '@/features/polymarket/utils/navigateToPolymarket';
import * as i18n from '@/languages';

import { MarketCarousel } from './MarketCarousel';

const PLACEMENT_ID = PLACEMENT_IDS.DISCOVER_PREDICTIONS_CAROUSEL;
const PREDICTION_TILE_WIDTH = 178;
const EMPTY_EVENTS: PolymarketEvent[] = [];

function trackPredictionPress({ eventData, item, placement }: { eventData: PolymarketEvent; item: PlacementItem; placement: Placement }) {
  const market = eventData.markets[0];
  trackPlacementInteraction({ item, placement });
  analytics.track(event.discoverFeaturedCarouselCardPressed, {
    placementId: placement.id,
    type: 'predictions',
    order: item.order,
    provider: 'polymarket',
    eventSlug: eventData.slug,
    eventId: eventData.id,
    eventTitle: eventData.title,
    eventTicker: eventData.ticker,
    eventCategory: eventData.category,
    eventSubcategory: eventData.subcategory,
    eventGameStatus: eventData.gameStatus,
    eventHomeTeamName: eventData.homeTeamName,
    eventAwayTeamName: eventData.awayTeamName,
    marketId: market?.id,
    marketSlug: market?.slug,
    marketQuestion: market?.question,
    marketType: market?.marketType,
  });
}

export function PredictionsMarketCarousel() {
  const placement = useDiscoverPlacementsStore<Placement | undefined>(state => state[PLACEMENT_ID]);
  const placementsLoading = useDiscoverPlacementsStore(state => {
    const items = state[PLACEMENT_ID]?.items ?? [];
    return items.length === 0 && state.isInitialLoad;
  });
  const events = useDiscoverPredictionsStore(state => state.getData()?.events ?? EMPTY_EVENTS);
  const predictionsLoading = useDiscoverPredictionsStore(state => {
    const eventsLength = state.getData()?.events.length ?? 0;
    return eventsLength === 0 && (state.status === 'loading' || state.status === 'idle');
  });

  const eventsById = useMemo(() => {
    const map = new Map<string, PolymarketEvent>();
    for (const event of events) map.set(event.id, event);
    return map;
  }, [events]);

  const items = useMemo(
    () => placement?.items.filter(item => item.ref.source === 'polymarket' && eventsById.has(item.ref.id)) ?? [],
    [placement, eventsById]
  );
  const isLoading = placementsLoading || predictionsLoading;
  const handlePressSeeAll = useCallback(() => {
    if (placement) trackPlacementInteraction({ placement });
    analytics.track(event.discoverFeaturedCarouselSeeAllPressed, {
      placementId: PLACEMENT_ID,
      type: 'predictions',
      provider: 'polymarket',
    });
    navigateToPolymarket();
  }, [placement]);
  const handleScrollSettle = useCallback(() => {
    if (placement) trackPlacementInteraction({ placement });
    analytics.track(event.discoverFeaturedCarouselScrolled, {
      placementId: PLACEMENT_ID,
      type: 'predictions',
      provider: 'polymarket',
    });
  }, [placement]);

  if (!isLoading && items.length === 0) return null;

  const renderItem = (item: PlacementItem) => {
    const eventData = eventsById.get(item.ref.id);
    if (!eventData) return <LoadingSkeleton />;
    if (!placement) return <LoadingSkeleton />;
    return (
      <PolymarketEventsListItem
        event={eventData}
        onPress={() => {
          trackPredictionPress({ eventData, item, placement });
          navigateToPolymarketEvent({ event: eventData, eventId: eventData.id });
        }}
        shouldActivateOnStart={false}
        style={styles.predictionTile}
      />
    );
  };

  return (
    <MarketCarousel
      data={items}
      itemHeight={POLYMARKET_EVENTS_LIST_ITEM_HEIGHT}
      itemWidth={PREDICTION_TILE_WIDTH}
      loading={isLoading}
      onPressSeeAll={handlePressSeeAll}
      onScrollSettle={handleScrollSettle}
      renderItem={renderItem}
      title={i18n.t(i18n.l.discover.placements.predictions_title)}
    />
  );
}

const styles = StyleSheet.create({
  predictionTile: {
    height: POLYMARKET_EVENTS_LIST_ITEM_HEIGHT,
    width: PREDICTION_TILE_WIDTH,
  },
});
