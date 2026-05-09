import React, { useCallback, type ReactElement } from 'react';
import { StyleSheet } from 'react-native';

import { PLACEMENT_IDS } from '@/features/placements/constants';
import { useDiscoverPredictions, type PredictionItem } from '@/features/placements/stores/discover/discoverPredictionsStore';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { type PlacementItemAnalyticsMetadata } from '@/features/placements/types';
import {
  HEIGHT as POLYMARKET_EVENTS_LIST_ITEM_HEIGHT,
  PolymarketEventsListItem,
} from '@/features/polymarket/components/polymarket-events-list/PolymarketEventsListItem';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { navigateToPolymarket, navigateToPolymarketEvent } from '@/features/polymarket/utils/navigateToPolymarket';
import * as i18n from '@/languages';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';

import { MarketCarousel } from './MarketCarousel';

const PLACEMENT_ID = PLACEMENT_IDS.PREDICTIONS;

const ITEM_GAP = 8;
const HORIZONTAL_PADDING = 20;
const PREDICTION_TILE_WIDTH = (DEVICE_WIDTH - HORIZONTAL_PADDING * 2 - ITEM_GAP) / 2;

export function PredictionsMarketCarousel() {
  const { isLoading, items } = useDiscoverPredictions();
  const placement = usePlacementsStore(s => s.getPlacement(PLACEMENT_ID));

  const renderItem = useCallback((item: PredictionItem, trackPress: (metadata?: PlacementItemAnalyticsMetadata) => void): ReactElement => {
    const event = item.event;
    return (
      <PolymarketEventsListItem
        event={event}
        onPress={() => {
          trackPress(readPredictionAnalyticsMetadata(event));
          navigateToPolymarketEvent({ event, eventId: event.id });
        }}
        shouldActivateOnStart={false}
        style={styles.predictionTile}
      />
    );
  }, []);

  return (
    <MarketCarousel
      data={items}
      itemHeight={POLYMARKET_EVENTS_LIST_ITEM_HEIGHT}
      itemWidth={PREDICTION_TILE_WIDTH}
      keyExtractor={getPlacementItemKey}
      loading={isLoading}
      onPressSeeAll={navigateToPolymarket}
      placement={placement}
      placementId={PLACEMENT_ID}
      renderItem={renderItem}
      title={i18n.t(i18n.l.discover.placements.predictions_title)}
    />
  );
}

function getPlacementItemKey(item: PredictionItem): string {
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
