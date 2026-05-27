import { useEffect, useMemo, useRef } from 'react';

import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { getSurfaceStore } from '@/features/placements/surfaces/stores/surfaceStore';
import { type SurfaceDocument, type SurfaceNode } from '@/features/placements/surfaces/types';
import { filterSurfaceTree, isSurfaceEnabled } from '@/features/placements/surfaces/utils/filterSurface';
import { type PlacementSource } from '@/features/placements/types';
import { getConsistentArray } from '@/helpers/getConsistentArray';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { deepEqual } from '@/worklets/comparisons';

const useDiscoverSurfaceStore = getSurfaceStore('discover');

export type DiscoverSurfacePlacementRefs = Record<PlacementSource, string[]>;

type SurfaceTree = SurfaceDocument | SurfaceNode;

export const useDiscoverSurface = createDerivedStore<SurfaceDocument | undefined>(
  $ => {
    const rawSurface = $(useDiscoverSurfaceStore, state => state.getData());
    const surfaceLastFetchedAt = $(useDiscoverSurfaceStore, state => state.lastFetchedAt);
    const placementsById = $(usePlacementsStore, state => state.placementsById);
    const placementsLastFetchedAt = $(usePlacementsStore, state => state.lastFetchedAt);
    const placementsReady = $(usePlacementsStore, state => state.getStatus('isSuccess'));

    if (!rawSurface) return undefined;

    const enabledSurface = filterSurfaceTree(rawSurface, surface => isSurfaceEnabled(surface.enabled, Date.now()));
    if (!enabledSurface || !placementsReady) return enabledSurface;
    if (isSurfaceWaitingForPlacements(enabledSurface, placementsById, surfaceLastFetchedAt, placementsLastFetchedAt)) return enabledSurface;

    return filterMissingPlacementSurface(enabledSurface, placementsById);
  },
  { equalityFn: deepEqual, fastMode: true }
);

export const useDiscoverSurfacePlacementRefs = createDerivedStore<DiscoverSurfacePlacementRefs>(
  $ => {
    const surface = $(useDiscoverSurface);
    const placementsById = $(usePlacementsStore, state => state.placementsById);

    if (!surface) {
      return {
        hyperliquid: [],
        polymarket: [],
        rainbow: [],
      };
    }

    return getDiscoverSurfacePlacementRefs(surface, placementsById);
  },
  { equalityFn: deepEqual, fastMode: true }
);

export function useIsDiscoverSurfacePlacementPending(placementId: string): boolean {
  const rawSurface = useDiscoverSurfaceStore(state => state.getData());
  const surfaceLastFetchedAt = useDiscoverSurfaceStore(state => state.lastFetchedAt);
  const placementsById = usePlacementsStore(state => state.placementsById);
  const placementsLastFetchedAt = usePlacementsStore(state => state.lastFetchedAt);
  const placementsLoading = usePlacementsStore(state => state.getStatus('isLoading') || state.getStatus('isInitialLoad'));

  if (!rawSurface || placementsById[placementId]) return false;
  if (!surfaceContainsPlacement(rawSurface, placementId)) return false;
  return placementsLoading || isSurfaceNewerThanPlacements(surfaceLastFetchedAt, placementsLastFetchedAt);
}

export function useSyncDiscoverSurfacePlacements(): void {
  const rawSurface = useDiscoverSurfaceStore(state => state.getData());
  const surfaceLastFetchedAt = useDiscoverSurfaceStore(state => state.lastFetchedAt);
  const placementsById = usePlacementsStore(state => state.placementsById);
  const placementsLastFetchedAt = usePlacementsStore(state => state.lastFetchedAt);
  const placementsLoading = usePlacementsStore(state => state.getStatus('isLoading'));
  const lastRequestedKey = useRef<string | null>(null);

  const missingPlacementIds = useMemo(() => {
    if (!rawSurface) return [];
    return getMissingSurfacePlacementIds(rawSurface, placementsById);
  }, [placementsById, rawSurface]);

  useEffect(() => {
    if (!surfaceLastFetchedAt || !missingPlacementIds.length || placementsLoading) return;

    const surfaceFetchedAfterPlacements = !placementsLastFetchedAt || surfaceLastFetchedAt > placementsLastFetchedAt;
    if (!surfaceFetchedAfterPlacements) return;

    const requestKey = `${surfaceLastFetchedAt}:${missingPlacementIds.join(',')}`;
    if (lastRequestedKey.current === requestKey) return;
    lastRequestedKey.current = requestKey;

    usePlacementsStore.getState().fetch(undefined, { force: true });
  }, [missingPlacementIds, placementsLastFetchedAt, placementsLoading, surfaceLastFetchedAt]);
}

function isSurfaceWaitingForPlacements(
  surface: SurfaceDocument,
  placementsById: ReturnType<typeof usePlacementsStore.getState>['placementsById'],
  surfaceLastFetchedAt: number | null,
  placementsLastFetchedAt: number | null
): boolean {
  if (!isSurfaceNewerThanPlacements(surfaceLastFetchedAt, placementsLastFetchedAt)) return false;
  return getMissingSurfacePlacementIds(surface, placementsById).length > 0;
}

function isSurfaceNewerThanPlacements(surfaceLastFetchedAt: number | null, placementsLastFetchedAt: number | null): boolean {
  return !!surfaceLastFetchedAt && (!placementsLastFetchedAt || surfaceLastFetchedAt > placementsLastFetchedAt);
}

function surfaceContainsPlacement(surface: SurfaceTree, placementId: string): boolean {
  if ('items' in surface) return surface.items.some(item => surfaceContainsPlacement(item, placementId));
  return surface.placement === placementId;
}

function getMissingSurfacePlacementIds(
  surface: SurfaceTree,
  placementsById: ReturnType<typeof usePlacementsStore.getState>['placementsById']
): string[] {
  const missingPlacementIds = new Set<string>();
  collectMissingSurfacePlacementIds(surface, placementsById, missingPlacementIds);
  return missingPlacementIds.size ? [...missingPlacementIds].sort() : [];
}

function collectMissingSurfacePlacementIds(
  surface: SurfaceTree,
  placementsById: ReturnType<typeof usePlacementsStore.getState>['placementsById'],
  missingPlacementIds: Set<string>
): void {
  if ('items' in surface) {
    for (const item of surface.items) collectMissingSurfacePlacementIds(item, placementsById, missingPlacementIds);
    return;
  }

  if (surface.placement && !placementsById[surface.placement]) missingPlacementIds.add(surface.placement);
}

function filterMissingPlacementSurface(
  surface: SurfaceDocument,
  placementsById: ReturnType<typeof usePlacementsStore.getState>['placementsById']
): SurfaceDocument | undefined {
  return filterSurfaceTree(surface, item => 'items' in item || !item.placement || placementsById[item.placement] !== undefined);
}

function getDiscoverSurfacePlacementRefs(
  surface: SurfaceDocument,
  placementsById: ReturnType<typeof usePlacementsStore.getState>['placementsById']
): DiscoverSurfacePlacementRefs {
  const refIdsBySource: DiscoverSurfacePlacementRefs = {
    hyperliquid: [],
    polymarket: [],
    rainbow: [],
  };

  collectDiscoverSurfacePlacementRefs(surface, placementsById, refIdsBySource);

  return {
    hyperliquid: getConsistentArray(refIdsBySource.hyperliquid),
    polymarket: getConsistentArray(refIdsBySource.polymarket),
    rainbow: getConsistentArray(refIdsBySource.rainbow),
  };
}

function collectDiscoverSurfacePlacementRefs(
  surface: SurfaceTree,
  placementsById: ReturnType<typeof usePlacementsStore.getState>['placementsById'],
  refIdsBySource: DiscoverSurfacePlacementRefs
): void {
  if ('items' in surface) {
    for (const item of surface.items) collectDiscoverSurfacePlacementRefs(item, placementsById, refIdsBySource);
    return;
  }

  if (!surface.placement) return;

  const placement = placementsById[surface.placement];
  if (!placement) return;

  for (const item of placement.items) {
    refIdsBySource[placement.source].push(item.id);
  }
}
