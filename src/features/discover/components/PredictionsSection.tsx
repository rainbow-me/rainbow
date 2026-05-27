import { useCallback, useMemo } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { analytics } from '@/analytics';
import { event as analyticsEvent } from '@/analytics/event';
import { Skeleton } from '@/components/Skeleton';
import {
  PREDICTION_MARKET_EVENT_CARD_BORDER_RADIUS,
  PREDICTION_MARKET_EVENT_CARD_CAROUSEL_WIDTH,
  PREDICTION_MARKET_EVENT_CARD_HEIGHT,
  PREDICTION_MARKET_EVENT_CARD_WIDTH,
  PredictionMarketEventCard,
} from '@/features/discover/components/markets/cards/PredictionMarketEventCard';
import {
  PREDICTION_MARKET_TILE_CARD_BORDER_RADIUS,
  PREDICTION_MARKET_TILE_CARD_HEIGHT,
  PREDICTION_MARKET_TILE_CARD_WIDTH,
  PredictionMarketTileCard,
} from '@/features/discover/components/markets/cards/PredictionMarketTileCard';
import {
  getHeaderPress,
  getInitialRenderedItemCount,
  getSportsEventHeaderCount,
  getSurfaceLeagueId,
  isLiveSportsSurface,
  isSportsEventCardSurface,
  renderSectionLayout,
} from '@/features/discover/components/SectionLayout';
import {
  type DiscoverCardAnalyticsContext,
  type PlacementBackedSurfaceLeafWithDisplay,
  type PredictionsDisplay,
  type SectionDescriptor,
  type SurfaceLeafWithDisplay,
} from '@/features/discover/components/surfaceSectionTypes';
import { getPredictionsPlacementStore, type PredictionPlacementItem } from '@/features/placements/stores/derived/predictionsPlacementStore';
import { PREDICTION_DISPLAY_VALUES } from '@/features/placements/surfaces/constants';
import { type Display, type SurfaceLeaf } from '@/features/placements/surfaces/types';
import {
  HEIGHT as POLYMARKET_EVENTS_LIST_ITEM_HEIGHT,
  PolymarketEventsListItem,
  PREDICTION_CARD_BORDER_RADIUS,
} from '@/features/polymarket/components/polymarket-events-list/PolymarketEventsListItem';
import { isLiveSportsEvent } from '@/features/polymarket/screens/polymarket-sports-events-screen/buildPolymarketSportsEventsListData';
import { usePolymarketSportsEventsStore } from '@/features/polymarket/stores/polymarketSportsEventsStore';
import { navigateToPolymarketEvent } from '@/features/polymarket/utils/navigateToPolymarket';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';

const EMPTY_PREDICTION_PLACEMENT_ITEMS: PredictionPlacementItem[] = [];
const PREDICTION_TILE_WIDTH = Math.round((DEVICE_WIDTH - 20 * 2 - 8) / 2);

const PREDICTIONS_SECTION_DESCRIPTORS = {
  'prediction_tile.carousel': {
    layout: 'carousel',
    itemHeight: POLYMARKET_EVENTS_LIST_ITEM_HEIGHT,
    itemWidth: PREDICTION_TILE_WIDTH,
    renderItem: renderPredictionTile,
    renderSkeleton: renderPredictionSkeleton,
  },
  'prediction_tile.grid': {
    layout: 'grid',
    itemHeight: POLYMARKET_EVENTS_LIST_ITEM_HEIGHT,
    renderItem: renderPredictionGridTile,
    renderSkeleton: renderPredictionSkeleton,
  },
  'prediction_tile_widget.carousel': {
    layout: 'carousel',
    itemHeight: PREDICTION_MARKET_TILE_CARD_HEIGHT,
    itemVerticalBleed: 28,
    itemWidth: PREDICTION_MARKET_TILE_CARD_WIDTH,
    renderItem: renderPredictionWidget,
    renderSkeleton: renderPredictionWidgetSkeleton,
  },
  'prediction_event_card.carousel': {
    layout: 'carousel',
    itemHeight: PREDICTION_MARKET_EVENT_CARD_HEIGHT,
    itemWidth: PREDICTION_MARKET_EVENT_CARD_CAROUSEL_WIDTH,
    renderItem: renderPredictionEventCarouselCard,
    renderSkeleton: renderPredictionEventCarouselCardSkeleton,
    singleItemWidth: PREDICTION_MARKET_EVENT_CARD_WIDTH,
  },
  'prediction_event_card.list': {
    layout: 'list',
    renderItem: renderPredictionEventCard,
    renderSkeleton: renderPredictionEventCardSkeleton,
  },
} satisfies Record<PredictionsDisplay, SectionDescriptor<PredictionPlacementItem>>;

export function isPredictionsSurface(surface: SurfaceLeaf): surface is SurfaceLeafWithDisplay<PredictionsDisplay> {
  return (PREDICTION_DISPLAY_VALUES as readonly string[]).includes(surface.display);
}

export function PredictionsSection({ surface, surfaceId }: { surface: SurfaceLeafWithDisplay<PredictionsDisplay>; surfaceId: string }) {
  if (isLiveSportsSurface(surface)) {
    return <SportsLiveSection surface={surface} surfaceId={surfaceId} />;
  }

  if (!hasPlacement(surface)) return null;
  if (isSportsEventCardSurface(surface)) return <SportsEventPlacementSection surface={surface} surfaceId={surfaceId} />;
  return <PredictionsPlacementSection surface={surface} surfaceId={surfaceId} />;
}

function PredictionsPlacementSection({
  surface,
  surfaceId,
}: {
  surface: PlacementBackedSurfaceLeafWithDisplay<PredictionsDisplay>;
  surfaceId: string;
}) {
  const useStore = useMemo(() => getPredictionsPlacementStore(surface.placement), [surface.placement]);
  const result = useStore();
  const descriptor = PREDICTIONS_SECTION_DESCRIPTORS[surface.display];

  return renderSectionLayout({
    data: result.items,
    descriptor,
    loading: result.isLoading,
    onPressSeeAll: getHeaderPress(surface.destination),
    placement: result.placement,
    surface,
    surfaceId,
  });
}

function SportsEventPlacementSection({
  surface,
  surfaceId,
}: {
  surface: PlacementBackedSurfaceLeafWithDisplay<PredictionsDisplay>;
  surfaceId: string;
}) {
  const useStore = useMemo(() => getPredictionsPlacementStore(surface.placement), [surface.placement]);
  const result = useStore();
  const sportsEvents = usePolymarketSportsEventsStore(state => state.getData());
  const displayedItemCount = getInitialRenderedItemCount(result.items, surface.limit);
  const descriptor = getSportsEventSectionDescriptor(surface);
  const headerCount = getSportsEventHeaderCount({
    displayedItemCount,
    events: sportsEvents,
    surface,
  });

  return renderSectionLayout({
    data: result.items,
    descriptor,
    headerCount,
    loading: result.isLoading,
    onPressSeeAll: getHeaderPress(surface.destination),
    placement: result.placement,
    surface,
    surfaceId,
  });
}

function SportsLiveSection({ surface, surfaceId }: { surface: SurfaceLeafWithDisplay<PredictionsDisplay>; surfaceId: string }) {
  const events = usePolymarketSportsEventsStore(state => state.getData());
  const isLoading = usePolymarketSportsEventsStore(state => state.getStatus('isLoading') || state.getStatus('isIdle'));
  const items = useMemo<PredictionPlacementItem[]>(() => {
    if (!events) return EMPTY_PREDICTION_PLACEMENT_ITEMS;
    const liveEvents = events.filter(isLiveSportsEvent);
    if (!liveEvents.length) return EMPTY_PREDICTION_PLACEMENT_ITEMS;
    return liveEvents.map(event => ({ id: event.id, event }));
  }, [events]);
  const displayedItemCount = getInitialRenderedItemCount(items, surface.limit);
  const descriptor = getSportsEventSectionDescriptor(surface);
  const headerCount = getSportsEventHeaderCount({
    displayedItemCount,
    events,
    surface,
  });

  return renderSectionLayout({
    data: items,
    descriptor,
    headerCount,
    loading: isLoading,
    onPressSeeAll: getHeaderPress(surface.destination),
    placement: undefined,
    surface,
    surfaceId,
  });
}

function hasPlacement<TDisplay extends Display>(
  surface: SurfaceLeafWithDisplay<TDisplay>
): surface is PlacementBackedSurfaceLeafWithDisplay<TDisplay> {
  return typeof surface.placement === 'string' && surface.placement.length > 0;
}

function renderPredictionTile(item: PredictionPlacementItem, _: number, analyticsContext: DiscoverCardAnalyticsContext) {
  return <PredictionListItem analyticsContext={analyticsContext} item={item} style={styles.predictionTile} />;
}

function renderPredictionGridTile(item: PredictionPlacementItem, width: number, analyticsContext: DiscoverCardAnalyticsContext) {
  return (
    <PredictionListItem analyticsContext={analyticsContext} item={item} style={{ height: POLYMARKET_EVENTS_LIST_ITEM_HEIGHT, width }} />
  );
}

function PredictionListItem({
  analyticsContext,
  item,
  style,
}: {
  analyticsContext: DiscoverCardAnalyticsContext;
  item: PredictionPlacementItem;
  style: StyleProp<ViewStyle>;
}) {
  const onPress = useCallback(() => {
    analytics.track(analyticsEvent.discoverCardPressed, {
      placementId: analyticsContext.placementId,
      placementSource: analyticsContext.placementSource,
      surfaceId: analyticsContext.surfaceId,
      placementTitle: analyticsContext.placementTitle,
      itemOrder: analyticsContext.itemOrder,
      itemId: analyticsContext.itemId,
      marketId: item.event.id,
      marketName: item.event.title,
      marketSlug: item.event.slug,
      marketSymbol: item.event.ticker,
    });
    navigateToPolymarketEvent({ event: item.event, eventId: item.event.id });
  }, [analyticsContext, item.event]);

  return <PolymarketEventsListItem event={item.event} onPress={onPress} shouldActivateOnStart={false} style={style} />;
}

function renderPredictionSkeleton() {
  return (
    <Skeleton borderRadius={PREDICTION_CARD_BORDER_RADIUS} height={POLYMARKET_EVENTS_LIST_ITEM_HEIGHT} width={PREDICTION_TILE_WIDTH} />
  );
}

function renderPredictionWidget(item: PredictionPlacementItem, _: number, analyticsContext: DiscoverCardAnalyticsContext) {
  return <PredictionMarketTileCard analyticsContext={analyticsContext} event={item.event} />;
}

function renderPredictionWidgetSkeleton() {
  return (
    <Skeleton
      borderRadius={PREDICTION_MARKET_TILE_CARD_BORDER_RADIUS}
      height={PREDICTION_MARKET_TILE_CARD_HEIGHT}
      width={PREDICTION_MARKET_TILE_CARD_WIDTH}
    />
  );
}

function renderPredictionEventCard(item: PredictionPlacementItem, analyticsContext: DiscoverCardAnalyticsContext) {
  return <PredictionMarketEventCard analyticsContext={analyticsContext} event={item.event} />;
}

function renderPredictionEventCarouselCard(item: PredictionPlacementItem, width: number, analyticsContext: DiscoverCardAnalyticsContext) {
  return <PredictionMarketEventCard analyticsContext={analyticsContext} event={item.event} width={width} />;
}

function getSportsEventSectionDescriptor(surface: SurfaceLeafWithDisplay<PredictionsDisplay>): SectionDescriptor<PredictionPlacementItem> {
  const shouldHideLeagueHeader = getSurfaceLeagueId(surface) !== undefined;

  if (!shouldHideLeagueHeader) return PREDICTIONS_SECTION_DESCRIPTORS[surface.display];

  switch (surface.display) {
    case 'prediction_event_card.carousel':
      return {
        ...PREDICTIONS_SECTION_DESCRIPTORS[surface.display],
        renderItem: renderPredictionEventCarouselCardWithoutLeagueHeader,
      };
    case 'prediction_event_card.list':
      return {
        ...PREDICTIONS_SECTION_DESCRIPTORS[surface.display],
        renderItem: renderPredictionEventCardWithoutLeagueHeader,
      };
    case 'prediction_tile.carousel':
    case 'prediction_tile.grid':
    case 'prediction_tile_widget.carousel':
      return PREDICTIONS_SECTION_DESCRIPTORS[surface.display];
  }
}

function renderPredictionEventCardWithoutLeagueHeader(item: PredictionPlacementItem, analyticsContext: DiscoverCardAnalyticsContext) {
  return <PredictionMarketEventCard analyticsContext={analyticsContext} event={item.event} hideLeagueHeader />;
}

function renderPredictionEventCarouselCardWithoutLeagueHeader(
  item: PredictionPlacementItem,
  width: number,
  analyticsContext: DiscoverCardAnalyticsContext
) {
  return <PredictionMarketEventCard analyticsContext={analyticsContext} event={item.event} hideLeagueHeader width={width} />;
}

function renderPredictionEventCardSkeleton() {
  return (
    <Skeleton
      borderRadius={PREDICTION_MARKET_EVENT_CARD_BORDER_RADIUS}
      height={PREDICTION_MARKET_EVENT_CARD_HEIGHT}
      width={PREDICTION_MARKET_EVENT_CARD_WIDTH}
    />
  );
}

function renderPredictionEventCarouselCardSkeleton() {
  return (
    <Skeleton
      borderRadius={PREDICTION_MARKET_EVENT_CARD_BORDER_RADIUS}
      height={PREDICTION_MARKET_EVENT_CARD_HEIGHT}
      width={PREDICTION_MARKET_EVENT_CARD_CAROUSEL_WIDTH}
    />
  );
}

const styles = StyleSheet.create({
  predictionTile: {
    height: POLYMARKET_EVENTS_LIST_ITEM_HEIGHT,
    width: PREDICTION_TILE_WIDTH,
  },
});
