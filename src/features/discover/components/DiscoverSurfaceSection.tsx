import { memo, useCallback, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useDiscoverScreenContext } from '@/components/Discover/DiscoverScreenContext';
import { CarouselCardSkeleton } from '@/features/discover/components/carousel/CarouselCardSkeleton';
import { MarketCarousel } from '@/features/discover/components/carousel/MarketCarousel';
import { usePlacementCardTrackPress } from '@/features/discover/components/carousel/placementCardContext';
import { MarketGrid } from '@/features/discover/components/grid/MarketGrid';
import { MarketList } from '@/features/discover/components/list/MarketList';
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
import { SECTION_VERTICAL_GAP } from '@/features/discover/constants';
import { navigateDiscoverDestination } from '@/features/discover/utils/navigation';
import { resolveSurfaceLabel } from '@/features/discover/utils/resolveSurfaceLabel';
import { getPerpsPlacementStore, type PerpMarketPlacementItem } from '@/features/placements/stores/derived/perpsPlacementStore';
import { getPredictionsPlacementStore, type PredictionPlacementItem } from '@/features/placements/stores/derived/predictionsPlacementStore';
import { getTokensPlacementStore, type TokenPlacementItem } from '@/features/placements/stores/derived/tokensPlacementStore';
import { type Surface, type SurfaceLeaf } from '@/features/placements/surfaces/types';
import { isSurfaceContainer } from '@/features/placements/surfaces/utils/surfaceGuards';
import {
  HEIGHT as POLYMARKET_EVENTS_LIST_ITEM_HEIGHT,
  PolymarketEventsListItem,
  PREDICTION_CARD_BORDER_RADIUS,
} from '@/features/polymarket/components/polymarket-events-list/PolymarketEventsListItem';
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
  if (isSurfaceContainer(surface)) return <DiscoverSurfaceSections items={surface.items} surfaceId={surfaceId} />;

  switch (surface.display) {
    case 'perp_pill.carousel':
      return <PerpPillCarouselSection surface={surface} surfaceId={surfaceId} />;
    case 'perp_tile.carousel':
      return <PerpTileCarouselSection surface={surface} surfaceId={surfaceId} />;
    case 'perp_tile.grid':
      return <PerpTileGridSection surface={surface} surfaceId={surfaceId} />;
    case 'perp_row.list':
      return <PerpRowListSection surface={surface} surfaceId={surfaceId} />;
    case 'prediction_tile.carousel':
      return <PredictionTileCarouselSection surface={surface} surfaceId={surfaceId} />;
    case 'prediction_tile.grid':
      return <PredictionTileGridSection surface={surface} surfaceId={surfaceId} />;
    case 'prediction_tile_widget.carousel':
      return <PredictionTileWidgetCarouselSection surface={surface} surfaceId={surfaceId} />;
    case 'prediction_sport_widget.carousel':
      return <PredictionSportWidgetCarouselSection surface={surface} surfaceId={surfaceId} />;
    case 'prediction_sport_widget.list':
      return <PredictionSportWidgetListSection surface={surface} surfaceId={surfaceId} />;
    case 'token_cell.list':
      return <TokenCellListSection surface={surface} surfaceId={surfaceId} />;
    default:
      return assertNever(surface);
  }
});

function PerpPillCarouselSection({ surface, surfaceId }: { surface: SurfaceLeaf; surfaceId: string }) {
  const useStore = useMemo(() => getPerpsPlacementStore(surface.placement), [surface.placement]);
  const result = useStore();
  const data = useLimitedItems(result.items, surface.limit);

  return (
    <MarketCarousel
      data={data}
      destination={surface.destination}
      display={surface.display}
      getItemWidth={getPerpPillItemWidth}
      itemHeight={PERP_MARKET_PILL_HEIGHT}
      itemVerticalBleed={8}
      itemWidth={220}
      loading={result.isLoading}
      onPressSeeAll={getHeaderPress(surface.destination)}
      placement={result.placement}
      placementId={surface.placement}
      renderItem={renderPerpPill}
      renderSkeleton={PerpMarketPillSkeleton}
      sectionId={surface.id}
      showHeaderCaret={surface.destination !== null}
      surfaceId={surfaceId}
      title={resolveSurfaceLabel(surface)}
    />
  );
}

function PerpTileCarouselSection({ surface, surfaceId }: { surface: SurfaceLeaf; surfaceId: string }) {
  const useStore = useMemo(() => getPerpsPlacementStore(surface.placement), [surface.placement]);
  const result = useStore();
  const data = useLimitedItems(result.items, surface.limit);

  return (
    <MarketCarousel
      data={data}
      destination={surface.destination}
      display={surface.display}
      itemHeight={LARGE_PERP_MARKET_CARD_HEIGHT}
      itemWidth={LARGE_PERP_MARKET_CARD_WIDTH}
      loading={result.isLoading}
      onPressSeeAll={getHeaderPress(surface.destination)}
      placement={result.placement}
      placementId={surface.placement}
      renderItem={renderLargePerpCard}
      renderSkeleton={LargePerpMarketCardSkeleton}
      sectionId={surface.id}
      showHeaderCaret={surface.destination !== null}
      surfaceId={surfaceId}
      title={resolveSurfaceLabel(surface)}
    />
  );
}

function PerpTileGridSection({ surface, surfaceId }: { surface: SurfaceLeaf; surfaceId: string }) {
  const useStore = useMemo(() => getPerpsPlacementStore(surface.placement), [surface.placement]);
  const result = useStore();
  const data = useLimitedItems(result.items, surface.limit);

  return (
    <MarketGrid
      data={data}
      destination={surface.destination}
      display={surface.display}
      itemHeight={LARGE_PERP_MARKET_CARD_HEIGHT}
      loading={result.isLoading}
      onPressSeeAll={getHeaderPress(surface.destination)}
      placement={result.placement}
      placementId={surface.placement}
      renderItem={renderLargePerpGridCard}
      renderSkeleton={renderLargePerpGridSkeleton}
      sectionId={surface.id}
      showHeaderCaret={surface.destination !== null}
      surfaceId={surfaceId}
      title={resolveSurfaceLabel(surface)}
    />
  );
}

function PerpRowListSection({ surface, surfaceId }: { surface: SurfaceLeaf; surfaceId: string }) {
  const useStore = useMemo(() => getPerpsPlacementStore(surface.placement), [surface.placement]);
  const result = useStore();

  return (
    <MarketList
      data={result.items}
      destination={surface.destination}
      display={surface.display}
      initialVisibleItemCount={surface.limit}
      loading={result.isLoading}
      onPressSeeAll={getHeaderPress(surface.destination)}
      placement={result.placement}
      placementId={surface.placement}
      renderItem={renderPerpRow}
      renderSkeleton={PerpMarketRowCardSkeleton}
      sectionId={surface.id}
      surfaceId={surfaceId}
      title={resolveSurfaceLabel(surface)}
    />
  );
}

function PredictionTileCarouselSection({ surface, surfaceId }: { surface: SurfaceLeaf; surfaceId: string }) {
  const useStore = useMemo(() => getPredictionsPlacementStore(surface.placement), [surface.placement]);
  const result = useStore();
  const data = useLimitedItems(result.items, surface.limit);

  return (
    <MarketCarousel
      data={data}
      destination={surface.destination}
      display={surface.display}
      itemHeight={POLYMARKET_EVENTS_LIST_ITEM_HEIGHT}
      itemWidth={PREDICTION_TILE_WIDTH}
      loading={result.isLoading}
      onPressSeeAll={getHeaderPress(surface.destination)}
      placement={result.placement}
      placementId={surface.placement}
      renderItem={renderPredictionTile}
      renderSkeleton={renderPredictionSkeleton}
      sectionId={surface.id}
      surfaceId={surfaceId}
      title={resolveSurfaceLabel(surface)}
    />
  );
}

function PredictionTileGridSection({ surface, surfaceId }: { surface: SurfaceLeaf; surfaceId: string }) {
  const useStore = useMemo(() => getPredictionsPlacementStore(surface.placement), [surface.placement]);
  const result = useStore();
  const data = useLimitedItems(result.items, surface.limit);

  return (
    <MarketGrid
      data={data}
      destination={surface.destination}
      display={surface.display}
      itemHeight={POLYMARKET_EVENTS_LIST_ITEM_HEIGHT}
      loading={result.isLoading}
      onPressSeeAll={getHeaderPress(surface.destination)}
      placement={result.placement}
      placementId={surface.placement}
      renderItem={renderPredictionGridTile}
      renderSkeleton={renderPredictionSkeleton}
      sectionId={surface.id}
      surfaceId={surfaceId}
      title={resolveSurfaceLabel(surface)}
    />
  );
}

function PredictionTileWidgetCarouselSection({ surface, surfaceId }: { surface: SurfaceLeaf; surfaceId: string }) {
  const useStore = useMemo(() => getPredictionsPlacementStore(surface.placement), [surface.placement]);
  const result = useStore();
  const data = useLimitedItems(result.items, surface.limit);

  return (
    <MarketCarousel
      data={data}
      destination={surface.destination}
      display={surface.display}
      itemHeight={PREDICTION_MARKET_TILE_CARD_HEIGHT}
      itemVerticalBleed={28}
      itemWidth={PREDICTION_MARKET_TILE_CARD_WIDTH}
      loading={result.isLoading}
      onPressSeeAll={getHeaderPress(surface.destination)}
      placement={result.placement}
      placementId={surface.placement}
      renderItem={renderPredictionWidget}
      renderSkeleton={renderPredictionWidgetSkeleton}
      sectionId={surface.id}
      surfaceId={surfaceId}
      title={resolveSurfaceLabel(surface)}
    />
  );
}

function PredictionSportWidgetCarouselSection({ surface, surfaceId }: { surface: SurfaceLeaf; surfaceId: string }) {
  const useStore = useMemo(() => getPredictionsPlacementStore(surface.placement), [surface.placement]);
  const result = useStore();
  const data = useLimitedItems(result.items, surface.limit);

  return (
    <MarketCarousel
      data={data}
      destination={surface.destination}
      display={surface.display}
      itemHeight={SPORTS_EVENT_WIDGET_CARD_HEIGHT}
      itemWidth={SPORTS_EVENT_WIDGET_CARD_WIDTH}
      loading={result.isLoading}
      onPressSeeAll={getHeaderPress(surface.destination)}
      placement={result.placement}
      placementId={surface.placement}
      renderItem={renderSportsWidget}
      renderSkeleton={renderSportsWidgetSkeleton}
      sectionId={surface.id}
      surfaceId={surfaceId}
      title={resolveSurfaceLabel(surface)}
    />
  );
}

function PredictionSportWidgetListSection({ surface, surfaceId }: { surface: SurfaceLeaf; surfaceId: string }) {
  const useStore = useMemo(() => getPredictionsPlacementStore(surface.placement), [surface.placement]);
  const result = useStore();

  return (
    <MarketList
      data={result.items}
      destination={surface.destination}
      display={surface.display}
      initialVisibleItemCount={surface.limit}
      loading={result.isLoading}
      onPressSeeAll={getHeaderPress(surface.destination)}
      placement={result.placement}
      placementId={surface.placement}
      renderItem={renderSportsWidget}
      renderSkeleton={renderSportsWidgetSkeleton}
      sectionId={surface.id}
      surfaceId={surfaceId}
      title={resolveSurfaceLabel(surface)}
    />
  );
}

function TokenCellListSection({ surface, surfaceId }: { surface: SurfaceLeaf; surfaceId: string }) {
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

  return (
    <MarketList
      data={result.items}
      destination={surface.destination}
      display={surface.display}
      initialVisibleItemCount={surface.limit}
      loading={result.isLoading}
      onPressSeeAll={surface.destination ? onPressSeeAll : undefined}
      placement={result.placement}
      placementId={surface.placement}
      renderItem={renderTokenCell}
      renderSkeleton={TokenCellSkeleton}
      sectionId={surface.id}
      surfaceId={surfaceId}
      title={resolveSurfaceLabel(surface)}
    />
  );
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
    <CarouselCardSkeleton
      borderRadius={PREDICTION_CARD_BORDER_RADIUS}
      height={POLYMARKET_EVENTS_LIST_ITEM_HEIGHT}
      width={PREDICTION_TILE_WIDTH}
    />
  );
}

function renderPredictionWidget(item: PredictionPlacementItem) {
  return <PredictionMarketTileCard event={item.event} />;
}

function renderPredictionWidgetSkeleton() {
  return (
    <CarouselCardSkeleton
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
    <CarouselCardSkeleton
      borderRadius={SPORTS_EVENT_WIDGET_CARD_BORDER_RADIUS}
      height={SPORTS_EVENT_WIDGET_CARD_HEIGHT}
      width={SPORTS_EVENT_WIDGET_CARD_WIDTH}
    />
  );
}

function renderTokenCell(item: TokenPlacementItem) {
  return <TokenCell item={item} />;
}

function assertNever(value: never): never {
  throw new Error(`Unsupported Discover surface display: ${JSON.stringify(value)}`);
}

const PREDICTION_TILE_WIDTH = Math.round((DEVICE_WIDTH - 20 * 2 - 8) / 2);

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
