import { useCallback, useMemo } from 'react';

import { useDiscoverScreenContext } from '@/components/Discover/DiscoverScreenContext';
import { type NativeCurrencyKey } from '@/features/currency/types';
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
  type CardPressHandler,
  type MarketDisplay,
  type PlacementBackedSurfaceLeafWithDisplay,
  type SectionDescriptor,
  type SurfaceLeafWithDisplay,
} from '@/features/discover/types/sectionLayout';
import { hasDestinationRoot, navigateDiscoverDestination } from '@/features/discover/utils/navigation';
import { maybeNavigateToPerpsExplainSheet } from '@/features/perps/utils/navigateToPerps';
import { usePerpsPlacement, type PerpMarketPlacementItem } from '@/features/placements/stores/derived/perpsPlacementStore';
import { useTokensPlacement, type TokenPlacementItem } from '@/features/placements/stores/derived/tokensPlacementStore';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { MARKET_DISPLAY_VALUES } from '@/features/placements/surfaces/constants';
import { useIsDiscoverSurfacePlacementPending } from '@/features/placements/surfaces/hooks/useDiscoverSurfacePlacements';
import { type SurfaceId, type SurfaceLeaf } from '@/features/placements/surfaces/types';
import { useRemoteConfig } from '@/model/remoteConfig';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';

const hasDestination = (surface: SurfaceLeaf) => surface.destination !== null;
const MARKET_TILE_SHADOW_BLEED = 28;

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
    itemHorizontalBleed: MARKET_TILE_SHADOW_BLEED,
    itemHeight: MARKET_TILE_CARD_HEIGHT,
    itemVerticalBleed: MARKET_TILE_SHADOW_BLEED,
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

export function MarketSection({ surface, surfaceId }: { surface: SurfaceLeafWithDisplay<MarketDisplay>; surfaceId: SurfaceId }) {
  if (!hasPlacement(surface)) return null;
  return <MarketPlacementContent surface={surface} surfaceId={surfaceId} />;
}

function MarketPlacementContent({
  surface,
  surfaceId,
}: {
  surface: PlacementBackedSurfaceLeafWithDisplay<MarketDisplay>;
  surfaceId: SurfaceId;
}) {
  const perpsEnabled = useRemoteConfig('perps_enabled').perps_enabled;
  const placement = usePlacementsStore(state => state.getPlacement(surface.placement));
  const isPendingSurfacePlacement = useIsDiscoverSurfacePlacementPending(surface.placement);
  const isLoadingPlacementSource = usePlacementsStore(state => {
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
      onPress: undefined,
      placement,
      section: surface,
      surfaceId,
    });
  }

  return null;
}

function PerpsMarketPlacementContent({
  surface,
  surfaceId,
}: {
  surface: PlacementBackedSurfaceLeafWithDisplay<MarketDisplay>;
  surfaceId: SurfaceId;
}) {
  const perpsResult = usePerpsPlacement(surface.placement);
  const perpDescriptor = useMemo<SectionDescriptor<PerpMarketPlacementItem>>(() => {
    switch (surface.display) {
      case 'market_pill.carousel':
        return {
          ...MARKET_SECTION_DESCRIPTORS[surface.display],
          getItemWidth: (item: PerpMarketPlacementItem) => computeMarketPillWidth(perpToMarketPillWidthInput(item)),
          renderItem: (item: PerpMarketPlacementItem, _: number, onPress: CardPressHandler) => (
            <PerpMarketItem item={item} onPress={onPress} variant="pill" />
          ),
        };
      case 'market_tile.carousel':
        return {
          ...MARKET_SECTION_DESCRIPTORS[surface.display],
          renderItem: (item: PerpMarketPlacementItem, _: number, onPress: CardPressHandler) => (
            <PerpMarketItem item={item} onPress={onPress} variant="tile" />
          ),
        };
      case 'market_tile.grid':
        return {
          ...MARKET_SECTION_DESCRIPTORS[surface.display],
          renderItem: (item: PerpMarketPlacementItem, width: number, onPress: CardPressHandler) => (
            <PerpMarketItem item={item} onPress={onPress} variant="tile" width={width} />
          ),
        };
      case 'market_cell.list':
        return {
          ...MARKET_SECTION_DESCRIPTORS[surface.display],
          renderItem: (item: PerpMarketPlacementItem, onPress: CardPressHandler) => (
            <PerpMarketItem item={item} onPress={onPress} variant="cell" />
          ),
        };
    }
  }, [surface.display]);
  // Perp "See All" routes to the CMS destination (perps -> perps screen), gated on
  // a perps destination existing.
  const perpsDestination = hasDestinationRoot(surface.destination, 'perps') ? surface.destination : null;
  const onPress = useCallback(() => {
    if (perpsDestination) navigateDiscoverDestination(perpsDestination);
  }, [perpsDestination]);

  return renderSectionLayout({
    data: perpsResult.items,
    descriptor: perpDescriptor,
    loading: perpsResult.isLoading,
    onPress: perpsDestination && perpsResult.placement ? onPress : undefined,
    placement: perpsResult.placement,
    section: surface,
    surfaceId,
  });
}

function TokenMarketPlacementContent({
  surface,
  surfaceId,
}: {
  surface: PlacementBackedSurfaceLeafWithDisplay<MarketDisplay>;
  surfaceId: SurfaceId;
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
          renderItem: (item: TokenPlacementItem, _: number, onPress: CardPressHandler) => (
            <TokenMarketItem item={item} nativeCurrency={nativeCurrency} onPress={onPress} variant="pill" />
          ),
        };
      case 'market_tile.carousel':
        return {
          ...MARKET_SECTION_DESCRIPTORS[surface.display],
          renderItem: (item: TokenPlacementItem, _: number, onPress: CardPressHandler) => (
            <TokenMarketItem item={item} nativeCurrency={nativeCurrency} onPress={onPress} variant="tile" />
          ),
        };
      case 'market_tile.grid':
        return {
          ...MARKET_SECTION_DESCRIPTORS[surface.display],
          renderItem: (item: TokenPlacementItem, width: number, onPress: CardPressHandler) => (
            <TokenMarketItem item={item} nativeCurrency={nativeCurrency} onPress={onPress} variant="tile" width={width} />
          ),
        };
      case 'market_cell.list':
        return {
          ...MARKET_SECTION_DESCRIPTORS[surface.display],
          renderItem: (item: TokenPlacementItem, onPress: CardPressHandler) => (
            <TokenMarketItem item={item} nativeCurrency={nativeCurrency} onPress={onPress} variant="cell" />
          ),
        };
    }
  }, [nativeCurrency, surface.display]);
  const onPress = useCallback(() => onTapSearch(), [onTapSearch]);

  return renderSectionLayout({
    data: tokensResult.items,
    descriptor: tokenDescriptor,
    loading: tokensResult.isLoading,
    onPress: hasDestinationRoot(surface.destination, 'tokens') && tokensResult.placement ? onPress : undefined,
    placement: tokensResult.placement,
    section: surface,
    surfaceId,
  });
}

function hasPlacement(surface: SurfaceLeafWithDisplay<MarketDisplay>): surface is PlacementBackedSurfaceLeafWithDisplay<MarketDisplay> {
  return typeof surface.placement === 'string' && surface.placement.length > 0;
}

function renderMarketPill(item: MarketDisplayItem, _: number, onPress: CardPressHandler) {
  return <MarketPill item={item} onPress={() => onPress({ marketId: item.id, marketName: item.displayName })} />;
}

function renderMarketTile(item: MarketDisplayItem, _: number, onPress: CardPressHandler) {
  return <MarketTileCard item={item} onPress={() => onPress({ marketId: item.id, marketName: item.displayName })} />;
}

function renderMarketGridTile(item: MarketDisplayItem, width: number, onPress: CardPressHandler) {
  return <MarketTileCard item={item} onPress={() => onPress({ marketId: item.id, marketName: item.displayName })} width={width} />;
}

function renderMarketGridTileSkeleton(width: number) {
  return <MarketTileCardSkeleton width={width} />;
}

function renderMarketCell(item: MarketDisplayItem, onPress: CardPressHandler) {
  return <MarketCell item={item} onPress={() => onPress({ marketId: item.id, marketName: item.displayName })} />;
}

function TokenMarketItem({
  item,
  nativeCurrency,
  onPress,
  variant,
  width,
}: {
  item: TokenPlacementItem;
  nativeCurrency: NativeCurrencyKey;
  onPress: CardPressHandler;
  variant: 'cell' | 'pill' | 'tile';
  width?: number;
}) {
  const displayItem = useTokenMarketDisplay({ item, nativeCurrency });
  const handlePress = useCallback(() => {
    onPress({ marketId: item.id, marketName: item.asset.name, marketSymbol: item.asset.symbol });
    Navigation.handleAction(Routes.EXPANDED_ASSET_SHEET_V2, {
      asset: item.asset,
      address: item.asset.address,
      chainId: item.asset.chainId,
    });
  }, [item.asset, item.id, onPress]);

  switch (variant) {
    case 'cell':
      return <MarketCell item={displayItem} onPress={handlePress} />;
    case 'pill':
      return <MarketPill item={displayItem} onPress={handlePress} />;
    case 'tile':
      return <MarketTileCard item={displayItem} onPress={handlePress} width={width} />;
  }
}

function PerpMarketItem({
  item,
  onPress,
  variant,
  width,
}: {
  item: PerpMarketPlacementItem;
  onPress: CardPressHandler;
  variant: 'cell' | 'pill' | 'tile';
  width?: number;
}) {
  const displayItem = usePerpMarketDisplay(item);
  const handlePress = useCallback(() => {
    onPress({
      marketId: item.market.symbol,
      marketName: item.market.metadata?.name ?? item.market.baseSymbol,
      marketSymbol: item.market.baseSymbol,
    });
    maybeNavigateToPerpsExplainSheet(() => Navigation.handleAction(Routes.PERPS_DETAIL_SCREEN, { market: item.market }));
  }, [item.market, onPress]);

  switch (variant) {
    case 'cell':
      return <MarketCell item={displayItem} onPress={handlePress} />;
    case 'pill':
      return <MarketPill item={displayItem} onPress={handlePress} />;
    case 'tile':
      return <MarketTileCard item={displayItem} onPress={handlePress} width={width} />;
  }
}
