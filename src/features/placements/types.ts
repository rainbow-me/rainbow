import { type PLACEMENT_IDS, type PLACEMENT_SCREENS, type PLACEMENT_SOURCES, type PLACEMENT_TYPES } from '@/features/placements/constants';

// ============ v1 (legacy DiscoverHome carousels) ============================ //

export type PlacementId = (typeof PLACEMENT_IDS)[keyof typeof PLACEMENT_IDS];

export type PlacementScreen = (typeof PLACEMENT_SCREENS)[keyof typeof PLACEMENT_SCREENS];

export type PlacementSource = 'hyperliquid' | 'polymarket';

export type PlacementItemRef<Source extends PlacementSource = PlacementSource> = {
  source: Source;
  id: string;
};

export type PlacementItem<Source extends PlacementSource = PlacementSource> = {
  ref: PlacementItemRef<Source>;
  order: number;
  metadata?: Record<string, unknown>;
};

export type PlacementItemAnalyticsMetadata = {
  marketId?: string;
  marketName?: string;
  marketSlug?: string;
  marketSymbol?: string;
};

export type Placement = {
  id: PlacementId;
  screen: PlacementScreen;
  enabled: boolean;
  order: number;
  items: PlacementItem[];
  version: number;
  updatedAt: string;
};

// ============ v2 (placement document contract) ============================== //

export type PlacementIdV2 = string;

export type PlacementSourceV2 = (typeof PLACEMENT_SOURCES)[keyof typeof PLACEMENT_SOURCES];

export type PlacementTypeV2 = (typeof PLACEMENT_TYPES)[keyof typeof PLACEMENT_TYPES];

export type PlacementItemV2 = {
  id: string;
};

export type PlacementV2 = {
  id: PlacementIdV2;
  version: 2;
  source: PlacementSourceV2;
  type: PlacementTypeV2;
  items: PlacementItemV2[];
  updatedAt?: string;
};
