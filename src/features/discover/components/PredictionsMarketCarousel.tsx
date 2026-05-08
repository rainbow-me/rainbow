import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import { PLACEMENT_IDS } from '@/features/placements/constants';
import { useDiscoverPredictionsStore } from '@/features/placements/stores/discover/discoverPredictionsStore';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { type Placement, type PlacementItem } from '@/features/placements/types';
import {
  LoadingSkeleton,
  HEIGHT as POLYMARKET_EVENTS_LIST_ITEM_HEIGHT,
  PolymarketEventsListItem,
} from '@/features/polymarket/components/polymarket-events-list/PolymarketEventsListItem';
import { type PolymarketEvent, type PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { navigateToPolymarket, navigateToPolymarketEvent } from '@/features/polymarket/utils/navigateToPolymarket';
import * as i18n from '@/languages';

import { MarketCarousel } from './MarketCarousel';

const PLACEMENT_ID = PLACEMENT_IDS.DISCOVER_PREDICTIONS_CAROUSEL;
const PREDICTION_TILE_WIDTH = 280;
const EMPTY_EVENTS: PolymarketEvent[] = [];

function trackPredictionPress({ eventData, item, placement }: { eventData: PolymarketEvent; item: PlacementItem; placement: Placement }) {
  const market: PolymarketMarket | undefined = eventData.markets[0];
  const polymarketPayload = {
    provider: 'polymarket' as const,
    eventId: eventData.id,
    eventSlug: eventData.slug,
    eventTitle: eventData.title,
    eventTicker: eventData.ticker,
    eventCategory: eventData.category,
    eventSubcategory: eventData.subcategory,
    eventNegRisk: eventData.negRisk,
    eventActive: eventData.active,
    eventClosed: eventData.closed,
    eventEnded: eventData.ended,
    eventLive: eventData.live,
    eventStartDate: eventData.startDate,
    eventEndDate: eventData.endDate,
    eventDate: eventData.eventDate,
    eventGameId: eventData.gameId,
    eventHomeTeamName: eventData.homeTeamName,
    eventAwayTeamName: eventData.awayTeamName,
    eventGameStatus: eventData.gameStatus,
    eventVolume: eventData.volume,
    eventLiquidity: eventData.liquidity,
    eventOpenInterest: eventData.openInterest,
    marketId: market?.id ?? '',
    marketSlug: market?.slug ?? '',
    marketQuestion: market?.question ?? '',
    marketConditionId: market?.conditionId ?? '',
    marketType: market?.marketType ?? eventData.markets[0]?.marketType,
    marketActive: market?.active ?? false,
    marketClosed: market?.closed ?? false,
    marketVolume: market?.volume ?? '0',
    marketLiquidity: market?.liquidity ?? '0',
    marketStartDate: market?.startDate ?? '',
    marketEndDate: market?.endDate ?? '',
  };
  analytics.track(event.placementInteraction, {
    id: placement.id,
    screen: placement.screen,
    order: placement.order,
    version: placement.version,
    updatedAt: placement.updatedAt,
    itemRefSource: item.ref.source,
    itemRefId: item.ref.id,
    itemOrder: item.order,
    type: 'predictions',
    ...polymarketPayload,
  });
  analytics.track(event.discoverFeaturedCarouselCardPressed, {
    placementId: placement.id,
    type: 'predictions',
    order: item.order,
    ...polymarketPayload,
  });
}

export function PredictionsMarketCarousel() {
  const placement = usePlacementsStore<Placement | undefined>(state => state.getPlacement(PLACEMENT_ID));
  const placementsLoading = usePlacementsStore(state => state.status === 'loading' || state.status === 'idle');
  const events = useDiscoverPredictionsStore(state => state.getData()?.events ?? EMPTY_EVENTS);
  const predictionsLoading = useDiscoverPredictionsStore(state => state.status === 'loading' || state.status === 'idle');

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
      onPressSeeAll={navigateToPolymarket}
      placement={placement}
      placementId={PLACEMENT_ID}
      provider="polymarket"
      renderItem={renderItem}
      title={i18n.t(i18n.l.discover.placements.predictions_title)}
      type="predictions"
    />
  );
}

const styles = StyleSheet.create({
  predictionTile: {
    height: POLYMARKET_EVENTS_LIST_ITEM_HEIGHT,
    width: PREDICTION_TILE_WIDTH,
  },
});
