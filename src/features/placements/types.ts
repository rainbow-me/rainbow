import { type PLACEMENT_SOURCES, type PLACEMENT_TYPES } from '@/features/placements/constants';

export type PlacementId = string;

export type PlacementSource = (typeof PLACEMENT_SOURCES)[keyof typeof PLACEMENT_SOURCES];

export type PlacementType = (typeof PLACEMENT_TYPES)[keyof typeof PLACEMENT_TYPES];

export type PlacementItem = {
  id: string;
};

export type PlacementItemAnalyticsMetadata = {
  marketId?: string;
  marketName?: string;
  marketSlug?: string;
  marketSymbol?: string;
};

export type Placement = {
  id: PlacementId;
  version: 2;
  source: PlacementSource;
  type: PlacementType;
  items: PlacementItem[];
  updatedAt?: string;
};
