import { type ReactNode } from 'react';

import { type MARKET_DISPLAY_VALUES } from '@/features/placements/surfaces/constants';
import { type Display, type SurfaceId, type SurfaceLeaf } from '@/features/placements/surfaces/types';
import { type Placement, type PlacementItem } from '@/features/placements/types';
import { type PolymarketMarket } from '@/features/polymarket/types/polymarket-event';

export type CardPressHandler = (metadata: { marketId: string; marketName: string; marketSlug?: string; marketSymbol?: string }) => void;

export type OrderPressHandler = (order: {
  marketId: PolymarketMarket['id'];
  marketName: PolymarketMarket['question'];
  marketSlug: PolymarketMarket['slug'];
  outcome: PolymarketMarket['outcomes'][number];
}) => void;

export type CarouselSectionDescriptor<T extends PlacementItem> = {
  layout: 'carousel';
  getItemWidth?: (item: T) => number;
  itemHorizontalBleed?: number;
  itemHeight: number;
  itemVerticalBleed?: number;
  itemWidth: number;
  renderItem: (item: T, width: number, onPress: CardPressHandler, onOrderPress: OrderPressHandler) => ReactNode;
  renderSkeleton: () => ReactNode;
  showHeaderCaret?: (surface: SurfaceLeaf) => boolean;
  singleItemWidth?: number;
};

export type GridSectionDescriptor<T extends PlacementItem> = {
  layout: 'grid';
  itemHeight: number;
  renderItem: (item: T, width: number, onPress: CardPressHandler, onOrderPress: OrderPressHandler) => ReactNode;
  renderSkeleton: (width: number) => ReactNode;
  showHeaderCaret?: (surface: SurfaceLeaf) => boolean;
};

export type ListSectionDescriptor<T extends PlacementItem> = {
  layout: 'list';
  renderItem: (item: T, onPress: CardPressHandler, onOrderPress: OrderPressHandler) => ReactNode;
  renderSkeleton: () => ReactNode;
};

export type SectionDescriptor<T extends PlacementItem> = CarouselSectionDescriptor<T> | GridSectionDescriptor<T> | ListSectionDescriptor<T>;

export type MarketDisplay = (typeof MARKET_DISPLAY_VALUES)[number];
export type SurfaceLeafWithDisplay<TDisplay extends Display> = SurfaceLeaf & { display: TDisplay };
export type PlacementBackedSurfaceLeafWithDisplay<TDisplay extends Display> = SurfaceLeafWithDisplay<TDisplay> & { placement: string };

export type SectionLayoutProps<T extends PlacementItem> = {
  data: T[];
  descriptor: SectionDescriptor<T>;
  headerCaret?: boolean;
  headerCount?: number;
  leadingAccessory?: ReactNode;
  loading: boolean;
  onPress?: () => void;
  placement?: Placement;
  section: SurfaceLeaf;
  surfaceId: SurfaceId;
};
