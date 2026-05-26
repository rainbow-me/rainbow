import { memo, useCallback, useMemo, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useDiscoverScreenContext } from '@/components/Discover/DiscoverScreenContext';
import { Skeleton } from '@/components/Skeleton';
import { useBackgroundColor } from '@/design-system';
import {
  getTokenPerpMarketSymbol,
  perpToMarketDisplayItem,
  tokenToMarketDisplayItem,
} from '@/features/discover/adapters/toMarketDisplayItem';
import { MarketCarousel } from '@/features/discover/components/carousel/MarketCarousel';
import { MarketGrid } from '@/features/discover/components/grid/MarketGrid';
import { MarketList } from '@/features/discover/components/list/MarketList';
import { MarketCell, MarketCellSkeleton } from '@/features/discover/components/marketCards/MarketCell';
import {
  computeMarketPillWidth,
  MARKET_PILL_HEIGHT,
  MarketPill,
  MarketPillSkeleton,
} from '@/features/discover/components/marketCards/MarketPill';
import {
  MARKET_TILE_CARD_HEIGHT,
  MARKET_TILE_CARD_WIDTH,
  MarketTileCard,
  MarketTileCardSkeleton,
} from '@/features/discover/components/marketCards/MarketTileCard';
import { usePlacementCardTrackPress } from '@/features/discover/components/marketPress/marketPressContext';
import {
  PREDICTION_MARKET_EVENT_CARD_BORDER_RADIUS,
  PREDICTION_MARKET_EVENT_CARD_CAROUSEL_WIDTH,
  PREDICTION_MARKET_EVENT_CARD_HEIGHT,
  PREDICTION_MARKET_EVENT_CARD_WIDTH,
  PredictionMarketEventCard,
} from '@/features/discover/components/predictionCards/PredictionMarketEventCard';
import {
  PREDICTION_MARKET_TILE_CARD_BORDER_RADIUS,
  PREDICTION_MARKET_TILE_CARD_HEIGHT,
  PREDICTION_MARKET_TILE_CARD_WIDTH,
  PredictionMarketTileCard,
} from '@/features/discover/components/predictionMarketCards/PredictionMarketTileCard';
import { type MarketDisplayItem } from '@/features/discover/types/marketDisplayItem';
import { navigateDiscoverDestination } from '@/features/discover/utils/navigation';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { getPerpsPlacementStore } from '@/features/placements/stores/derived/perpsPlacementStore';
import { getPredictionsPlacementStore, type PredictionPlacementItem } from '@/features/placements/stores/derived/predictionsPlacementStore';
import { getTokensPlacementStore, type TokenPlacementItem } from '@/features/placements/stores/derived/tokensPlacementStore';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { MARKET_DISPLAY_VALUES, PREDICTION_DISPLAY_VALUES } from '@/features/placements/surfaces/constants';
import { type Display, type Surface, type SurfaceLeaf } from '@/features/placements/surfaces/types';
import type { Placement, PlacementItem } from '@/features/placements/types';
import { LeagueIcon } from '@/features/polymarket/components/league-icon/LeagueIcon';
import {
  HEIGHT as POLYMARKET_EVENTS_LIST_ITEM_HEIGHT,
  PolymarketEventsListItem,
  PREDICTION_CARD_BORDER_RADIUS,
} from '@/features/polymarket/components/polymarket-events-list/PolymarketEventsListItem';
import { getLeagueId, SPORT_LEAGUES, type LeagueId } from '@/features/polymarket/leagues';
import {
  getSportsEventScheduleBucket,
  isLiveSportsEvent,
  type SportsEventScheduleBucket,
} from '@/features/polymarket/screens/polymarket-sports-events-screen/buildPolymarketSportsEventsListData';
import { usePolymarketSportsEventsStore } from '@/features/polymarket/stores/polymarketSportsEventsStore';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { navigateToPolymarketEvent } from '@/features/polymarket/utils/navigateToPolymarket';
import useColorForAsset from '@/hooks/useColorForAsset';
import * as i18n from '@/languages';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';

type DiscoverSurfaceSectionsProps = {
  items: Surface[];
  surfaceId: string;
};

export function DiscoverSurfaceSections({ items, surfaceId }: DiscoverSurfaceSectionsProps) {
  return (
    <View style={styles.container}>
      {items.map(item => (
        <DiscoverSurfaceSection key={item.id} surface={item} surfaceId={surfaceId} />
      ))}
    </View>
  );
}

export const DiscoverSurfaceSection = memo(function DiscoverSurfaceSection({
  surface,
  surfaceId,
}: {
  surface: Surface;
  surfaceId: string;
}) {
  if (surface.items !== undefined) return <DiscoverSurfaceSections items={surface.items} surfaceId={surfaceId} />;

  if (isMarketSurface(surface)) return <MarketSurfaceSection surface={surface} surfaceId={surfaceId} />;
  if (isPredictionsSurface(surface)) return <PredictionsSurfaceSection surface={surface} surfaceId={surfaceId} />;

  return unsupportedDisplay(surface.display);
});

type CarouselSectionDescriptor<T extends PlacementItem> = {
  layout: 'carousel';
  getItemWidth?: (item: T) => number;
  itemHeight: number;
  itemVerticalBleed?: number;
  itemWidth: number;
  renderItem: (item: T) => ReactNode;
  renderSkeleton: () => ReactNode;
  showHeaderCaret?: (surface: SurfaceLeaf) => boolean;
};

type GridSectionDescriptor<T extends PlacementItem> = {
  layout: 'grid';
  itemHeight: number;
  renderItem: (item: T, width: number) => ReactNode;
  renderSkeleton: (width: number) => ReactNode;
  showHeaderCaret?: (surface: SurfaceLeaf) => boolean;
};

type ListSectionDescriptor<T extends PlacementItem> = {
  layout: 'list';
  renderItem: (item: T) => ReactNode;
  renderSkeleton: () => ReactNode;
};

type SectionDescriptor<T extends PlacementItem> = CarouselSectionDescriptor<T> | GridSectionDescriptor<T> | ListSectionDescriptor<T>;

type MarketDisplay = (typeof MARKET_DISPLAY_VALUES)[number];
type PredictionsDisplay = (typeof PREDICTION_DISPLAY_VALUES)[number];
type SurfaceLeafWithDisplay<TDisplay extends Display> = SurfaceLeaf & { display: TDisplay };
type PlacementBackedSurfaceLeafWithDisplay<TDisplay extends Display> = SurfaceLeafWithDisplay<TDisplay> & { placement: string };

type SurfaceLayoutProps<T extends PlacementItem> = {
  data: T[];
  descriptor: SectionDescriptor<T>;
  headerCount?: number;
  loading: boolean;
  onPressSeeAll?: () => void;
  placement: Placement | undefined;
  surface: SurfaceLeaf;
  surfaceId: string;
};

const SECTION_VERTICAL_GAP = 32;
const LIVE_INDICATOR_SIZE = 28;
const LIVE_INDICATOR_CUTOUT_SIZE = 16;
const LIVE_INDICATOR_DOT_SIZE = 8;
const LIVE_INDICATOR_HEADER_GAP = 10;
const HEADER_ACCESSORY_GAP = 4;
const EMPTY_MARKET_DISPLAY_ITEMS: MarketDisplayItem[] = [];
const EMPTY_PREDICTION_PLACEMENT_ITEMS: PredictionPlacementItem[] = [];
const hasDestination = (surface: SurfaceLeaf) => surface.destination !== null;
const PREDICTION_TILE_WIDTH = Math.round((DEVICE_WIDTH - 20 * 2 - 8) / 2);

const MARKET_SECTION_DESCRIPTORS = {
  'market_pill.carousel': {
    layout: 'carousel',
    getItemWidth: computeMarketPillWidth,
    itemHeight: MARKET_PILL_HEIGHT,
    itemVerticalBleed: 8,
    itemWidth: 220,
    renderItem: renderMarketPill,
    renderSkeleton: MarketPillSkeleton,
    showHeaderCaret: hasDestination,
  },
  'market_tile.carousel': {
    layout: 'carousel',
    itemHeight: MARKET_TILE_CARD_HEIGHT,
    itemWidth: MARKET_TILE_CARD_WIDTH,
    renderItem: renderMarketTile,
    renderSkeleton: MarketTileCardSkeleton,
    showHeaderCaret: hasDestination,
  },
  'market_tile.grid': {
    layout: 'grid',
    itemHeight: MARKET_TILE_CARD_HEIGHT,
    renderItem: renderMarketGridTile,
    renderSkeleton: renderMarketGridTileSkeleton,
    showHeaderCaret: hasDestination,
  },
  'market_cell.list': {
    layout: 'list',
    renderItem: renderMarketCell,
    renderSkeleton: MarketCellSkeleton,
  },
} satisfies Record<MarketDisplay, SectionDescriptor<MarketDisplayItem>>;

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
  },
  'prediction_event_card.list': {
    layout: 'list',
    renderItem: renderPredictionEventCard,
    renderSkeleton: renderPredictionEventCardSkeleton,
  },
} satisfies Record<PredictionsDisplay, SectionDescriptor<PredictionPlacementItem>>;

function isMarketSurface(surface: SurfaceLeaf): surface is SurfaceLeafWithDisplay<MarketDisplay> {
  return (MARKET_DISPLAY_VALUES as readonly string[]).includes(surface.display);
}

function isPredictionsSurface(surface: SurfaceLeaf): surface is SurfaceLeafWithDisplay<PredictionsDisplay> {
  return (PREDICTION_DISPLAY_VALUES as readonly string[]).includes(surface.display);
}

function MarketSurfaceSection({ surface, surfaceId }: { surface: SurfaceLeafWithDisplay<MarketDisplay>; surfaceId: string }) {
  if (!hasPlacement(surface)) return null;
  return <PlacementBackedMarketSurfaceSection surface={surface} surfaceId={surfaceId} />;
}

function PlacementBackedMarketSurfaceSection({
  surface,
  surfaceId,
}: {
  surface: PlacementBackedSurfaceLeafWithDisplay<MarketDisplay>;
  surfaceId: string;
}) {
  const source = usePlacementsStore(state => state.getPlacement(surface.placement)?.source);
  const isLoadingPlacementSource = usePlacementsStore(state => {
    if (state.getPlacement(surface.placement) !== undefined) return false;
    return state.getStatus('isInitialLoad') || state.getStatus('isIdle') || state.getStatus('isLoading');
  });

  if (source === 'hyperliquid') return <PerpsMarketSurfaceSection surface={surface} surfaceId={surfaceId} />;
  if (source === 'rainbow') return <TokensMarketSurfaceSection surface={surface} surfaceId={surfaceId} />;
  if (isLoadingPlacementSource) {
    return renderSurfaceLayoutSection({
      data: EMPTY_MARKET_DISPLAY_ITEMS,
      descriptor: MARKET_SECTION_DESCRIPTORS[surface.display],
      loading: true,
      onPressSeeAll: getHeaderPress(surface.destination),
      placement: undefined,
      surface,
      surfaceId,
    });
  }

  return null;
}

function PerpsMarketSurfaceSection({
  surface,
  surfaceId,
}: {
  surface: PlacementBackedSurfaceLeafWithDisplay<MarketDisplay>;
  surfaceId: string;
}) {
  const useStore = useMemo(() => getPerpsPlacementStore(surface.placement), [surface.placement]);
  const result = useStore();
  const descriptor = MARKET_SECTION_DESCRIPTORS[surface.display];
  const items = useMemo(() => result.items.map(perpToMarketDisplayItem), [result.items]);

  return renderSurfaceLayoutSection({
    data: items,
    descriptor,
    loading: result.isLoading,
    onPressSeeAll: getHeaderPress(surface.destination),
    placement: result.placement,
    surface,
    surfaceId,
  });
}

function TokensMarketSurfaceSection({
  surface,
  surfaceId,
}: {
  surface: PlacementBackedSurfaceLeafWithDisplay<MarketDisplay>;
  surfaceId: string;
}) {
  const { onTapSearch } = useDiscoverScreenContext();
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const useStore = useMemo(() => getTokensPlacementStore(surface.placement), [surface.placement]);
  const result = useStore();
  const descriptor = useMemo(() => getTokenMarketSectionDescriptor(surface.display, nativeCurrency), [nativeCurrency, surface.display]);
  const onPressSeeAll = useCallback(() => {
    if (surface.destination?.[0] === 'tokens') {
      onTapSearch();
      return;
    }
    navigateDiscoverDestination(surface.destination);
  }, [onTapSearch, surface.destination]);

  return renderSurfaceLayoutSection({
    data: result.items,
    descriptor,
    loading: result.isLoading,
    onPressSeeAll: surface.destination ? onPressSeeAll : undefined,
    placement: result.placement,
    surface,
    surfaceId,
  });
}

function PredictionsSurfaceSection({ surface, surfaceId }: { surface: SurfaceLeafWithDisplay<PredictionsDisplay>; surfaceId: string }) {
  if (isLiveSportsSurface(surface)) {
    return <SportsLiveSurfaceSection surface={surface} surfaceId={surfaceId} />;
  }

  if (!hasPlacement(surface)) return null;
  if (isSportsEventCardSurface(surface)) return <SportsEventPlacementSurfaceSection surface={surface} surfaceId={surfaceId} />;
  return <PredictionsPlacementSurfaceSection surface={surface} surfaceId={surfaceId} />;
}

function PredictionsPlacementSurfaceSection({
  surface,
  surfaceId,
}: {
  surface: PlacementBackedSurfaceLeafWithDisplay<PredictionsDisplay>;
  surfaceId: string;
}) {
  const useStore = useMemo(() => getPredictionsPlacementStore(surface.placement), [surface.placement]);
  const result = useStore();
  const descriptor = PREDICTIONS_SECTION_DESCRIPTORS[surface.display];

  return renderSurfaceLayoutSection({
    data: result.items,
    descriptor,
    loading: result.isLoading,
    onPressSeeAll: getHeaderPress(surface.destination),
    placement: result.placement,
    surface,
    surfaceId,
  });
}

function SportsEventPlacementSurfaceSection({
  surface,
  surfaceId,
}: {
  surface: PlacementBackedSurfaceLeafWithDisplay<PredictionsDisplay>;
  surfaceId: string;
}) {
  const useStore = useMemo(() => getPredictionsPlacementStore(surface.placement), [surface.placement]);
  const result = useStore();
  const sportsEvents = usePolymarketSportsEventsStore(state => state.getData());
  const descriptor = PREDICTIONS_SECTION_DESCRIPTORS[surface.display];
  const headerCount = getSportsEventHeaderCount({
    displayedItemCount: getInitialRenderedItemCount(result.items, surface.limit),
    events: sportsEvents,
    surface,
  });

  return renderSurfaceLayoutSection({
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

function SportsLiveSurfaceSection({ surface, surfaceId }: { surface: SurfaceLeafWithDisplay<PredictionsDisplay>; surfaceId: string }) {
  const events = usePolymarketSportsEventsStore(state => state.getData());
  const isLoading = usePolymarketSportsEventsStore(state => state.getStatus('isLoading') || state.getStatus('isIdle'));
  const descriptor = PREDICTIONS_SECTION_DESCRIPTORS[surface.display];
  const items = useMemo<PredictionPlacementItem[]>(() => {
    if (!events) return EMPTY_PREDICTION_PLACEMENT_ITEMS;
    const liveEvents = events.filter(isLiveSportsEvent);
    if (!liveEvents.length) return EMPTY_PREDICTION_PLACEMENT_ITEMS;
    return liveEvents.map(event => ({ id: event.id, event }));
  }, [events]);
  const headerCount = getSportsEventHeaderCount({
    displayedItemCount: getInitialRenderedItemCount(items, surface.limit),
    events,
    surface,
  });

  return renderSurfaceLayoutSection({
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

function renderSurfaceLayoutSection<T extends PlacementItem>({
  data,
  descriptor,
  headerCount,
  loading,
  onPressSeeAll,
  placement,
  surface,
  surfaceId,
}: SurfaceLayoutProps<T>) {
  const leadingAccessory = renderSurfaceHeaderLeadingAccessory(surface);
  const hasLimit = surface.limit !== undefined;
  const renderedData = hasLimit ? data.slice(0, surface.limit) : data;
  const skeletonCount = hasLimit ? surface.limit : undefined;
  const showHeaderCaret = getSurfaceHeaderCaret(surface);
  const commonProps = {
    destination: surface.destination,
    display: surface.display,
    headerCount,
    leadingAccessory,
    loading,
    onPressSeeAll,
    placement,
    placementId: surface.placement ?? undefined,
    sectionId: surface.id,
    surfaceId,
    title: getSurfaceLabel(surface),
  };

  switch (descriptor.layout) {
    case 'carousel':
      return (
        <MarketCarousel
          {...commonProps}
          data={renderedData}
          getItemWidth={descriptor.getItemWidth}
          itemHeight={descriptor.itemHeight}
          itemVerticalBleed={descriptor.itemVerticalBleed}
          itemWidth={descriptor.itemWidth}
          renderItem={descriptor.renderItem}
          renderSkeleton={descriptor.renderSkeleton}
          showHeaderCaret={showHeaderCaret ?? descriptor.showHeaderCaret?.(surface)}
          skeletonCount={skeletonCount}
        />
      );
    case 'grid':
      return (
        <MarketGrid
          {...commonProps}
          data={renderedData}
          itemHeight={descriptor.itemHeight}
          renderItem={descriptor.renderItem}
          renderSkeleton={descriptor.renderSkeleton}
          showHeaderCaret={showHeaderCaret ?? descriptor.showHeaderCaret?.(surface)}
          skeletonCount={skeletonCount}
        />
      );
    case 'list':
      return (
        <MarketList
          {...commonProps}
          data={data}
          initialVisibleItemCount={surface.limit}
          renderItem={descriptor.renderItem}
          renderSkeleton={descriptor.renderSkeleton}
          showHeaderCaret={showHeaderCaret}
        />
      );
    default:
      return assertNever(descriptor);
  }
}

function getHeaderPress(destination: SurfaceLeaf['destination']): (() => void) | undefined {
  if (!destination) return undefined;
  return () => navigateDiscoverDestination(destination);
}

function getSurfaceHeaderCaret(surface: SurfaceLeaf): boolean | undefined {
  if (isLiveSportsSurface(surface)) return false;
  if (isSportsEventCardSurface(surface)) return hasDestination(surface);
}

function getSportsEventHeaderCount({
  displayedItemCount,
  events,
  surface,
}: {
  displayedItemCount: number;
  events: PolymarketEvent[] | null | undefined;
  surface: SurfaceLeaf;
}): number | undefined {
  if (!isSportsEventCardSurface(surface) || !events) return undefined;

  const count = getSportsEventCountForSurface(surface, events);
  if (count === undefined || count === 0 || count === displayedItemCount) return undefined;
  return count;
}

function getSportsEventCountForSurface(surface: SurfaceLeaf, events: PolymarketEvent[]): number | undefined {
  if (isLiveSportsSurface(surface)) return countSportsEventsForTimeBucket(events, 'live');

  const timeBucket = getSurfaceTimeBucket(surface);
  if (timeBucket) return countSportsEventsForTimeBucket(events, timeBucket);

  const leagueId = getSurfaceLeagueId(surface);
  if (leagueId) return events.filter(event => getLeagueId(event.slug) === leagueId).length;
}

function countSportsEventsForTimeBucket(events: PolymarketEvent[], timeBucket: SportsEventScheduleBucket): number {
  return events.filter(event => {
    return getSportsEventScheduleBucket(event) === timeBucket;
  }).length;
}

function getInitialRenderedItemCount<T>(items: T[], limit: number | undefined): number {
  return limit === undefined ? items.length : Math.min(items.length, limit);
}

function renderMarketPill(item: MarketDisplayItem) {
  return <MarketPill item={item} />;
}

function renderMarketTile(item: MarketDisplayItem) {
  return <MarketTileCard item={item} />;
}

function renderMarketGridTile(item: MarketDisplayItem, width: number) {
  return <MarketTileCard item={item} width={width} />;
}

function renderMarketGridTileSkeleton(width: number) {
  return <MarketTileCardSkeleton width={width} />;
}

function renderMarketCell(item: MarketDisplayItem) {
  return <MarketCell item={item} />;
}

function getTokenMarketSectionDescriptor(
  display: MarketDisplay,
  nativeCurrency: ReturnType<typeof userAssetsStoreManager.getState>['currency']
): SectionDescriptor<TokenPlacementItem> {
  switch (display) {
    case 'market_pill.carousel':
      return {
        ...MARKET_SECTION_DESCRIPTORS[display],
        getItemWidth: (item: TokenPlacementItem) =>
          computeMarketPillWidth(tokenToMarketDisplayItem({ accentColor: '#000000', item, nativeCurrency })),
        renderItem: (item: TokenPlacementItem) => <TokenMarketPill item={item} nativeCurrency={nativeCurrency} />,
      };
    case 'market_tile.carousel':
      return {
        ...MARKET_SECTION_DESCRIPTORS[display],
        renderItem: (item: TokenPlacementItem) => <TokenMarketTile item={item} nativeCurrency={nativeCurrency} />,
      };
    case 'market_tile.grid':
      return {
        ...MARKET_SECTION_DESCRIPTORS[display],
        renderItem: (item: TokenPlacementItem, width: number) => (
          <TokenMarketTile item={item} nativeCurrency={nativeCurrency} width={width} />
        ),
      };
    case 'market_cell.list':
      return {
        ...MARKET_SECTION_DESCRIPTORS[display],
        renderItem: (item: TokenPlacementItem) => <TokenMarketCell item={item} nativeCurrency={nativeCurrency} />,
      };
    default:
      return assertNever(display);
  }
}

function TokenMarketPill({
  item,
  nativeCurrency,
}: {
  item: TokenPlacementItem;
  nativeCurrency: ReturnType<typeof userAssetsStoreManager.getState>['currency'];
}) {
  const displayItem = useTokenMarketDisplayItem(item, nativeCurrency);
  return <MarketPill item={displayItem} />;
}

function TokenMarketTile({
  item,
  nativeCurrency,
  width,
}: {
  item: TokenPlacementItem;
  nativeCurrency: ReturnType<typeof userAssetsStoreManager.getState>['currency'];
  width?: number;
}) {
  const displayItem = useTokenMarketDisplayItem(item, nativeCurrency);
  return <MarketTileCard item={displayItem} width={width} />;
}

function TokenMarketCell({
  item,
  nativeCurrency,
}: {
  item: TokenPlacementItem;
  nativeCurrency: ReturnType<typeof userAssetsStoreManager.getState>['currency'];
}) {
  const displayItem = useTokenMarketDisplayItem(item, nativeCurrency);
  return <MarketCell item={displayItem} />;
}

function useTokenMarketDisplayItem(
  item: TokenPlacementItem,
  nativeCurrency: ReturnType<typeof userAssetsStoreManager.getState>['currency']
): MarketDisplayItem {
  const perpMarketSymbol = getTokenPerpMarketSymbol(item);
  const perpMarket = useHyperliquidMarketsStore(state => (perpMarketSymbol ? state.getMarket(perpMarketSymbol) : undefined));
  const accentColor = useColorForAsset({
    address: item.asset.address,
    name: item.asset.name,
    symbol: item.asset.symbol,
  });

  return useMemo(
    () => tokenToMarketDisplayItem({ accentColor, item, nativeCurrency, perpMarket }),
    [accentColor, item, nativeCurrency, perpMarket]
  );
}

function renderPredictionTile(item: PredictionPlacementItem) {
  return <PredictionListItem item={item} style={styles.predictionTile} />;
}

function renderPredictionGridTile(item: PredictionPlacementItem, width: number) {
  return <PredictionListItem item={item} style={{ height: POLYMARKET_EVENTS_LIST_ITEM_HEIGHT, width }} />;
}

function PredictionListItem({ item, style }: { item: PredictionPlacementItem; style: StyleProp<ViewStyle> }) {
  const trackPress = usePlacementCardTrackPress();
  const onPress = useCallback(() => {
    trackPress?.({
      marketId: item.event.id,
      marketName: item.event.title,
      marketSlug: item.event.slug,
      marketSymbol: item.event.ticker,
    });
    navigateToPolymarketEvent({ event: item.event, eventId: item.event.id });
  }, [item.event, trackPress]);

  return <PolymarketEventsListItem event={item.event} onPress={onPress} shouldActivateOnStart={false} style={style} />;
}

function renderPredictionSkeleton() {
  return (
    <Skeleton borderRadius={PREDICTION_CARD_BORDER_RADIUS} height={POLYMARKET_EVENTS_LIST_ITEM_HEIGHT} width={PREDICTION_TILE_WIDTH} />
  );
}

function renderPredictionWidget(item: PredictionPlacementItem) {
  return <PredictionMarketTileCard event={item.event} />;
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

function renderPredictionEventCard(item: PredictionPlacementItem) {
  return <PredictionMarketEventCard event={item.event} />;
}

function renderPredictionEventCarouselCard(item: PredictionPlacementItem) {
  return <PredictionMarketEventCard event={item.event} width={PREDICTION_MARKET_EVENT_CARD_CAROUSEL_WIDTH} />;
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

function renderSurfaceHeaderLeadingAccessory(surface: SurfaceLeaf) {
  if (isLiveSportsSurface(surface)) return <LiveSectionIndicator style={styles.liveHeaderIndicator} />;

  const leagueId = getSurfaceLeagueId(surface);
  return leagueId ? <LeagueIcon leagueId={leagueId} size={28} /> : null;
}

function LiveSectionIndicator({ style }: { style?: StyleProp<ViewStyle> }) {
  const backgroundColor = useBackgroundColor('surfacePrimary');
  return (
    <View style={[styles.liveIndicatorOuter, style]}>
      <View style={[styles.liveIndicatorCutout, { backgroundColor }]}>
        <View style={styles.liveIndicatorDot} />
      </View>
    </View>
  );
}

function isLiveSportsSurface(surface: SurfaceLeaf): boolean {
  if (surface.display !== 'prediction_event_card.carousel' && surface.display !== 'prediction_event_card.list') return false;
  return getNormalizedSurfaceValue(surface.id) === 'live' || getNormalizedSurfaceValue(surface.label) === 'live';
}

function isSportsEventCardSurface(surface: SurfaceLeaf): boolean {
  return surface.display === 'prediction_event_card.carousel' || surface.display === 'prediction_event_card.list';
}

function getSurfaceLeagueId(surface: SurfaceLeaf): LeagueId | undefined {
  return getLeagueIdBySurfaceValue(surface.label) ?? getLeagueIdBySurfaceValue(surface.id);
}

function getSurfaceTimeBucket(surface: SurfaceLeaf): SportsEventScheduleBucket | undefined {
  const values = [getNormalizedSurfaceKey(surface.id), getNormalizedSurfaceKey(surface.label)];
  if (values.includes('today')) return 'today';
  if (values.includes('this_week')) return 'this-week';
}

function getLeagueIdBySurfaceValue(value: string | undefined): LeagueId | undefined {
  const normalizedValue = getNormalizedSurfaceValue(value);
  if (!normalizedValue) return undefined;
  const leagueId = getLeagueId(normalizedValue);
  if (leagueId) return leagueId;

  const entry = Object.entries(SPORT_LEAGUES).find(
    ([leagueId, league]) => leagueId === normalizedValue || league.name.toLowerCase() === normalizedValue
  );
  if (entry) return entry[0] as LeagueId;

  const leagueToken = normalizedValue.split(/[^a-z0-9]+/).find(token => token in SPORT_LEAGUES);
  return leagueToken as LeagueId | undefined;
}

function getNormalizedSurfaceValue(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? '';
}

function getSurfaceLabel(surface: Pick<Surface, 'id' | 'label'>): string {
  const fallbackLabel = surface.label || surface.id;
  return i18n.t(`discover.sections.${getNormalizedSurfaceKey(fallbackLabel)}`, { defaultValue: fallbackLabel });
}

function getNormalizedSurfaceKey(value: string | undefined): string {
  return getNormalizedSurfaceValue(value).replace(/[\s-]+/g, '_');
}

function assertNever(value: never): never {
  throw new Error(`Unsupported Discover surface display: ${JSON.stringify(value)}`);
}

function unsupportedDisplay(display: SurfaceLeaf['display']): never {
  throw new Error(`Unsupported Discover surface display: ${JSON.stringify(display)}`);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: SECTION_VERTICAL_GAP,
    paddingBottom: 24,
    paddingTop: 20,
  },
  liveIndicatorCutout: {
    alignItems: 'center',
    borderRadius: LIVE_INDICATOR_CUTOUT_SIZE / 2,
    height: LIVE_INDICATOR_CUTOUT_SIZE,
    justifyContent: 'center',
    width: LIVE_INDICATOR_CUTOUT_SIZE,
  },
  liveIndicatorDot: {
    backgroundColor: '#F04F4B',
    borderRadius: LIVE_INDICATOR_DOT_SIZE / 2,
    height: LIVE_INDICATOR_DOT_SIZE,
    width: LIVE_INDICATOR_DOT_SIZE,
  },
  liveHeaderIndicator: {
    marginRight: LIVE_INDICATOR_HEADER_GAP - HEADER_ACCESSORY_GAP,
  },
  liveIndicatorOuter: {
    alignItems: 'center',
    backgroundColor: 'rgba(240, 79, 75, 0.34)',
    borderRadius: LIVE_INDICATOR_SIZE / 2,
    height: LIVE_INDICATOR_SIZE,
    justifyContent: 'center',
    width: LIVE_INDICATOR_SIZE,
  },
  predictionTile: {
    height: POLYMARKET_EVENTS_LIST_ITEM_HEIGHT,
    width: PREDICTION_TILE_WIDTH,
  },
});
