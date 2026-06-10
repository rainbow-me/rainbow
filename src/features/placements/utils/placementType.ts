import { PLACEMENT_SOURCES, PLACEMENT_TYPES } from '@/features/placements/constants';
import { type PlacementSource } from '@/features/placements/types';

export type PlacementType = (typeof PLACEMENT_TYPES)[keyof typeof PLACEMENT_TYPES];

export function placementType(source: PlacementSource): PlacementType {
  switch (source) {
    case PLACEMENT_SOURCES.HYPERLIQUID:
      return PLACEMENT_TYPES.PERP;
    case PLACEMENT_SOURCES.POLYMARKET:
      return PLACEMENT_TYPES.PREDICTION;
    case PLACEMENT_SOURCES.RAINBOW:
      return PLACEMENT_TYPES.TOKEN;
  }
}
