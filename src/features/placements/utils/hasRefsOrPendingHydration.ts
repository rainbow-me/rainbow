import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { useDiscoverSurfacePlacementRefs } from '@/features/placements/surfaces/stores/discoverSurfaceStore';
import { type PlacementSource } from '@/features/placements/types';
import { type DeriveGetter } from '@/state/internal/createDerivedStore';

export function hasRefsOrPendingHydration(source: PlacementSource): ($: DeriveGetter) => boolean {
  return $ => {
    const hasRefs = $(useDiscoverSurfacePlacementRefs, refs => refs[source].length > 0);
    const placementsPending = $(usePlacementsStore, state => state.getStatus('isIdle') || state.getStatus('isInitialLoad'));

    return hasRefs || placementsPending;
  };
}
