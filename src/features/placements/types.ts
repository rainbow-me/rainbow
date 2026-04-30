export type PlacementSource = 'hyperliquid' | 'polymarket';

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
  id: string;
  screen: string;
  enabled: boolean;
  order: number;
  items: PlacementItem[];
  version: number;
  updatedAt: string;
};
