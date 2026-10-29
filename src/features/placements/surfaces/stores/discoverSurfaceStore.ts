import { createDerivedStore, type DerivedStore } from '@storesjs/stores';

import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import {
  buildDiscoverSurface,
  isSurfaceNewerThanPlacements,
  removeDiscoverSportsTab,
} from '@/features/placements/surfaces/stores/discoverSurfaceTransforms';
import { type DiscoverSurface } from '@/features/placements/surfaces/stores/discoverSurfaceTypes';
import { getSurfaceStore } from '@/features/placements/surfaces/stores/surfaceStore';
import { filterSurfaceTree, isSurfaceEnabled } from '@/features/placements/surfaces/utils/filterSurface';
import { type PlacementSource } from '@/features/placements/types';
import { areArraysEqual } from '@/framework/core/utils/areArraysEqual';
import { getConsistentArray } from '@/helpers/getConsistentArray';
import { deepEqual } from '@/worklets/comparisons';

export const useDiscoverSurfaceStore = getSurfaceStore('discover');

export const useDiscoverSurface = createDerivedStore<DiscoverSurface | undefined>(
  $ => {
    const surface = $(useDiscoverSurfaceStore, s => s.getData());
    const surfaceLastFetchedAt = $(useDiscoverSurfaceStore, s => s.lastFetchedAt);
    const placementsById = $(usePlacementsStore, s => s.placementsById);
    const placementsLastFetchedAt = $(usePlacementsStore, s => s.lastFetchedAt);
    const placementsReady = $(usePlacementsStore, s => s.getStatus('isSuccess'));
    const discoverSurface = removeDiscoverSportsTab(surface);
    if (!discoverSurface) return undefined;

    const canRemoveMissingPlacements = placementsReady && !isSurfaceNewerThanPlacements(surfaceLastFetchedAt, placementsLastFetchedAt);
    const now = Date.now();
    const filteredSurface = filterSurfaceTree(
      discoverSurface,
      item =>
        isSurfaceEnabled(item.enabled, now) &&
        (!canRemoveMissingPlacements || 'items' in item || !item.placement || placementsById[item.placement] !== undefined)
    );

    return filteredSurface ? buildDiscoverSurface(filteredSurface) : undefined;
  },
  { equalityFn: deepEqual, lockDependencies: true }
);

/** Derives the item references needed by one Discover data source. */
export function createDiscoverPlacementRefsStore(source: PlacementSource): DerivedStore<readonly string[]> {
  return createDerivedStore<readonly string[]>(
    $ => {
      const tabs = $(useDiscoverSurface, s => s?.tabs);
      const placementsById = $(usePlacementsStore, s => s.placementsById);
      const refs: string[] = [];

      for (const tab of tabs ?? []) {
        for (const section of tab.sections) {
          if (!section.placement) continue;
          const placement = placementsById[section.placement];
          if (placement?.source !== source) continue;

          for (const item of placement.items) refs.push(item.id);
        }
      }

      return getConsistentArray(refs);
    },
    { equalityFn: areArraysEqual, lockDependencies: true }
  );
}
