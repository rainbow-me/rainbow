import { type PLACEMENT_SCREENS } from '@/features/placements/constants';

export type PlacementScreen = (typeof PLACEMENT_SCREENS)[keyof typeof PLACEMENT_SCREENS];

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

export type Placement = {
  id: string;
  screen: PlacementScreen;
  enabled: boolean;
  order: number;
  items: PlacementItem[];
  version: number;
  updatedAt: string;
};
