import React, { useCallback, useMemo, type ReactElement } from 'react';
import { StyleSheet } from 'react-native';

import { PLACEMENT_IDS } from '@/features/placements/constants';
import { useDiscoverPredictionsStore } from '@/features/placements/stores/discover/discoverPredictionsStore';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { type PlacementItem, type PlacementItemAnalyticsMetadata } from '@/features/placements/types';
import {
  LoadingSkeleton,
  HEIGHT as POLYMARKET_EVENTS_LIST_ITEM_HEIGHT,
  PolymarketEventsListItem,
} from '@/features/polymarket/components/polymarket-events-list/PolymarketEventsListItem';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { navigateToPolymarket, navigateToPolymarketEvent } from '@/features/polymarket/utils/navigateToPolymarket';
import * as i18n from '@/languages';

import { MarketCarousel } from './MarketCarousel';

const PLACEMENT_ID = PLACEMENT_IDS.PREDICTIONS;
const PREDICTION_TILE_WIDTH = 178;
const EMPTY_EVENTS: PolymarketEvent[] = [];

export function PredictionsMarketCarousel() {
  const placement = usePlacementsStore(state => state.getPlacement(PLACEMENT_ID));
  const placementsLoading = usePlacementsStore(state => {
    const items = state.getPlacement(PLACEMENT_ID)?.items ?? [];
    return items.length === 0 && state.getStatus('isInitialLoad');
  });
  const events = useDiscoverPredictionsStore(state => state.getData()?.events ?? EMPTY_EVENTS);
  const predictionsLoading = useDiscoverPredictionsStore(state => {
    const eventsLength = state.getData()?.events.length ?? 0;
    return eventsLength === 0 && state.getStatus('isInitialLoad');
  });

  const eventsById = useMemo(() => {
    const map = new Map<string, PolymarketEvent>();
    for (const event of events) map.set(event.id, event);
    return map;
  }, [events]);

  const items = useMemo(
    () => placement?.items.filter(item => item.ref.source === 'polymarket' && eventsById.has(item.ref.id)) ?? [],
    [eventsById, placement]
  );
  const isLoading = placementsLoading || predictionsLoading;

  const renderItem = useCallback(
    (item: PlacementItem, trackPress: (metadata?: PlacementItemAnalyticsMetadata) => void): ReactElement => {
      const eventData = eventsById.get(item.ref.id);
      if (!eventData) return <LoadingSkeleton />;

      return (
        <PolymarketEventsListItem
          event={eventData}
          onPress={() => {
            trackPress(readPredictionAnalyticsMetadata(eventData));
            navigateToPolymarketEvent({ event: eventData, eventId: eventData.id });
          }}
          shouldActivateOnStart={false}
          style={styles.predictionTile}
        />
      );
    },
    [eventsById]
  );

  if (!isLoading && items.length === 0) return null;

  return (
    <MarketCarousel
      data={items}
      itemHeight={POLYMARKET_EVENTS_LIST_ITEM_HEIGHT}
      itemWidth={PREDICTION_TILE_WIDTH}
      keyExtractor={getPlacementItemKey}
      loading={isLoading}
      onSeeAll={navigateToPolymarket}
      placement={placement}
      placementId={PLACEMENT_ID}
      renderItem={renderItem}
      title={i18n.t(i18n.l.discover.placements.predictions_title)}
    />
  );
}

function getPlacementItemKey(item: PlacementItem): string {
  return `${item.ref.source}:${item.ref.id}`;
}

function readPredictionAnalyticsMetadata(eventData: PolymarketEvent): PlacementItemAnalyticsMetadata {
  const market = eventData.markets[0];

  return {
    marketId: market?.id ?? eventData.id,
    marketName: market?.question ?? eventData.title,
    marketSlug: market?.slug ?? eventData.slug,
    marketSymbol: eventData.ticker,
  };
}

const styles = StyleSheet.create({
  predictionTile: {
    height: POLYMARKET_EVENTS_LIST_ITEM_HEIGHT,
    width: PREDICTION_TILE_WIDTH,
  },
});
