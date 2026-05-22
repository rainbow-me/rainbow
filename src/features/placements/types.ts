import { type PLACEMENT_SOURCES, type PLACEMENT_TYPES } from '@/features/placements/constants';

export type PlacementId = string;

export type PlacementSource = (typeof PLACEMENT_SOURCES)[keyof typeof PLACEMENT_SOURCES];

export type PlacementType = (typeof PLACEMENT_TYPES)[keyof typeof PLACEMENT_TYPES];

export type PlacementTypeForSource<Source extends PlacementSource> = Source extends 'hyperliquid'
  ? 'perp'
  : Source extends 'polymarket'
    ? 'prediction'
    : Source extends 'rainbow'
      ? 'token'
      : never;

export type PlacementItem = {
  id: string;
};

export type PlacementItemAnalyticsMetadata = {
  marketId?: string;
  marketName?: string;
  marketSlug?: string;
  marketSymbol?: string;
};

export type Placement<Source extends PlacementSource = PlacementSource> = {
  id: PlacementId;
  version: 2;
  source: Source;
  type: PlacementTypeForSource<Source>;
  items: PlacementItem[];
  updatedAt?: string;
};
