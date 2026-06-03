import { useCallback, useMemo } from 'react';

import { useDiscoverScreenContext } from '@/components/Discover/DiscoverScreenContext';
import { type NativeCurrencyKey } from '@/entities/nativeCurrencyTypes';
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
import { perpToMarketPillWidthInput, usePerpMarketDisplay } from '@/features/discover/components/markets/hooks/usePerpMarketDisplay';
import { tokenToMarketPillWidthInput, useTokenMarketDisplay } from '@/features/discover/components/markets/hooks/useTokenMarketDisplay';
import { renderSectionLayout } from '@/features/discover/components/SectionLayout';
import { type MarketDisplayItem } from '@/features/discover/types/marketDisplayItem';
import {
  type MarketDisplay,
  type PlacementBackedSurfaceLeafWithDisplay,
  type SectionDescriptor,
  type SurfaceLeafWithDisplay,
} from '@/features/discover/types/sectionLayout';
import { navigateDiscoverDestination } from '@/features/discover/utils/navigation';
import { usePerpsEnabled, usePerpsPlacement, type PerpMarketPlacementItem } from '@/features/placements/stores/derived/perpsPlacementStore';
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
  const perpsEnabled = usePerpsEnabled();
  const placement = usePlacementsV2Store(state => state.getPlacement(surface.placement));
  const isPendingSurfacePlacement = useIsDiscoverSurfacePlacementPending(surface.placement);
  const isLoadingPlacementSource = usePlacementsV2Store(state => {
    if (state.getPlacement(surface.placement) !== undefined) return false;
    return state.getStatus('isInitialLoad') || state.getStatus('isIdle') || state.getStatus('isLoading');
  });

  if (placement?.source === 'hyperliquid') {
    if (!perpsEnabled) return null;
    return <PerpsMarketPlacementContent surface={surface} surfaceId={surfaceId} />;
  }

  if (placement?.source === 'rainbow') {
    return <TokenMarketPlacementContent surface={surface} surfaceId={surfaceId} />;
  }

  if (isLoadingPlacementSource || isPendingSurfacePlacement) {
    return renderSectionLayout({
      data: [],
      descriptor: MARKET_SECTION_DESCRIPTORS[surface.display],
      loading: true,
      onPressSeeAll: undefined,
      surface,
    });
  }

  return null;
}

function PerpsMarketPlacementContent({
  surface,
}: {
  surface: PlacementBackedSurfaceLeafWithDisplay<MarketDisplay>;
  // surfaceId is threaded from MarketPlacementContent for future use (#7553)
  surfaceId: string;
}) {
  const perpsResult = usePerpsPlacement(surface.placement);
  const perpDescriptor = useMemo<SectionDescriptor<PerpMarketPlacementItem>>(() => {
    switch (surface.display) {
      case 'market_pill.carousel':
        return {
          ...MARKET_SECTION_DESCRIPTORS[surface.display],
          getItemWidth: (item: PerpMarketPlacementItem) => computeMarketPillWidth(perpToMarketPillWidthInput(item)),
          renderItem: (item: PerpMarketPlacementItem) => <PerpMarketItem item={item} variant="pill" />,
        };
      case 'market_tile.carousel':
        return {
          ...MARKET_SECTION_DESCRIPTORS[surface.display],
          renderItem: (item: PerpMarketPlacementItem) => <PerpMarketItem item={item} variant="tile" />,
        };
      case 'market_tile.grid':
        return {
          ...MARKET_SECTION_DESCRIPTORS[surface.display],
          renderItem: (item: PerpMarketPlacementItem, width: number) => <PerpMarketItem item={item} variant="tile" width={width} />,
        };
      case 'market_cell.list':
        return {
          ...MARKET_SECTION_DESCRIPTORS[surface.display],
          renderItem: (item: PerpMarketPlacementItem) => <PerpMarketItem item={item} variant="cell" />,
        };
    }
  }, [surface.display]);
  // Perp "See All" routes to the CMS destination (perps -> perps screen), gated on
  // a destination existing.
  const onPressSeeAll = useCallback(() => navigateDiscoverDestination(surface.destination), [surface.destination]);

  return renderSectionLayout({
    data: perpsResult.items,
    descriptor: perpDescriptor,
    loading: perpsResult.isLoading,
    onPressSeeAll: hasDestination(surface) ? onPressSeeAll : undefined,
    surface,
  });
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
          renderItem: (item: TokenPlacementItem) => <TokenMarketItem item={item} nativeCurrency={nativeCurrency} variant="pill" />,
        };
      case 'market_tile.carousel':
        return {
          ...MARKET_SECTION_DESCRIPTORS[surface.display],
          renderItem: (item: TokenPlacementItem) => <TokenMarketItem item={item} nativeCurrency={nativeCurrency} variant="tile" />,
        };
      case 'market_tile.grid':
        return {
          ...MARKET_SECTION_DESCRIPTORS[surface.display],
          renderItem: (item: TokenPlacementItem, width: number) => (
            <TokenMarketItem item={item} nativeCurrency={nativeCurrency} variant="tile" width={width} />
          ),
        };
      case 'market_cell.list':
        return {
          ...MARKET_SECTION_DESCRIPTORS[surface.display],
          renderItem: (item: TokenPlacementItem) => <TokenMarketItem item={item} nativeCurrency={nativeCurrency} variant="cell" />,
        };
    }
  }, [nativeCurrency, surface.display]);
  // Token "See All" opens Discover search rather than routing a CMS destination;
  // navigateDiscoverDestination('tokens') is intentionally a no-op.
  const onPressSeeAll = useCallback(() => onTapSearch(), [onTapSearch]);

  return renderSectionLayout({
    data: tokensResult.items,
    descriptor: tokenDescriptor,
    loading: tokensResult.isLoading,
    onPressSeeAll: surface.destination?.[0] === 'tokens' ? onPressSeeAll : undefined,
    surface,
  });
}

function hasPlacement(surface: SurfaceLeafWithDisplay<MarketDisplay>): surface is PlacementBackedSurfaceLeafWithDisplay<MarketDisplay> {
  return typeof surface.placement === 'string' && surface.placement.length > 0;
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

function TokenMarketItem({
  item,
  nativeCurrency,
  variant,
  width,
}: {
  item: TokenPlacementItem;
  nativeCurrency: NativeCurrencyKey;
  variant: 'cell' | 'pill' | 'tile';
  width?: number;
}) {
  const displayItem = useTokenMarketDisplay({ item, nativeCurrency });

  switch (variant) {
    case 'cell':
      return <MarketCell item={displayItem} />;
    case 'pill':
      return <MarketPill item={displayItem} />;
    case 'tile':
      return <MarketTileCard item={displayItem} width={width} />;
  }
}

function PerpMarketItem({ item, variant, width }: { item: PerpMarketPlacementItem; variant: 'cell' | 'pill' | 'tile'; width?: number }) {
  const displayItem = usePerpMarketDisplay(item);

  switch (variant) {
    case 'cell':
      return <MarketCell item={displayItem} />;
    case 'pill':
      return <MarketPill item={displayItem} />;
    case 'tile':
      return <MarketTileCard item={displayItem} width={width} />;
  }
}
