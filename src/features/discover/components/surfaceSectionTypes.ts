import { type ReactNode } from 'react';

import { type MARKET_DISPLAY_VALUES, type PREDICTION_DISPLAY_VALUES } from '@/features/placements/surfaces/constants';
import { type Display, type SurfaceLeaf } from '@/features/placements/surfaces/types';
import { type Placement, type PlacementItem } from '@/features/placements/types';

export type CarouselSectionDescriptor<T extends PlacementItem> = {
  layout: 'carousel';
  getItemWidth?: (item: T) => number;
  itemHeight: number;
  itemVerticalBleed?: number;
  itemWidth: number;
  renderItem: (item: T) => ReactNode;
  renderSkeleton: () => ReactNode;
  showHeaderCaret?: (surface: SurfaceLeaf) => boolean;
};

export type GridSectionDescriptor<T extends PlacementItem> = {
  layout: 'grid';
  itemHeight: number;
  renderItem: (item: T, width: number) => ReactNode;
  renderSkeleton: (width: number) => ReactNode;
  showHeaderCaret?: (surface: SurfaceLeaf) => boolean;
};

export type ListSectionDescriptor<T extends PlacementItem> = {
  layout: 'list';
  renderItem: (item: T) => ReactNode;
  renderSkeleton: () => ReactNode;
};

export type SectionDescriptor<T extends PlacementItem> = CarouselSectionDescriptor<T> | GridSectionDescriptor<T> | ListSectionDescriptor<T>;

export type MarketDisplay = (typeof MARKET_DISPLAY_VALUES)[number];
export type PredictionsDisplay = (typeof PREDICTION_DISPLAY_VALUES)[number];
export type SurfaceLeafWithDisplay<TDisplay extends Display> = SurfaceLeaf & { display: TDisplay };
export type PlacementBackedSurfaceLeafWithDisplay<TDisplay extends Display> = SurfaceLeafWithDisplay<TDisplay> & { placement: string };

export type SurfaceLayoutProps<T extends PlacementItem> = {
  data: T[];
  descriptor: SectionDescriptor<T>;
  headerCount?: number;
  loading: boolean;
  onPressSeeAll?: () => void;
  placement: Placement | undefined;
  surface: SurfaceLeaf;
  surfaceId: string;
};
