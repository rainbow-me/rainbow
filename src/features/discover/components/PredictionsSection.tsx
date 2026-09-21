import { useCallback, useEffect, useMemo } from 'react';
import { Platform, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Skeleton } from '@/components/Skeleton';
import { globalColors, useColorMode } from '@/design-system';
import { opacity } from '@/design-system/utils/opacity';
import {
  getTileWidgetTokenIds,
  PREDICTION_MARKET_TILE_CARD_BORDER_RADIUS,
  PREDICTION_MARKET_TILE_CARD_HEIGHT,
  PREDICTION_MARKET_TILE_CARD_WIDTH,
  PredictionMarketTileCard,
} from '@/features/discover/components/markets/cards/PredictionMarketTileCard';
import { PredictionEventsSection } from '@/features/discover/components/PredictionEventsSection';
import { renderSectionLayout } from '@/features/discover/components/SectionLayout';
import {
  type CardPressHandler,
  type DiscoverViewport,
  type OrderPressHandler,
  type PlacementBackedSurfaceLeafWithDisplay,
  type SectionDescriptor,
  type SurfaceLeafWithDisplay,
} from '@/features/discover/types/sectionLayout';
import { hasDestinationRoot, navigateDiscoverDestination } from '@/features/discover/utils/navigation';
import { usePredictionsPlacement, type PredictionPlacementItem } from '@/features/placements/stores/derived/predictionsPlacementStore';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { isEventCardDisplay, PREDICTION_DISPLAY_VALUES } from '@/features/placements/surfaces/constants';
import { useIsDiscoverSurfacePlacementPending } from '@/features/placements/surfaces/hooks/useDiscoverSurfacePlacements';
import { type Display, type SurfaceId, type SurfaceLeaf } from '@/features/placements/surfaces/types';
import {
  getPolymarketEventsListTokenIds,
  HEIGHT as POLYMARKET_EVENTS_LIST_ITEM_HEIGHT,
  PolymarketEventsListItem,
  PREDICTION_CARD_BORDER_RADIUS,
} from '@/features/polymarket/components/polymarket-events-list/PolymarketEventsListItem';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { navigateToPolymarketEvent } from '@/features/polymarket/utils/navigateToPolymarket';
import { useSportsEnabled } from '@/features/sports/ui/useSportsEnabled';
import { logger } from '@/logger';
import Routes from '@/navigation/routesNames';
import { useLiveTokenSubscription } from '@/state/liveTokens/useLiveTokenSubscription';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';

type PredictionsDisplay = (typeof PREDICTION_DISPLAY_VALUES)[number];
type PlacementBackedPredictionsSurface = PlacementBackedSurfaceLeafWithDisplay<PredictionsDisplay>;

const PREDICTION_TILE_SHADOW_BLEED = 28;
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
type PredictionSkeletonConfig = {
  borderRadius: number;
  height: number;
  width: number;
};

const PREDICTIONS_SECTION_DESCRIPTORS = {
  'prediction_tile.carousel': {
    layout: 'carousel',
    itemHorizontalBleed: PREDICTION_TILE_SHADOW_BLEED,
    itemHeight: POLYMARKET_EVENTS_LIST_ITEM_HEIGHT,
    itemVerticalBleed: PREDICTION_TILE_SHADOW_BLEED,
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
} satisfies Partial<Record<PredictionsDisplay, SectionDescriptor<PredictionPlacementItem>>>;

export function isPredictionsSurface(surface: SurfaceLeaf): surface is SurfaceLeafWithDisplay<PredictionsDisplay> {
  return (PREDICTION_DISPLAY_VALUES as readonly string[]).includes(surface.display);
}

export function PredictionsSection({
  surface,
  surfaceId,
  viewport,
  active,
}: {
  surface: SurfaceLeafWithDisplay<PredictionsDisplay>;
  surfaceId: SurfaceId;
  viewport: DiscoverViewport;
  active: boolean;
}) {
  const enabled = useSportsEnabled();
  if (!enabled) return null;
  if (!hasPlacement(surface)) return unsupportedUnplacedPredictionSurface(surface, surfaceId);
  if (isEventCardDisplay(surface.display))
    return <PredictionEventsSection surface={surface} surfaceId={surfaceId} viewport={viewport} active={active} />;
  if (
    surface.display === 'prediction_tile.carousel' ||
    surface.display === 'prediction_tile.grid' ||
    surface.display === 'prediction_tile_widget.carousel'
  ) {
    return <PredictionsPlacementSection surface={{ ...surface, display: surface.display }} surfaceId={surfaceId} />;
  }
  return null;
}

function useIsPredictionPlacementPending(surface: PlacementBackedPredictionsSurface): boolean {
  const isPendingSurfacePlacement = useIsDiscoverSurfacePlacementPending(surface.placement);
  const isLoadingPlacementSource = usePlacementsStore(state => {
    if (state.getPlacement(surface.placement) !== undefined) return false;
    return state.getStatus('isInitialLoad') || state.getStatus('isIdle') || state.getStatus('isLoading');
  });
  return isPendingSurfacePlacement || isLoadingPlacementSource;
}

function getDisplayTokenIdExtractor(display: keyof typeof PREDICTIONS_SECTION_DESCRIPTORS): (event: PolymarketEvent) => string[] {
  switch (display) {
    case 'prediction_tile_widget.carousel':
      // Tile widget renders outcome pills from getOutcomeRows.
      return getTileWidgetTokenIds;
    case 'prediction_tile.carousel':
    case 'prediction_tile.grid':
      // Tile renders via PolymarketEventsListItem's outcome selection.
      return getPolymarketEventsListTokenIds;
  }
}

function usePredictionTokenSubscription({
  display,
  items,
  limit,
}: {
  display: keyof typeof PREDICTIONS_SECTION_DESCRIPTORS;
  items: PredictionPlacementItem[];
  limit: number | undefined;
}) {
  const setSubscribedTokens = useLiveTokenSubscription(Routes.DISCOVER_SCREEN);
  const renderedItems = useMemo(() => (typeof limit !== 'number' ? items : items.slice(0, limit)), [items, limit]);

  useEffect(() => {
    const extractTokenIds = getDisplayTokenIdExtractor(display);
    const tokenIds = renderedItems.flatMap(item => extractTokenIds(item.event));
    setSubscribedTokens(tokenIds);
  }, [display, renderedItems, setSubscribedTokens]);
}

function PredictionsPlacementSection({
  surface,
  surfaceId,
}: {
  surface: PlacementBackedSurfaceLeafWithDisplay<keyof typeof PREDICTIONS_SECTION_DESCRIPTORS>;
  surfaceId: SurfaceId;
}) {
  const result = usePredictionsPlacement(surface.placement);
  const isPlacementPending = useIsPredictionPlacementPending(surface);
  const descriptor = PREDICTIONS_SECTION_DESCRIPTORS[surface.display];
  const predictionsDestination = hasDestinationRoot(surface.destination, 'predictions') ? surface.destination : null;
  const onPressSeeAll = useCallback(() => {
    if (predictionsDestination) navigateDiscoverDestination(predictionsDestination);
  }, [predictionsDestination]);

  usePredictionTokenSubscription({ display: surface.display, items: result.items, limit: surface.limit });

  return renderSectionLayout({
    data: result.items,
    descriptor,
    loading: result.isLoading || isPlacementPending,
    // Prediction "See All" routes to the CMS destination (predictions -> Polymarket).
    onPress: predictionsDestination && result.placement ? onPressSeeAll : undefined,
    placement: result.placement,
    section: surface,
    surfaceId,
  });
}

function unsupportedUnplacedPredictionSurface(surface: SurfaceLeafWithDisplay<PredictionsDisplay>, surfaceId: SurfaceId) {
  logger.warn('[PredictionsSection]: unsupported unplaced prediction surface', {
    display: surface.display,
    sectionId: surface.id,
    surfaceId,
  });
  return null;
}

function hasPlacement<TDisplay extends Display>(
  surface: SurfaceLeafWithDisplay<TDisplay>
): surface is PlacementBackedSurfaceLeafWithDisplay<TDisplay> {
  return typeof surface.placement === 'string' && surface.placement.length > 0;
}

function renderPredictionTile(item: PredictionPlacementItem, _: number, onPress: CardPressHandler) {
  return <PredictionListItem item={item} onPress={onPress} style={styles.predictionTile} />;
}

function renderPredictionGridTile(item: PredictionPlacementItem, width: number, onPress: CardPressHandler) {
  return <PredictionListItem item={item} onPress={onPress} style={{ height: POLYMARKET_EVENTS_LIST_ITEM_HEIGHT, width }} />;
}

function PredictionListItem({
  item,
  onPress,
  style,
}: {
  item: PredictionPlacementItem;
  onPress: CardPressHandler;
  style: StyleProp<ViewStyle>;
}) {
  const { isDarkMode } = useColorMode();
  const handlePress = useCallback(() => {
    const { event } = item;
    onPress({ marketId: event.id, marketName: event.title, marketSlug: event.slug, marketSymbol: event.ticker });
    navigateToPolymarketEvent({ event, eventId: event.id });
  }, [item, onPress]);

  return (
    <PolymarketEventsListItem
      event={item.event}
      onPress={handlePress}
      shouldActivateOnStart={false}
      style={[style, styles.predictionTileShadow, isDarkMode ? styles.predictionTileShadowDark : styles.predictionTileShadowLight]}
    />
  );
}

function renderPredictionSkeleton({ borderRadius, height, width }: PredictionSkeletonConfig) {
  return <Skeleton borderRadius={borderRadius} height={height} width={width} />;
}

function renderPredictionWidget(item: PredictionPlacementItem, _: number, onPress: CardPressHandler, onOrderPress: OrderPressHandler) {
  return <PredictionMarketTileCard event={item.event} onPress={onPress} onOrderPress={onOrderPress} />;
}

const styles = StyleSheet.create({
  predictionTile: {
    height: POLYMARKET_EVENTS_LIST_ITEM_HEIGHT,
    width: PREDICTION_TILE_WIDTH,
  },
  predictionTileShadow: {
    borderCurve: 'continuous',
    borderRadius: PREDICTION_CARD_BORDER_RADIUS,
  },
  predictionTileShadowDark: {
    shadowColor: globalColors.grey100,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
  },
  predictionTileShadowLight: {
    backgroundColor: Platform.OS === 'android' ? opacity(globalColors.white100, 0.89) : undefined,
    elevation: 4,
    shadowColor: globalColors.grey100,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
  },
});
