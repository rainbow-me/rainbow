import { useCallback, useMemo } from 'react';

import { useDiscoverScreenContext } from '@/components/Discover/DiscoverScreenContext';
import {
  getTokenPerpMarketSymbol,
  perpToMarketDisplayItem,
  tokenToMarketDisplayItem,
} from '@/features/discover/adapters/toMarketDisplayItem';
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
import { MARKET_SHADOW_COLOR } from '@/features/discover/components/markets/marketCardChrome';
import { getHeaderPress, renderSurfaceLayoutSection } from '@/features/discover/components/SurfaceLayoutSection';
import {
  type MarketDisplay,
  type PlacementBackedSurfaceLeafWithDisplay,
  type SectionDescriptor,
  type SurfaceLeafWithDisplay,
} from '@/features/discover/components/surfaceSectionTypes';
import { type MarketDisplayItem } from '@/features/discover/types/marketDisplayItem';
import { navigateDiscoverDestination } from '@/features/discover/utils/navigation';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { getPerpsPlacementStore } from '@/features/placements/stores/derived/perpsPlacementStore';
import { getTokensPlacementStore, type TokenPlacementItem } from '@/features/placements/stores/derived/tokensPlacementStore';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { MARKET_DISPLAY_VALUES } from '@/features/placements/surfaces/constants';
import { useIsDiscoverSurfacePlacementPending } from '@/features/placements/surfaces/hooks/useSurface';
import { type SurfaceLeaf } from '@/features/placements/surfaces/types';
import useColorForAsset from '@/hooks/useColorForAsset';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';

const EMPTY_MARKET_DISPLAY_ITEMS: MarketDisplayItem[] = [];
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

export function MarketSurfaceSection({ surface, surfaceId }: { surface: SurfaceLeafWithDisplay<MarketDisplay>; surfaceId: string }) {
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
  const isPendingSurfacePlacement = useIsDiscoverSurfacePlacementPending(surface.placement);
  const isLoadingPlacementSource = usePlacementsStore(state => {
    if (state.getPlacement(surface.placement) !== undefined) return false;
    return state.getStatus('isInitialLoad') || state.getStatus('isIdle') || state.getStatus('isLoading');
  });

  if (source === 'hyperliquid') return <PerpsMarketSurfaceSection surface={surface} surfaceId={surfaceId} />;
  if (source === 'rainbow') return <TokensMarketSurfaceSection surface={surface} surfaceId={surfaceId} />;
  if (isLoadingPlacementSource || isPendingSurfacePlacement) {
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

function getTokenMarketSectionDescriptor(
  display: MarketDisplay,
  nativeCurrency: ReturnType<typeof userAssetsStoreManager.getState>['currency']
): SectionDescriptor<TokenPlacementItem> {
  switch (display) {
    case 'market_pill.carousel':
      return {
        ...MARKET_SECTION_DESCRIPTORS[display],
        getItemWidth: (item: TokenPlacementItem) =>
          computeMarketPillWidth(tokenToMarketDisplayItem({ accentColor: MARKET_SHADOW_COLOR, item, nativeCurrency })),
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
