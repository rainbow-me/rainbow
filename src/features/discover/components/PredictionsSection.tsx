import { useCallback, useMemo, type ReactNode } from 'react';
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
import { getHeaderPress, isEventCardSurface, renderSectionLayout } from '@/features/discover/components/SectionLayout';
import {
  type DiscoverCardAnalyticsContext,
  type PlacementBackedSurfaceLeafWithDisplay,
  type PredictionsDisplay,
  type SectionDescriptor,
  type SurfaceLeafWithDisplay,
} from '@/features/discover/components/surfaceSectionTypes';
import {
  getSportsSurfaceIntent,
  selectSportsEventsForIntent,
  type SportsSurfaceIntent,
} from '@/features/discover/utils/sportsSurfaceIntent';
import { usePredictionsPlacement, type PredictionPlacementItem } from '@/features/placements/stores/derived/predictionsPlacementStore';
import { PREDICTION_DISPLAY_VALUES } from '@/features/placements/surfaces/constants';
import { type Display, type SurfaceLeaf } from '@/features/placements/surfaces/types';
import {
  HEIGHT as POLYMARKET_EVENTS_LIST_ITEM_HEIGHT,
  PolymarketEventsListItem,
  PREDICTION_CARD_BORDER_RADIUS,
} from '@/features/polymarket/components/polymarket-events-list/PolymarketEventsListItem';
import { usePolymarketSportsEventsStore } from '@/features/polymarket/stores/polymarketSportsEventsStore';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { navigateToPolymarketEvent } from '@/features/polymarket/utils/navigateToPolymarket';
import { logger } from '@/logger';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';

const PREDICTION_TILE_WIDTH = Math.round((DEVICE_WIDTH - 20 * 2 - 8) / 2);
const PREDICTION_TILE_SKELETON = {
  borderRadius: PREDICTION_CARD_BORDER_RADIUS,
  height: POLYMARKET_EVENTS_LIST_ITEM_HEIGHT,
  width: PREDICTION_TILE_WIDTH,
};
const PREDICTION_WIDGET_SKELETON = {
  borderRadius: PREDICTION_MARKET_TILE_CARD_BORDER_RADIUS,
  height: PREDICTION_MARKET_TILE_CARD_HEIGHT,
  width: PREDICTION_MARKET_TILE_CARD_WIDTH,
};
const PREDICTION_EVENT_CARD_SKELETON = {
  borderRadius: PREDICTION_MARKET_EVENT_CARD_BORDER_RADIUS,
  height: PREDICTION_MARKET_EVENT_CARD_HEIGHT,
  width: PREDICTION_MARKET_EVENT_CARD_WIDTH,
};
const PREDICTION_EVENT_CAROUSEL_CARD_SKELETON = {
  borderRadius: PREDICTION_MARKET_EVENT_CARD_BORDER_RADIUS,
  height: PREDICTION_MARKET_EVENT_CARD_HEIGHT,
  width: PREDICTION_MARKET_EVENT_CARD_CAROUSEL_WIDTH,
};
const renderPredictionEventCardList = renderEventCardList(false);
const renderPredictionEventCardListWithoutLeagueHeader = renderEventCardList(true);
const renderPredictionEventCardSized = renderEventCardSized(false);
const renderPredictionEventCardSizedWithoutLeagueHeader = renderEventCardSized(true);

type PredictionSkeletonConfig = {
  borderRadius: number;
  height: number;
  width: number;
};

const PREDICTIONS_SECTION_DESCRIPTORS = {
  'prediction_tile.carousel': {
    layout: 'carousel',
    itemHeight: POLYMARKET_EVENTS_LIST_ITEM_HEIGHT,
    itemWidth: PREDICTION_TILE_WIDTH,
    renderItem: renderPredictionTile,
    renderSkeleton: () => renderPredictionSkeleton(PREDICTION_TILE_SKELETON),
  },
  'prediction_tile.grid': {
    layout: 'grid',
    itemHeight: POLYMARKET_EVENTS_LIST_ITEM_HEIGHT,
    renderItem: renderPredictionGridTile,
    renderSkeleton: () => renderPredictionSkeleton(PREDICTION_TILE_SKELETON),
  },
  'prediction_tile_widget.carousel': {
    layout: 'carousel',
    itemHeight: PREDICTION_MARKET_TILE_CARD_HEIGHT,
    itemVerticalBleed: 28,
    itemWidth: PREDICTION_MARKET_TILE_CARD_WIDTH,
    renderItem: renderPredictionWidget,
    renderSkeleton: () => renderPredictionSkeleton(PREDICTION_WIDGET_SKELETON),
  },
  'prediction_event_card.carousel': {
    layout: 'carousel',
    itemHeight: PREDICTION_MARKET_EVENT_CARD_HEIGHT,
    itemWidth: PREDICTION_MARKET_EVENT_CARD_CAROUSEL_WIDTH,
    renderItem: renderPredictionEventCardSized,
    renderSkeleton: () => renderPredictionSkeleton(PREDICTION_EVENT_CAROUSEL_CARD_SKELETON),
    singleItemWidth: PREDICTION_MARKET_EVENT_CARD_WIDTH,
  },
  'prediction_event_card.list': {
    layout: 'list',
    renderItem: renderPredictionEventCardList,
    renderSkeleton: () => renderPredictionSkeleton(PREDICTION_EVENT_CARD_SKELETON),
  },
} satisfies Record<PredictionsDisplay, SectionDescriptor<PredictionPlacementItem>>;

export function isPredictionsSurface(surface: SurfaceLeaf): surface is SurfaceLeafWithDisplay<PredictionsDisplay> {
  return (PREDICTION_DISPLAY_VALUES as readonly string[]).includes(surface.display);
}

export function PredictionsSection({ surface, surfaceId }: { surface: SurfaceLeafWithDisplay<PredictionsDisplay>; surfaceId: string }) {
  const sportsIntent = useMemo(() => getSportsSurfaceIntent(surface), [surface]);

  if (!hasPlacement(surface)) {
    if (sportsIntent) return <SportsQuerySection sportsIntent={sportsIntent} surface={surface} surfaceId={surfaceId} />;
    return unsupportedUnplacedPredictionSurface(surface, surfaceId);
  }

  if (isEventCardSurface(surface)) {
    return <SportsEventPlacementSection sportsIntent={sportsIntent} surface={surface} surfaceId={surfaceId} />;
  }

  return <PredictionsPlacementSection surface={surface} surfaceId={surfaceId} />;
}

function PredictionsPlacementSection({
  surface,
  surfaceId,
}: {
  surface: PlacementBackedSurfaceLeafWithDisplay<PredictionsDisplay>;
  surfaceId: string;
}) {
  const result = usePredictionsPlacement(surface.placement);
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
  sportsIntent,
  surface,
  surfaceId,
}: {
  sportsIntent: SportsSurfaceIntent | null;
  surface: PlacementBackedSurfaceLeafWithDisplay<PredictionsDisplay>;
  surfaceId: string;
}) {
  const result = usePredictionsPlacement(surface.placement);
  const sportsEvents = usePolymarketSportsEventsStore(state => state.getData());

  if (!sportsIntent) return <PredictionsPlacementSection surface={surface} surfaceId={surfaceId} />;

  const descriptor = getSportsEventSectionDescriptor(surface);
  const headerCount = getSportsEventHeaderCount({
    events: sportsEvents,
    intent: sportsIntent,
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

function SportsQuerySection({
  sportsIntent,
  surface,
  surfaceId,
}: {
  sportsIntent: SportsSurfaceIntent;
  surface: SurfaceLeafWithDisplay<PredictionsDisplay>;
  surfaceId: string;
}) {
  const events = usePolymarketSportsEventsStore(state => state.getData());
  const isLoading = usePolymarketSportsEventsStore(state => state.enabled && (state.getStatus('isLoading') || state.getStatus('isIdle')));
  const items = useMemo<PredictionPlacementItem[]>(() => {
    if (!events) return [];
    const selectedEvents = selectSportsEventsForIntent(events, sportsIntent);
    if (!selectedEvents.length) return [];
    return selectedEvents.map(event => ({ id: event.id, event }));
  }, [events, sportsIntent]);
  const descriptor = getSportsEventSectionDescriptor(surface);
  const headerCount = getSportsEventHeaderCount({
    events,
    intent: sportsIntent,
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

function unsupportedUnplacedPredictionSurface(surface: SurfaceLeafWithDisplay<PredictionsDisplay>, surfaceId: string) {
  logger.warn('[PredictionsSection]: unsupported unplaced prediction surface', {
    display: surface.display,
    sectionId: surface.id,
    surfaceId,
  });
  return null;
}

function getSportsEventHeaderCount({
  events,
  intent,
}: {
  events: PolymarketEvent[] | null | undefined;
  intent: SportsSurfaceIntent | null;
}): number | undefined {
  if (!events || !intent) return undefined;

  const count = selectSportsEventsForIntent(events, intent).length;
  return count > 0 ? count : undefined;
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
    if (analyticsContext.placementId) {
      analytics.track(analyticsEvent.placementInteraction, {
        placementId: analyticsContext.placementId,
        source: analyticsContext.placementSource,
        surfaceId: analyticsContext.surfaceId,
        type: analyticsContext.placementType,
      });
    }
    navigateToPolymarketEvent({ event: item.event, eventId: item.event.id });
  }, [analyticsContext, item.event]);

  return <PolymarketEventsListItem event={item.event} onPress={onPress} shouldActivateOnStart={false} style={style} />;
}

function renderPredictionSkeleton({ borderRadius, height, width }: PredictionSkeletonConfig) {
  return <Skeleton borderRadius={borderRadius} height={height} width={width} />;
}

function renderPredictionWidget(item: PredictionPlacementItem, _: number, analyticsContext: DiscoverCardAnalyticsContext) {
  return <PredictionMarketTileCard analyticsContext={analyticsContext} event={item.event} />;
}

function getSportsEventSectionDescriptor(surface: SurfaceLeafWithDisplay<PredictionsDisplay>): SectionDescriptor<PredictionPlacementItem> {
  const intent = getSportsSurfaceIntent(surface);
  const shouldHideLeagueHeader = intent !== null && 'leagueId' in intent;

  if (!shouldHideLeagueHeader) return PREDICTIONS_SECTION_DESCRIPTORS[surface.display];

  switch (surface.display) {
    case 'prediction_event_card.carousel':
      return {
        ...PREDICTIONS_SECTION_DESCRIPTORS[surface.display],
        renderItem: renderPredictionEventCardSizedWithoutLeagueHeader,
      };
    case 'prediction_event_card.list':
      return {
        ...PREDICTIONS_SECTION_DESCRIPTORS[surface.display],
        renderItem: renderPredictionEventCardListWithoutLeagueHeader,
      };
    case 'prediction_tile.carousel':
    case 'prediction_tile.grid':
    case 'prediction_tile_widget.carousel':
      return PREDICTIONS_SECTION_DESCRIPTORS[surface.display];
  }
}

function renderEventCardList(hideLeagueHeader: boolean) {
  return function render(item: PredictionPlacementItem, analyticsContext: DiscoverCardAnalyticsContext): ReactNode {
    return (
      <PredictionMarketEventCard
        analyticsContext={analyticsContext}
        event={item.event}
        hideLeagueHeader={hideLeagueHeader}
        subscribeLiveOdds
      />
    );
  };
}

function renderEventCardSized(hideLeagueHeader: boolean) {
  return function render(item: PredictionPlacementItem, width: number, analyticsContext: DiscoverCardAnalyticsContext): ReactNode {
    return (
      <PredictionMarketEventCard
        analyticsContext={analyticsContext}
        event={item.event}
        hideLeagueHeader={hideLeagueHeader}
        subscribeLiveOdds
        width={width}
      />
    );
  };
}

const styles = StyleSheet.create({
  predictionTile: {
    height: POLYMARKET_EVENTS_LIST_ITEM_HEIGHT,
    width: PREDICTION_TILE_WIDTH,
  },
});
