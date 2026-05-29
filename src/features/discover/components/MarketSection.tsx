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
import { tokenToMarketPillWidthInput, useTokenMarketDisplay } from '@/features/discover/components/markets/hooks/useTokenMarketDisplay';
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
import { useTokensPlacement, type TokenPlacementItem } from '@/features/placements/stores/derived/tokensPlacementStore';
import { usePlacementsV2Store } from '@/features/placements/stores/placementsStore';
import { MARKET_DISPLAY_VALUES } from '@/features/placements/surfaces/constants';
import { useIsDiscoverSurfacePlacementPending } from '@/features/placements/surfaces/hooks/useDiscoverSurfacePlacements';
import { type SurfaceLeaf } from '@/features/placements/surfaces/types';
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
  return <MarketPlacementContent surface={surface} surfaceId={surfaceId} />;
}

function MarketPlacementContent({
  surface,
  surfaceId,
}: {
  surface: PlacementBackedSurfaceLeafWithDisplay<MarketDisplay>;
  surfaceId: string;
}) {
  const placement = usePlacementsV2Store(state => state.getPlacement(surface.placement));
  const isPendingSurfacePlacement = useIsDiscoverSurfacePlacementPending(surface.placement);
  const isLoadingPlacementSource = usePlacementsV2Store(state => {
    if (state.getPlacement(surface.placement) !== undefined) return false;
    return state.getStatus('isInitialLoad') || state.getStatus('isIdle') || state.getStatus('isLoading');
  });

  if (placement?.source === 'rainbow') {
    return <TokenMarketPlacementContent surface={surface} surfaceId={surfaceId} />;
  }

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

function TokenMarketPlacementContent({
  surface,
  surfaceId,
}: {
  surface: PlacementBackedSurfaceLeafWithDisplay<MarketDisplay>;
  surfaceId: string;
}) {
  const { onTapSearch } = useDiscoverScreenContext();
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const tokensResult = useTokensPlacement(surface.placement);
  const tokenDescriptor = useMemo<SectionDescriptor<TokenPlacementItem>>(() => {
    switch (surface.display) {
      case 'market_pill.carousel':
        return {
          ...MARKET_SECTION_DESCRIPTORS[surface.display],
          getItemWidth: (item: TokenPlacementItem) => computeMarketPillWidth(tokenToMarketPillWidthInput({ item, nativeCurrency })),
          renderItem: (item: TokenPlacementItem, _: number, analyticsContext: DiscoverCardAnalyticsContext) => (
            <TokenMarketItem analyticsContext={analyticsContext} item={item} nativeCurrency={nativeCurrency} variant="pill" />
          ),
        };
      case 'market_tile.carousel':
        return {
          ...MARKET_SECTION_DESCRIPTORS[surface.display],
          renderItem: (item: TokenPlacementItem, _: number, analyticsContext: DiscoverCardAnalyticsContext) => (
            <TokenMarketItem analyticsContext={analyticsContext} item={item} nativeCurrency={nativeCurrency} variant="tile" />
          ),
        };
      case 'market_tile.grid':
        return {
          ...MARKET_SECTION_DESCRIPTORS[surface.display],
          renderItem: (item: TokenPlacementItem, width: number, analyticsContext: DiscoverCardAnalyticsContext) => (
            <TokenMarketItem analyticsContext={analyticsContext} item={item} nativeCurrency={nativeCurrency} variant="tile" width={width} />
          ),
        };
      case 'market_cell.list':
        return {
          ...MARKET_SECTION_DESCRIPTORS[surface.display],
          renderItem: (item: TokenPlacementItem, analyticsContext: DiscoverCardAnalyticsContext) => (
            <TokenMarketItem analyticsContext={analyticsContext} item={item} nativeCurrency={nativeCurrency} variant="cell" />
          ),
        };
    }
  }, [nativeCurrency, surface.display]);
  const onPressSeeAll = useCallback(() => {
    if (surface.destination?.[0] === 'tokens') {
      onTapSearch();
      return;
    }
    navigateDiscoverDestination(surface.destination);
  }, [onTapSearch, surface.destination]);

  return renderSectionLayout({
    data: tokensResult.items,
    descriptor: tokenDescriptor,
    loading: tokensResult.isLoading,
    onPressSeeAll: surface.destination ? onPressSeeAll : undefined,
    placement: tokensResult.placement,
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

function TokenMarketItem({
  analyticsContext,
  item,
  nativeCurrency,
  variant,
  width,
}: {
  analyticsContext: DiscoverCardAnalyticsContext;
  item: TokenPlacementItem;
  nativeCurrency: ReturnType<typeof userAssetsStoreManager.getState>['currency'];
  variant: 'cell' | 'pill' | 'tile';
  width?: number;
}) {
  const displayItem = useTokenMarketDisplay({ item, nativeCurrency });

  switch (variant) {
    case 'cell':
      return <MarketCell analyticsContext={analyticsContext} item={displayItem} />;
    case 'pill':
      return <MarketPill analyticsContext={analyticsContext} item={displayItem} />;
    case 'tile':
      return <MarketTileCard analyticsContext={analyticsContext} item={displayItem} width={width} />;
  }
}
