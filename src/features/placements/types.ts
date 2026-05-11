import { type PLACEMENT_IDS, type PLACEMENT_SCREENS } from '@/features/placements/constants';

export type PlacementId = (typeof PLACEMENT_IDS)[keyof typeof PLACEMENT_IDS];

export type PlacementScreen = (typeof PLACEMENT_SCREENS)[keyof typeof PLACEMENT_SCREENS];

export type PlacementSource = 'hyperliquid' | 'polymarket';
export type PlacementProvider = PlacementSource;

export type PlacementItemRef = {
  source: PlacementSource;
  id: string;
};

export type PlacementItem = {
  ref: PlacementItemRef;
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
