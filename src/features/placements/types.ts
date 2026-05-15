import { type PLACEMENT_IDS, type PLACEMENT_SURFACES } from '@/features/placements/constants';

export type PlacementId = (typeof PLACEMENT_IDS)[keyof typeof PLACEMENT_IDS];

export type PlacementSurface = (typeof PLACEMENT_SURFACES)[keyof typeof PLACEMENT_SURFACES];

export type PlacementSource = 'hyperliquid' | 'polymarket' | 'rainbow';

export type PlacementType = 'perp' | 'prediction' | 'token';

export type PlacementTypeForSource<Source extends PlacementSource> = Source extends 'hyperliquid'
  ? 'perp'
  : Source extends 'polymarket'
    ? 'prediction'
    : Source extends 'rainbow'
      ? 'token'
      : never;

type PlacementItemRefBySource = {
  [Source in PlacementSource]: {
    source: Source;
    type: PlacementTypeForSource<Source>;
    category?: string;
    id: string;
  };
};

export type PlacementItemRef<Source extends PlacementSource = PlacementSource> = PlacementItemRefBySource[Source];

export type PlacementItemBySource = {
  [Source in PlacementSource]: {
    order: number;
    startsAt?: string;
    endsAt?: string;
    ref: PlacementItemRef<Source>;
  };
};

export type PlacementItem<Source extends PlacementSource = PlacementSource> = PlacementItemBySource[Source];

export type PlacementCategory = {
  order: number;
  category: string;
  enabled: boolean;
};

export type PlacementItemAnalyticsMetadata = {
  marketId?: string;
  marketName?: string;
  marketSlug?: string;
  marketSymbol?: string;
};

export type Placement = {
  id: PlacementId;
  surfaces: PlacementSurface[];
  enabled: boolean;
  version: 2;
  items: PlacementItem[];
  categories?: PlacementCategory[];
  effectiveFrom?: string;
  effectiveUntil?: string;
  updatedAt: string;
};
