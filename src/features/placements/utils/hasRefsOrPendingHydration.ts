import { usePlacementsV2Store } from '@/features/placements/stores/placementsStore';
import { useDiscoverSurfacePlacementRefs } from '@/features/placements/surfaces/stores/discoverSurfaceStore';
import { type PlacementSourceV2, type PlacementTypeV2 } from '@/features/placements/types';
import { type DeriveGetter } from '@/state/internal/createDerivedStore';

const sourceByType: Record<PlacementTypeV2, PlacementSourceV2> = {
  perp: 'hyperliquid',
  prediction: 'polymarket',
  token: 'rainbow',
};

export function hasRefsOrPendingHydration(source: PlacementSourceV2, type: PlacementTypeV2): ($: DeriveGetter) => boolean {
  return $ => {
    const hasRefs = sourceByType[type] === source && $(useDiscoverSurfacePlacementRefs, refs => refs[source].length > 0);
    const placementsPending = $(usePlacementsV2Store, state => state.getStatus('isIdle') || state.getStatus('isInitialLoad'));

    return hasRefs || placementsPending;
  };
}
