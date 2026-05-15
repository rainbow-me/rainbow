import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';

import { CarouselCardSkeleton } from '@/features/discover/components/carousel/CarouselCardSkeleton';
import { MarketCarousel } from '@/features/discover/components/carousel/MarketCarousel';
import { usePlacementCardTrackPress } from '@/features/discover/components/carousel/placementCardContext';
import { PLACEMENT_IDS } from '@/features/placements/constants';
import { usePredictionsPlacementStore, type PredictionPlacementItem } from '@/features/placements/stores/derived/predictionsPlacementStore';
import { type PlacementItemAnalyticsMetadata } from '@/features/placements/types';
import {
  HEIGHT as POLYMARKET_EVENTS_LIST_ITEM_HEIGHT,
  PolymarketEventsListItem,
  PREDICTION_CARD_BORDER_RADIUS,
} from '@/features/polymarket/components/polymarket-events-list/PolymarketEventsListItem';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { navigateToPolymarket, navigateToPolymarketEvent } from '@/features/polymarket/utils/navigateToPolymarket';
import * as i18n from '@/languages';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';

const ITEM_GAP = 8;
const HORIZONTAL_PADDING = 20;
const PREDICTION_TILE_WIDTH = (DEVICE_WIDTH - HORIZONTAL_PADDING * 2 - ITEM_GAP) / 2;

export function PredictionsCarousel() {
  const { isLoading, items, placement } = usePredictionsPlacementStore();

  return (
    <MarketCarousel
      data={items}
      itemHeight={POLYMARKET_EVENTS_LIST_ITEM_HEIGHT}
      itemWidth={PREDICTION_TILE_WIDTH}
      loading={isLoading}
      onPressSeeAll={navigateToPolymarket}
      placement={placement}
      placementId={PLACEMENT_IDS.PREDICTIONS}
      renderItem={renderPredictionTile}
      renderSkeleton={renderPredictionSkeleton}
      title={i18n.t(i18n.l.discover.placements.predictions_title)}
    />
  );
}

function renderPredictionTile(item: PredictionPlacementItem) {
  return <PredictionTile event={item.event} />;
}

function renderPredictionSkeleton() {
  return (
    <CarouselCardSkeleton
      borderRadius={PREDICTION_CARD_BORDER_RADIUS}
      height={POLYMARKET_EVENTS_LIST_ITEM_HEIGHT}
      width={PREDICTION_TILE_WIDTH}
    />
  );
}

function PredictionTile({ event }: { event: PolymarketEvent }) {
  const trackPress = usePlacementCardTrackPress();

  const onPress = useCallback(() => {
    trackPress?.(readPredictionAnalyticsMetadata(event));
    navigateToPolymarketEvent({ event, eventId: event.id });
  }, [event, trackPress]);

  return <PolymarketEventsListItem event={event} onPress={onPress} shouldActivateOnStart={false} style={styles.predictionTile} />;
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
