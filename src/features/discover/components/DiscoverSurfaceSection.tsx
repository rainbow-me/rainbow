import { memo, useCallback, useMemo, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useDiscoverScreenContext } from '@/components/Discover/DiscoverScreenContext';
import { Skeleton } from '@/components/Skeleton';
import { MarketCarousel } from '@/features/discover/components/carousel/MarketCarousel';
import { MarketGrid } from '@/features/discover/components/grid/MarketGrid';
import { MarketList } from '@/features/discover/components/list/MarketList';
import { usePlacementCardTrackPress } from '@/features/discover/components/marketPress/marketPressContext';
import {
  LARGE_PERP_MARKET_CARD_HEIGHT,
  LARGE_PERP_MARKET_CARD_WIDTH,
  LargePerpMarketCard,
  LargePerpMarketCardSkeleton,
} from '@/features/discover/components/perpMarketCards/LargePerpMarketCard';
import {
  computePerpPillWidth,
  PERP_MARKET_PILL_HEIGHT,
  PerpMarketPill,
  PerpMarketPillSkeleton,
} from '@/features/discover/components/perpMarketCards/PerpMarketPill';
import { PerpMarketRowCard, PerpMarketRowCardSkeleton } from '@/features/discover/components/perpMarketCards/PerpMarketRowCard';
import {
  PREDICTION_MARKET_TILE_CARD_BORDER_RADIUS,
  PREDICTION_MARKET_TILE_CARD_HEIGHT,
  PREDICTION_MARKET_TILE_CARD_WIDTH,
  PredictionMarketTileCard,
} from '@/features/discover/components/predictionMarketCards/PredictionMarketTileCard';
import {
  SPORTS_EVENT_WIDGET_CARD_BORDER_RADIUS,
  SPORTS_EVENT_WIDGET_CARD_HEIGHT,
  SPORTS_EVENT_WIDGET_CARD_WIDTH,
  SportsEventWidgetCard,
} from '@/features/discover/components/sports/SportsEventWidgetCard';
import { TokenCell, TokenCellSkeleton } from '@/features/discover/components/token/TokenCell';
import { navigateDiscoverDestination } from '@/features/discover/utils/navigation';
import { getPerpsPlacementStore, type PerpMarketPlacementItem } from '@/features/placements/stores/derived/perpsPlacementStore';
import { getPredictionsPlacementStore, type PredictionPlacementItem } from '@/features/placements/stores/derived/predictionsPlacementStore';
import { getTokensPlacementStore, type TokenPlacementItem } from '@/features/placements/stores/derived/tokensPlacementStore';
import type { SOURCE_BY_DISPLAY } from '@/features/placements/surfaces/constants';
import { type Display, type Surface, type SurfaceLeaf } from '@/features/placements/surfaces/types';
import type { Placement, PlacementItem, PlacementSource } from '@/features/placements/types';
import { LeagueIcon } from '@/features/polymarket/components/league-icon/LeagueIcon';
import {
  HEIGHT as POLYMARKET_EVENTS_LIST_ITEM_HEIGHT,
  PolymarketEventsListItem,
  PREDICTION_CARD_BORDER_RADIUS,
} from '@/features/polymarket/components/polymarket-events-list/PolymarketEventsListItem';
import { getLeagueId, SPORT_LEAGUES, type LeagueId } from '@/features/polymarket/leagues';
import { navigateToPolymarketEvent } from '@/features/polymarket/utils/navigateToPolymarket';
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

  if (isPerpsSurface(surface)) return <PerpsSurfaceSection surface={surface} surfaceId={surfaceId} />;
  if (isPredictionsSurface(surface)) return <PredictionsSurfaceSection surface={surface} surfaceId={surfaceId} />;
  if (isTokensSurface(surface)) return <TokensSurfaceSection surface={surface} surfaceId={surfaceId} />;

  return unsupportedDisplay(surface.display);
});

type SectionDescriptorBase<T extends PlacementItem> = {
  renderHeaderLeadingAccessory?: (items: T[], surface: SurfaceLeaf) => ReactNode;
};

type CarouselSectionDescriptor<T extends PlacementItem> = SectionDescriptorBase<T> & {
  layout: 'carousel';
  getItemWidth?: (item: T) => number;
  itemHeight: number;
  itemVerticalBleed?: number;
  itemWidth: number;
  renderItem: (item: T) => ReactNode;
  renderSkeleton: () => ReactNode;
  showHeaderCaret?: (surface: SurfaceLeaf) => boolean;
};

type GridSectionDescriptor<T extends PlacementItem> = SectionDescriptorBase<T> & {
  layout: 'grid';
  itemHeight: number;
  renderItem: (item: T, width: number) => ReactNode;
  renderSkeleton: (width: number) => ReactNode;
  showHeaderCaret?: (surface: SurfaceLeaf) => boolean;
};

type ListSectionDescriptor<T extends PlacementItem> = SectionDescriptorBase<T> & {
  layout: 'list';
  renderItem: (item: T) => ReactNode;
  renderSkeleton: () => ReactNode;
};

type SectionDescriptor<T extends PlacementItem> = CarouselSectionDescriptor<T> | GridSectionDescriptor<T> | ListSectionDescriptor<T>;

type DisplayForSource<TSource extends PlacementSource> = {
  [TDisplay in Display]: (typeof SOURCE_BY_DISPLAY)[TDisplay] extends TSource ? TDisplay : never;
}[Display];
type PerpsDisplay = DisplayForSource<'hyperliquid'>;
type PredictionsDisplay = DisplayForSource<'polymarket'>;
type TokensDisplay = DisplayForSource<'rainbow'>;
type SurfaceLeafWithDisplay<TDisplay extends Display> = SurfaceLeaf & { display: TDisplay };

type SurfaceLayoutProps<T extends PlacementItem> = {
  data: T[];
  descriptor: SectionDescriptor<T>;
  loading: boolean;
  onPressSeeAll?: () => void;
  placement: Placement | undefined;
  surface: SurfaceLeaf;
  surfaceId: string;
};

const SECTION_VERTICAL_GAP = 32;
const hasDestination = (surface: SurfaceLeaf) => surface.destination !== null;
const PREDICTION_TILE_WIDTH = Math.round((DEVICE_WIDTH - 20 * 2 - 8) / 2);

const PERPS_SECTION_DESCRIPTORS = {
  'perp_pill.carousel': {
    layout: 'carousel',
    getItemWidth: getPerpPillItemWidth,
    itemHeight: PERP_MARKET_PILL_HEIGHT,
    itemVerticalBleed: 8,
    itemWidth: 220,
    renderItem: renderPerpPill,
    renderSkeleton: PerpMarketPillSkeleton,
    showHeaderCaret: hasDestination,
  },
  'perp_tile.carousel': {
    layout: 'carousel',
    itemHeight: LARGE_PERP_MARKET_CARD_HEIGHT,
    itemWidth: LARGE_PERP_MARKET_CARD_WIDTH,
    renderItem: renderLargePerpCard,
    renderSkeleton: LargePerpMarketCardSkeleton,
    showHeaderCaret: hasDestination,
  },
  'perp_tile.grid': {
    layout: 'grid',
    itemHeight: LARGE_PERP_MARKET_CARD_HEIGHT,
    renderItem: renderLargePerpGridCard,
    renderSkeleton: renderLargePerpGridSkeleton,
    showHeaderCaret: hasDestination,
  },
  'perp_row.list': {
    layout: 'list',
    renderItem: renderPerpRow,
    renderSkeleton: PerpMarketRowCardSkeleton,
  },
} satisfies Record<PerpsDisplay, SectionDescriptor<PerpMarketPlacementItem>>;

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
  'prediction_sport_widget.carousel': {
    layout: 'carousel',
    itemHeight: SPORTS_EVENT_WIDGET_CARD_HEIGHT,
    itemWidth: SPORTS_EVENT_WIDGET_CARD_WIDTH,
    renderHeaderLeadingAccessory: renderSportsHeaderIcon,
    renderItem: renderSportsWidget,
    renderSkeleton: renderSportsWidgetSkeleton,
  },
  'prediction_sport_widget.list': {
    layout: 'list',
    renderHeaderLeadingAccessory: renderSportsHeaderIcon,
    renderItem: renderSportsWidget,
    renderSkeleton: renderSportsWidgetSkeleton,
  },
} satisfies Record<PredictionsDisplay, SectionDescriptor<PredictionPlacementItem>>;

const TOKENS_SECTION_DESCRIPTORS = {
  'token_cell.list': {
    layout: 'list',
    renderItem: renderTokenCell,
    renderSkeleton: TokenCellSkeleton,
  },
} satisfies Record<TokensDisplay, SectionDescriptor<TokenPlacementItem>>;

function isPerpsSurface(surface: SurfaceLeaf): surface is SurfaceLeafWithDisplay<PerpsDisplay> {
  return surface.display in PERPS_SECTION_DESCRIPTORS;
}

function isPredictionsSurface(surface: SurfaceLeaf): surface is SurfaceLeafWithDisplay<PredictionsDisplay> {
  return surface.display in PREDICTIONS_SECTION_DESCRIPTORS;
}

function isTokensSurface(surface: SurfaceLeaf): surface is SurfaceLeafWithDisplay<TokensDisplay> {
  return surface.display in TOKENS_SECTION_DESCRIPTORS;
}

function PerpsSurfaceSection({ surface, surfaceId }: { surface: SurfaceLeafWithDisplay<PerpsDisplay>; surfaceId: string }) {
  const useStore = useMemo(() => getPerpsPlacementStore(surface.placement), [surface.placement]);
  const result = useStore();
  const descriptor = PERPS_SECTION_DESCRIPTORS[surface.display];
  const limitedData = useLimitedItems(result.items, surface.limit);

  return renderSurfaceLayoutSection({
    data: descriptor.layout === 'list' ? result.items : limitedData,
    descriptor,
    loading: result.isLoading,
    onPressSeeAll: getHeaderPress(surface.destination),
    placement: result.placement,
    surface,
    surfaceId,
  });
}

function PredictionsSurfaceSection({ surface, surfaceId }: { surface: SurfaceLeafWithDisplay<PredictionsDisplay>; surfaceId: string }) {
  const useStore = useMemo(() => getPredictionsPlacementStore(surface.placement), [surface.placement]);
  const result = useStore();
  const descriptor = PREDICTIONS_SECTION_DESCRIPTORS[surface.display];
  const limitedData = useLimitedItems(result.items, surface.limit);

  return renderSurfaceLayoutSection({
    data: descriptor.layout === 'list' ? result.items : limitedData,
    descriptor,
    loading: result.isLoading,
    onPressSeeAll: getHeaderPress(surface.destination),
    placement: result.placement,
    surface,
    surfaceId,
  });
}

function TokensSurfaceSection({ surface, surfaceId }: { surface: SurfaceLeafWithDisplay<TokensDisplay>; surfaceId: string }) {
  const { onTapSearch } = useDiscoverScreenContext();
  const useStore = useMemo(() => getTokensPlacementStore(surface.placement), [surface.placement]);
  const result = useStore();
  const onPressSeeAll = useCallback(() => {
    if (surface.destination?.[0] === 'tokens') {
      onTapSearch();
      return;
    }
    navigateDiscoverDestination(surface.destination);
  }, [onTapSearch, surface.destination]);

  return renderSurfaceLayoutSection({
    data: result.items,
    descriptor: TOKENS_SECTION_DESCRIPTORS[surface.display],
    loading: result.isLoading,
    onPressSeeAll: surface.destination ? onPressSeeAll : undefined,
    placement: result.placement,
    surface,
    surfaceId,
  });
}

function renderSurfaceLayoutSection<T extends PlacementItem>({
  data,
  descriptor,
  loading,
  onPressSeeAll,
  placement,
  surface,
  surfaceId,
}: SurfaceLayoutProps<T>) {
  const leadingAccessory = descriptor.renderHeaderLeadingAccessory?.(data, surface) ?? renderSurfaceHeaderLeadingAccessory(surface);
  const commonProps = {
    destination: surface.destination,
    display: surface.display,
    leadingAccessory,
    loading,
    onPressSeeAll,
    placement,
    placementId: surface.placement,
    sectionId: surface.id,
    surfaceId,
    title: surface.label || surface.id,
  };

  switch (descriptor.layout) {
    case 'carousel':
      return (
        <MarketCarousel
          {...commonProps}
          data={data}
          getItemWidth={descriptor.getItemWidth}
          itemHeight={descriptor.itemHeight}
          itemVerticalBleed={descriptor.itemVerticalBleed}
          itemWidth={descriptor.itemWidth}
          renderItem={descriptor.renderItem}
          renderSkeleton={descriptor.renderSkeleton}
          showHeaderCaret={descriptor.showHeaderCaret?.(surface)}
        />
      );
    case 'grid':
      return (
        <MarketGrid
          {...commonProps}
          data={data}
          itemHeight={descriptor.itemHeight}
          renderItem={descriptor.renderItem}
          renderSkeleton={descriptor.renderSkeleton}
          showHeaderCaret={descriptor.showHeaderCaret?.(surface)}
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
        />
      );
    default:
      return assertNever(descriptor);
  }
}

function useLimitedItems<T>(items: T[], limit: number | undefined): T[] {
  return useMemo(() => (limit ? items.slice(0, limit) : items), [items, limit]);
}

function getHeaderPress(destination: SurfaceLeaf['destination']): (() => void) | undefined {
  if (!destination) return undefined;
  return () => navigateDiscoverDestination(destination);
}

function getPerpPillItemWidth(item: PerpMarketPlacementItem): number {
  return computePerpPillWidth(item.market);
}

function renderPerpPill(item: PerpMarketPlacementItem) {
  return <PerpMarketPill market={item.market} />;
}

function renderLargePerpCard(item: PerpMarketPlacementItem) {
  return <LargePerpMarketCard market={item.market} />;
}

function renderLargePerpGridCard(item: PerpMarketPlacementItem, width: number) {
  return <LargePerpMarketCard market={item.market} width={width} />;
}

function renderLargePerpGridSkeleton(width: number) {
  return <LargePerpMarketCardSkeleton width={width} />;
}

function renderPerpRow(item: PerpMarketPlacementItem) {
  return <PerpMarketRowCard item={item} />;
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

function renderSportsWidget(item: PredictionPlacementItem) {
  return <SportsEventWidgetCard event={item.event} />;
}

function renderSportsWidgetSkeleton() {
  return (
    <Skeleton
      borderRadius={SPORTS_EVENT_WIDGET_CARD_BORDER_RADIUS}
      height={SPORTS_EVENT_WIDGET_CARD_HEIGHT}
      width={SPORTS_EVENT_WIDGET_CARD_WIDTH}
    />
  );
}

function renderSportsHeaderIcon(items: PredictionPlacementItem[], surface: SurfaceLeaf) {
  const leagueId = getSportsSurfaceLeagueId(items, surface);
  return leagueId ? <LeagueIcon leagueId={leagueId} size={28} /> : null;
}

function renderSurfaceHeaderLeadingAccessory(surface: SurfaceLeaf) {
  const leagueId = getLeagueIdByName(surface.label) ?? getLeagueId(surface.id);
  return leagueId ? <LeagueIcon leagueId={leagueId} size={28} /> : null;
}

function getSportsSurfaceLeagueId(items: PredictionPlacementItem[], surface: SurfaceLeaf): LeagueId | undefined {
  const eventLeagueId = getLeagueId(items[0]?.event.slug ?? '');
  if (eventLeagueId) return eventLeagueId;

  const surfaceIdLeagueId = getLeagueId(surface.id);
  if (surfaceIdLeagueId) return surfaceIdLeagueId;

  return getLeagueIdByName(surface.label);
}

function getLeagueIdByName(label: string | undefined): LeagueId | undefined {
  if (!label) return undefined;
  const normalizedLabel = label.toLowerCase();
  const entry = Object.entries(SPORT_LEAGUES).find(
    ([leagueId, league]) => leagueId === normalizedLabel || league.name.toLowerCase() === normalizedLabel
  );
  return entry?.[0] as LeagueId | undefined;
}

function renderTokenCell(item: TokenPlacementItem) {
  return <TokenCell item={item} />;
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
  predictionTile: {
    height: POLYMARKET_EVENTS_LIST_ITEM_HEIGHT,
    width: PREDICTION_TILE_WIDTH,
  },
});
