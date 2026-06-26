import { type DeriveGetter } from '@storesjs/stores';

import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { useDiscoverSurfacePlacementRefs } from '@/features/placements/surfaces/stores/discoverSurfaceStore';
import { type PlacementSource, type PlacementType } from '@/features/placements/types';

const sourceByType: Record<PlacementType, PlacementSource> = {
  perp: 'hyperliquid',
  prediction: 'polymarket',
  token: 'rainbow',
};

export function hasRefsOrPendingHydration(source: PlacementSource, type: PlacementType): ($: DeriveGetter) => boolean {
  return $ => {
    const hasRefs = sourceByType[type] === source && $(useDiscoverSurfacePlacementRefs, refs => refs[source].length > 0);
    const placementsPending = $(usePlacementsStore, state => state.getStatus('isIdle') || state.getStatus('isInitialLoad'));

    return hasRefs || placementsPending;
  };
}
