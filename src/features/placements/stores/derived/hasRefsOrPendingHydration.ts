import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { useDiscoverSurfacePlacementRefs } from '@/features/placements/surfaces/hooks/useSurface';
import { type PlacementSource, type PlacementType } from '@/features/placements/types';
import { type DeriveGetter } from '@/state/internal/createDerivedStore';

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
