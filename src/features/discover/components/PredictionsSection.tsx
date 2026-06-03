import { useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { Platform, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Skeleton } from '@/components/Skeleton';
import { globalColors, useColorMode } from '@/design-system';
import {
  PREDICTION_MARKET_EVENT_CARD_BORDER_RADIUS,
  PREDICTION_MARKET_EVENT_CARD_CAROUSEL_WIDTH,
  PREDICTION_MARKET_EVENT_CARD_HEIGHT,
  PREDICTION_MARKET_EVENT_CARD_WIDTH,
  PredictionMarketEventCard,
} from '@/features/discover/components/markets/cards/PredictionMarketEventCard';
import {
  getTileWidgetTokenIds,
  PREDICTION_MARKET_TILE_CARD_BORDER_RADIUS,
  PREDICTION_MARKET_TILE_CARD_HEIGHT,
  PREDICTION_MARKET_TILE_CARD_WIDTH,
  PredictionMarketTileCard,
} from '@/features/discover/components/markets/cards/PredictionMarketTileCard';
import { getRenderedHeaderCount, renderSectionLayout } from '@/features/discover/components/SectionLayout';
import {
  type PlacementBackedSurfaceLeafWithDisplay,
  type SectionDescriptor,
  type SurfaceLeafWithDisplay,
} from '@/features/discover/types/sectionLayout';
import { navigateDiscoverDestination } from '@/features/discover/utils/navigation';
import {
  getSportsSurfaceIntent,
  selectSportsEventsForIntent,
  type SportsSurfaceIntent,
} from '@/features/discover/utils/sportsSurfaceIntent';
import { usePredictionsPlacement, type PredictionPlacementItem } from '@/features/placements/stores/derived/predictionsPlacementStore';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { isEventCardDisplay, PREDICTION_DISPLAY_VALUES } from '@/features/placements/surfaces/constants';
import { useIsDiscoverSurfacePlacementPending } from '@/features/placements/surfaces/hooks/useDiscoverSurfacePlacements';
import { type Display, type SurfaceLeaf } from '@/features/placements/surfaces/types';
import { LeagueIcon } from '@/features/polymarket/components/league-icon/LeagueIcon';
import { LiveSectionIndicator } from '@/features/polymarket/components/LiveSectionIndicator';
import {
  getPolymarketEventsListTokenIds,
  HEIGHT as POLYMARKET_EVENTS_LIST_ITEM_HEIGHT,
  PolymarketEventsListItem,
  PREDICTION_CARD_BORDER_RADIUS,
} from '@/features/polymarket/components/polymarket-events-list/PolymarketEventsListItem';
import { getSportsEventRowTokenIds } from '@/features/polymarket/hooks/useSportsEventContent';
import { usePolymarketSportsEventsStore } from '@/features/polymarket/stores/polymarketSportsEventsStore';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { navigateToPolymarketEvent } from '@/features/polymarket/utils/navigateToPolymarket';
import { opacity } from '@/framework/ui/utils/opacity';
import { logger } from '@/logger';
import Routes from '@/navigation/routesNames';
import { addSubscribedTokens, removeSubscribedTokens, useLiveTokensStore } from '@/state/liveTokens/liveTokensStore';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';

type PredictionsDisplay = (typeof PREDICTION_DISPLAY_VALUES)[number];

const hasDestination = (surface: SurfaceLeaf) => surface.destination !== null;
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

const LIVE_INDICATOR_HEADER_GAP = 10;
const HEADER_ACCESSORY_GAP = 4;

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
    if (sportsIntent) return <SportsQuerySection sportsIntent={sportsIntent} surface={surface} />;
    return unsupportedUnplacedPredictionSurface(surface, surfaceId);
  }

  // Only route to the sports section when there's a real sports intent — otherwise it would
  // mount, run its placement hooks/subscriptions, then immediately delegate, double-mounting.
  if (isEventCardDisplay(surface.display) && sportsIntent) {
    return <SportsEventPlacementSection sportsIntent={sportsIntent} surface={surface} />;
  }

  return <PredictionsPlacementSection surface={surface} />;
}

function useIsPredictionPlacementPending(surface: PlacementBackedSurfaceLeafWithDisplay<PredictionsDisplay>): boolean {
  const isPendingSurfacePlacement = useIsDiscoverSurfacePlacementPending(surface.placement);
  const isLoadingPlacementSource = usePlacementsStore(state => {
    if (state.getPlacement(surface.placement) !== undefined) return false;
    return state.getStatus('isInitialLoad') || state.getStatus('isIdle') || state.getStatus('isLoading');
  });
  return isPendingSurfacePlacement || isLoadingPlacementSource;
}

/**
 * Returns the token-id extractor that matches what the given display actually renders,
 * so the section subscribes the SAME ids the cards show. Each branch points at the selector
 * the renderer exports, never a re-derived copy.
 */
function getDisplayTokenIdExtractor(display: PredictionsDisplay): (event: PolymarketEvent) => string[] {
  switch (display) {
    case 'prediction_event_card.carousel':
    case 'prediction_event_card.list':
      // Event card renders the away/home line + moneyline cells from getSportsEventRows.
      return getSportsEventRowTokenIds;
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
  display: PredictionsDisplay;
  items: PredictionPlacementItem[];
  limit: number | undefined;
}) {
  // List displays render the full unsliced data (expandable via ShowMore), so subscribe all
  // items. Carousel/grid slice to surface.limit, so subscribe only the capped slice.
  const isListDisplay = PREDICTIONS_SECTION_DESCRIPTORS[display].layout === 'list';
  const renderedItems = useMemo(
    () => (isListDisplay || typeof limit !== 'number' ? items : items.slice(0, limit)),
    [isListDisplay, items, limit]
  );

  useEffect(() => {
    const extractTokenIds = getDisplayTokenIdExtractor(display);
    const tokenIds = renderedItems.flatMap(item => extractTokenIds(item.event));
    const uniqueTokenIds = Array.from(new Set(tokenIds));
    if (uniqueTokenIds.length === 0) return;

    addSubscribedTokens({ route: Routes.DISCOVER_SCREEN, tokenIds: uniqueTokenIds });
    useLiveTokensStore.getState().fetch(undefined, { force: true });

    return () => {
      removeSubscribedTokens({ route: Routes.DISCOVER_SCREEN, tokenIds: uniqueTokenIds });
    };
  }, [display, renderedItems]);
}

function PredictionsPlacementSection({ surface }: { surface: PlacementBackedSurfaceLeafWithDisplay<PredictionsDisplay> }) {
  const result = usePredictionsPlacement(surface.placement);
  const isPlacementPending = useIsPredictionPlacementPending(surface);
  const descriptor = PREDICTIONS_SECTION_DESCRIPTORS[surface.display];
  const onPressSeeAll = useCallback(() => navigateDiscoverDestination(surface.destination), [surface.destination]);

  usePredictionTokenSubscription({ display: surface.display, items: result.items, limit: surface.limit });

  return renderSectionLayout({
    data: result.items,
    descriptor,
    loading: result.isLoading || isPlacementPending,
    // Prediction "See All" routes to the CMS destination (predictions -> Polymarket).
    onPressSeeAll: hasDestination(surface) && result.placement ? onPressSeeAll : undefined,
    surface,
  });
}

function SportsEventPlacementSection({
  sportsIntent,
  surface,
}: {
  sportsIntent: SportsSurfaceIntent;
  surface: PlacementBackedSurfaceLeafWithDisplay<PredictionsDisplay>;
}) {
  const isPlacementPending = useIsPredictionPlacementPending(surface);
  const result = usePredictionsPlacement(surface.placement);
  const descriptor = getSportsEventSectionDescriptor(surface, sportsIntent);
  const onPressSeeAll = useCallback(() => navigateDiscoverDestination(surface.destination), [surface.destination]);

  usePredictionTokenSubscription({ display: surface.display, items: result.items, limit: surface.limit });

  // Header count comes from the curated placement items the layout actually renders (list shows
  // the expandable full count; carousel/grid cap at surface.limit), not the live sports store.
  const headerCount = getRenderedHeaderCount({ descriptor, itemCount: result.items.length, limit: surface.limit });
  const { headerCaret, leadingAccessory } = getSportsHeaderProps(sportsIntent, surface);

  return renderSectionLayout({
    data: result.items,
    descriptor,
    headerCaret,
    headerCount,
    leadingAccessory,
    loading: result.isLoading || isPlacementPending,
    // Prediction "See All" routes to the CMS destination (predictions -> Polymarket).
    onPressSeeAll: hasDestination(surface) && result.placement ? onPressSeeAll : undefined,
    surface,
  });
}

function SportsQuerySection({
  sportsIntent,
  surface,
}: {
  sportsIntent: SportsSurfaceIntent;
  surface: SurfaceLeafWithDisplay<PredictionsDisplay>;
}) {
  const events = usePolymarketSportsEventsStore(state => state.getData());
  const isLoading = usePolymarketSportsEventsStore(state => state.enabled && (state.getStatus('isLoading') || state.getStatus('isIdle')));
  const items = useMemo<PredictionPlacementItem[]>(() => {
    if (!events) return [];
    const selectedEvents = selectSportsEventsForIntent(events, sportsIntent);
    if (!selectedEvents.length) return [];
    return selectedEvents.map(event => ({ id: event.id, event }));
  }, [events, sportsIntent]);
  const descriptor = getSportsEventSectionDescriptor(surface, sportsIntent);
  const headerCount = getRenderedHeaderCount({ descriptor, itemCount: items.length, limit: surface.limit });
  const onPressSeeAll = useCallback(() => navigateDiscoverDestination(surface.destination), [surface.destination]);

  usePredictionTokenSubscription({ display: surface.display, items, limit: surface.limit });

  const { headerCaret, leadingAccessory } = getSportsHeaderProps(sportsIntent, surface);

  return renderSectionLayout({
    data: items,
    descriptor,
    headerCaret,
    headerCount,
    leadingAccessory,
    loading: isLoading,
    // Prediction "See All" routes to the CMS destination (predictions -> Polymarket).
    onPressSeeAll: hasDestination(surface) ? onPressSeeAll : undefined,
    surface,
  });
}

function getSportsHeaderProps(
  sportsIntent: SportsSurfaceIntent,
  surface: SurfaceLeaf
): { headerCaret: boolean | undefined; leadingAccessory: ReactNode } {
  if ('status' in sportsIntent) {
    // Live section: always shows live indicator, never shows caret
    return {
      headerCaret: false,
      leadingAccessory: <LiveSectionIndicator style={styles.liveHeaderIndicator} />,
    };
  }
  if ('leagueId' in sportsIntent) {
    // League section: shows league icon, caret based on destination
    return {
      headerCaret: hasDestination(surface),
      leadingAccessory: <LeagueIcon leagueId={sportsIntent.leagueId} size={28} />,
    };
  }
  // Today/other bucket section: no leading accessory, caret based on destination
  return {
    headerCaret: hasDestination(surface),
    leadingAccessory: undefined,
  };
}

function unsupportedUnplacedPredictionSurface(surface: SurfaceLeafWithDisplay<PredictionsDisplay>, surfaceId: string) {
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

function renderPredictionTile(item: PredictionPlacementItem) {
  return <PredictionListItem item={item} style={styles.predictionTile} />;
}

function renderPredictionGridTile(item: PredictionPlacementItem, width: number) {
  return <PredictionListItem item={item} style={{ height: POLYMARKET_EVENTS_LIST_ITEM_HEIGHT, width }} />;
}

function PredictionListItem({ item, style }: { item: PredictionPlacementItem; style: StyleProp<ViewStyle> }) {
  const { isDarkMode } = useColorMode();
  const onPress = useCallback(() => {
    navigateToPolymarketEvent({ event: item.event, eventId: item.event.id });
  }, [item.event]);

  return (
    <PolymarketEventsListItem
      event={item.event}
      onPress={onPress}
      shouldActivateOnStart={false}
      style={[style, styles.predictionTileShadow, isDarkMode ? styles.predictionTileShadowDark : styles.predictionTileShadowLight]}
    />
  );
}

function renderPredictionSkeleton({ borderRadius, height, width }: PredictionSkeletonConfig) {
  return <Skeleton borderRadius={borderRadius} height={height} width={width} />;
}

function renderPredictionWidget(item: PredictionPlacementItem) {
  return <PredictionMarketTileCard event={item.event} />;
}

function getSportsEventSectionDescriptor(
  surface: SurfaceLeafWithDisplay<PredictionsDisplay>,
  intent: SportsSurfaceIntent | null
): SectionDescriptor<PredictionPlacementItem> {
  const display = surface.display;
  const shouldHideLeagueHeader = intent !== null && 'leagueId' in intent;

  if (!shouldHideLeagueHeader) return PREDICTIONS_SECTION_DESCRIPTORS[display];

  switch (display) {
    case 'prediction_event_card.carousel':
      return {
        ...PREDICTIONS_SECTION_DESCRIPTORS[display],
        renderItem: renderPredictionEventCardSizedWithoutLeagueHeader,
      };
    case 'prediction_event_card.list':
      return {
        ...PREDICTIONS_SECTION_DESCRIPTORS[display],
        renderItem: renderPredictionEventCardListWithoutLeagueHeader,
      };
    case 'prediction_tile.carousel':
    case 'prediction_tile.grid':
    case 'prediction_tile_widget.carousel':
      return PREDICTIONS_SECTION_DESCRIPTORS[display];
  }
}

function renderEventCardList(hideLeagueHeader: boolean) {
  return function render(item: PredictionPlacementItem): ReactNode {
    return <PredictionMarketEventCard event={item.event} hideLeagueHeader={hideLeagueHeader} />;
  };
}

function renderEventCardSized(hideLeagueHeader: boolean) {
  return function render(item: PredictionPlacementItem, width: number): ReactNode {
    return <PredictionMarketEventCard event={item.event} hideLeagueHeader={hideLeagueHeader} width={width} />;
  };
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
  liveHeaderIndicator: {
    marginRight: LIVE_INDICATOR_HEADER_GAP - HEADER_ACCESSORY_GAP,
  },
});
