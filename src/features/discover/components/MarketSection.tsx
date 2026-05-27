import { useCallback, useMemo } from 'react';

import { useDiscoverScreenContext } from '@/components/Discover/DiscoverScreenContext';
import { MarketCell, MarketCellSkeleton } from '@/features/discover/components/markets/cards/MarketCell';
import {
  computeMarketPillWidth,
  MARKET_PILL_HEIGHT,
  MarketPill,
  MarketPillSkeleton,
} from '@/features/discover/components/markets/cards/MarketPill';
import {
  MARKET_TILE_CARD_HEIGHT,
  MARKET_TILE_CARD_WIDTH,
  MarketTileCard,
  MarketTileCardSkeleton,
} from '@/features/discover/components/markets/cards/MarketTileCard';
import {
  perpToMarketDisplayItem,
  tokenToMarketDisplayItem,
  tokenToMarketPillWidthInput,
} from '@/features/discover/components/markets/marketDisplayItemMappers';
import { getHeaderPress, renderSectionLayout } from '@/features/discover/components/SectionLayout';
import {
  type DiscoverCardAnalyticsContext,
  type MarketDisplay,
  type PlacementBackedSurfaceLeafWithDisplay,
  type SectionDescriptor,
  type SurfaceLeafWithDisplay,
} from '@/features/discover/components/surfaceSectionTypes';
import { type MarketDisplayItem } from '@/features/discover/types/marketDisplayItem';
import { navigateDiscoverDestination } from '@/features/discover/utils/navigation';
import { getPerpsPlacementStore } from '@/features/placements/stores/derived/perpsPlacementStore';
import { getTokensPlacementStore, type TokenPlacementItem } from '@/features/placements/stores/derived/tokensPlacementStore';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { MARKET_DISPLAY_VALUES } from '@/features/placements/surfaces/constants';
import { useIsDiscoverSurfacePlacementPending } from '@/features/placements/surfaces/hooks/useSurface';
import { type SurfaceLeaf } from '@/features/placements/surfaces/types';
import useColorForAsset from '@/hooks/useColorForAsset';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';

const hasDestination = (surface: SurfaceLeaf) => surface.destination !== null;

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

export function isMarketSurface(surface: SurfaceLeaf): surface is SurfaceLeafWithDisplay<MarketDisplay> {
  return (MARKET_DISPLAY_VALUES as readonly string[]).includes(surface.display);
}

export function MarketSection({ surface, surfaceId }: { surface: SurfaceLeafWithDisplay<MarketDisplay>; surfaceId: string }) {
  if (!hasPlacement(surface)) return null;
  return <PlacementBackedMarketSection surface={surface} surfaceId={surfaceId} />;
}

function PlacementBackedMarketSection({
  surface,
  surfaceId,
}: {
  surface: PlacementBackedSurfaceLeafWithDisplay<MarketDisplay>;
  surfaceId: string;
}) {
  const source = usePlacementsStore(state => state.getPlacement(surface.placement)?.source);
  const isPendingSurfacePlacement = useIsDiscoverSurfacePlacementPending(surface.placement);
  const isLoadingPlacementSource = usePlacementsStore(state => {
    if (state.getPlacement(surface.placement) !== undefined) return false;
    return state.getStatus('isInitialLoad') || state.getStatus('isIdle') || state.getStatus('isLoading');
  });

  if (source === 'hyperliquid') return <PerpsMarketSection surface={surface} surfaceId={surfaceId} />;
  if (source === 'rainbow') return <TokensMarketSection surface={surface} surfaceId={surfaceId} />;
  if (isLoadingPlacementSource || isPendingSurfacePlacement) {
    return renderSectionLayout({
      data: [],
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

function PerpsMarketSection({ surface, surfaceId }: { surface: PlacementBackedSurfaceLeafWithDisplay<MarketDisplay>; surfaceId: string }) {
  const useStore = useMemo(() => getPerpsPlacementStore(surface.placement), [surface.placement]);
  const result = useStore();
  const descriptor = MARKET_SECTION_DESCRIPTORS[surface.display];
  const items = useMemo(() => result.items.map(perpToMarketDisplayItem), [result.items]);

  return renderSectionLayout({
    data: items,
    descriptor,
    loading: result.isLoading,
    onPressSeeAll: getHeaderPress(surface.destination),
    placement: result.placement,
    surface,
    surfaceId,
  });
}

function TokensMarketSection({ surface, surfaceId }: { surface: PlacementBackedSurfaceLeafWithDisplay<MarketDisplay>; surfaceId: string }) {
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

  return renderSectionLayout({
    data: result.items,
    descriptor,
    loading: result.isLoading,
    onPressSeeAll: surface.destination ? onPressSeeAll : undefined,
    placement: result.placement,
    surface,
    surfaceId,
  });
}

function hasPlacement(surface: SurfaceLeafWithDisplay<MarketDisplay>): surface is PlacementBackedSurfaceLeafWithDisplay<MarketDisplay> {
  return typeof surface.placement === 'string' && surface.placement.length > 0;
}

function renderMarketPill(item: MarketDisplayItem, _: number, analyticsContext: DiscoverCardAnalyticsContext) {
  return <MarketPill analyticsContext={analyticsContext} item={item} />;
}

function renderMarketTile(item: MarketDisplayItem, _: number, analyticsContext: DiscoverCardAnalyticsContext) {
  return <MarketTileCard analyticsContext={analyticsContext} item={item} />;
}

function renderMarketGridTile(item: MarketDisplayItem, width: number, analyticsContext: DiscoverCardAnalyticsContext) {
  return <MarketTileCard analyticsContext={analyticsContext} item={item} width={width} />;
}

function renderMarketGridTileSkeleton(width: number) {
  return <MarketTileCardSkeleton width={width} />;
}

function renderMarketCell(item: MarketDisplayItem, analyticsContext: DiscoverCardAnalyticsContext) {
  return <MarketCell analyticsContext={analyticsContext} item={item} />;
}

function getTokenMarketSectionDescriptor(
  display: MarketDisplay,
  nativeCurrency: ReturnType<typeof userAssetsStoreManager.getState>['currency']
): SectionDescriptor<TokenPlacementItem> {
  switch (display) {
    case 'market_pill.carousel':
      return {
        ...MARKET_SECTION_DESCRIPTORS[display],
        getItemWidth: (item: TokenPlacementItem) => computeMarketPillWidth(tokenToMarketPillWidthInput({ item, nativeCurrency })),
        renderItem: (item: TokenPlacementItem, _: number, analyticsContext: DiscoverCardAnalyticsContext) => (
          <TokenMarketPill analyticsContext={analyticsContext} item={item} nativeCurrency={nativeCurrency} />
        ),
      };
    case 'market_tile.carousel':
      return {
        ...MARKET_SECTION_DESCRIPTORS[display],
        renderItem: (item: TokenPlacementItem, _: number, analyticsContext: DiscoverCardAnalyticsContext) => (
          <TokenMarketTile analyticsContext={analyticsContext} item={item} nativeCurrency={nativeCurrency} />
        ),
      };
    case 'market_tile.grid':
      return {
        ...MARKET_SECTION_DESCRIPTORS[display],
        renderItem: (item: TokenPlacementItem, width: number, analyticsContext: DiscoverCardAnalyticsContext) => (
          <TokenMarketTile analyticsContext={analyticsContext} item={item} nativeCurrency={nativeCurrency} width={width} />
        ),
      };
    case 'market_cell.list':
      return {
        ...MARKET_SECTION_DESCRIPTORS[display],
        renderItem: (item: TokenPlacementItem, analyticsContext: DiscoverCardAnalyticsContext) => (
          <TokenMarketCell analyticsContext={analyticsContext} item={item} nativeCurrency={nativeCurrency} />
        ),
      };
  }
}

function TokenMarketPill({
  analyticsContext,
  item,
  nativeCurrency,
}: {
  analyticsContext: DiscoverCardAnalyticsContext;
  item: TokenPlacementItem;
  nativeCurrency: ReturnType<typeof userAssetsStoreManager.getState>['currency'];
}) {
  const displayItem = useTokenMarketDisplayItem(item, nativeCurrency);
  return <MarketPill analyticsContext={analyticsContext} item={displayItem} />;
}

function TokenMarketTile({
  analyticsContext,
  item,
  nativeCurrency,
  width,
}: {
  analyticsContext: DiscoverCardAnalyticsContext;
  item: TokenPlacementItem;
  nativeCurrency: ReturnType<typeof userAssetsStoreManager.getState>['currency'];
  width?: number;
}) {
  const displayItem = useTokenMarketDisplayItem(item, nativeCurrency);
  return <MarketTileCard analyticsContext={analyticsContext} item={displayItem} width={width} />;
}

function TokenMarketCell({
  analyticsContext,
  item,
  nativeCurrency,
}: {
  analyticsContext: DiscoverCardAnalyticsContext;
  item: TokenPlacementItem;
  nativeCurrency: ReturnType<typeof userAssetsStoreManager.getState>['currency'];
}) {
  const displayItem = useTokenMarketDisplayItem(item, nativeCurrency);
  return <MarketCell analyticsContext={analyticsContext} item={displayItem} />;
}

function useTokenMarketDisplayItem(
  item: TokenPlacementItem,
  nativeCurrency: ReturnType<typeof userAssetsStoreManager.getState>['currency']
): MarketDisplayItem {
  const accentColor = useColorForAsset({
    address: item.asset.address,
    name: item.asset.name,
    symbol: item.asset.symbol,
  });

  return useMemo(() => tokenToMarketDisplayItem({ accentColor, item, nativeCurrency }), [accentColor, item, nativeCurrency]);
}
