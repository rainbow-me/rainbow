import { usePlacementsStore, type PlacementsState } from '@/features/placements/stores/placementsStore';
import { type Placement, type PlacementId, type PlacementItem, type PlacementSource } from '@/features/placements/types';
import { createDerivedStore, type DeriveGetter } from '@/state/internal/createDerivedStore';
import { type DerivedStore } from '@/state/internal/types';
import { shallowEqual } from '@/worklets/comparisons';

// ============ Types ========================================================== //

type PlacementStoreResult<Hydrated> = {
  isLoading: boolean;
  items: Hydrated[];
  placement: Placement | undefined;
};

type PlacementResolverResult<Hydrated> = {
  isLoading: boolean;
  items: Hydrated[];
};

type PlacementStoreConfig<Source extends PlacementSource, Hydrated> = {
  placementId: PlacementId;
  source: Source;
  enabled: DerivedStore<boolean>;
  select: ($: DeriveGetter, items: PlacementItem[]) => PlacementResolverResult<Hydrated>;
};

// ============ Store Factory ================================================== //

export function createPlacementStore<Source extends PlacementSource, Hydrated>(
  config: PlacementStoreConfig<Source, Hydrated>
): DerivedStore<PlacementStoreResult<Hydrated>> {
  const emptyState: PlacementStoreResult<Hydrated> = {
    isLoading: false,
    items: [],
    placement: undefined,
  };

  return createDerivedStore<PlacementStoreResult<Hydrated>>(
    $ => {
      const enabled = $(config.enabled);
      const placement = $(usePlacementsStore, state => state.getPlacement(config.placementId));
      const placementItems = $(usePlacementsStore, state => selectPlacementItems(state, config.placementId, config.source), shallowEqual);
      const placementsLoading = $(usePlacementsStore, state => {
        const isInitialLoad = state.getStatus('isInitialLoad');
        const isIdleWithoutCachedPlacement =
          state.getStatus('isIdle') &&
          state.getPlacement(config.placementId) === undefined &&
          !selectPlacementItems(state, config.placementId, config.source).length;
        return isInitialLoad || isIdleWithoutCachedPlacement;
      });
      // Keep resolver dependencies subscribed in fastMode, even while the placement is disabled.
      const resolved = config.select($, placementItems);

      if (!enabled) return emptyState;

      const items = resolved.items;
      const isLoading = placementsLoading || (resolved.isLoading && placement !== undefined && items.length === 0);
      return {
        isLoading,
        items,
        placement: items.length ? placement : undefined,
      };
    },
    { equalityFn: isPlacementStoreResultEqual, fastMode: true }
  );
}

// ============ Selectors ====================================================== //

function selectPlacementItems<Source extends PlacementSource>(
  state: PlacementsState,
  placementId: PlacementId,
  source: Source
): PlacementItem[] {
  return state.getItemsBySource(placementId, source);
}

// ============ Comparisons ==================================================== //

function isPlacementStoreResultEqual<Hydrated>(current: PlacementStoreResult<Hydrated>, next: PlacementStoreResult<Hydrated>): boolean {
  if (current === next) return true;

  if (current.isLoading !== next.isLoading || current.placement !== next.placement || current.items.length !== next.items.length) {
    return false;
  }

  for (let i = 0; i < current.items.length; i++) {
    if (!shallowEqual(current.items[i], next.items[i])) return false;
  }

  return true;
}
