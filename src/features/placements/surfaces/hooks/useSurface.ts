import { useEffect, useMemo, useRef } from 'react';

import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { DISPLAY_VALUES } from '@/features/placements/surfaces/constants';
import { getSurfaceStore } from '@/features/placements/surfaces/stores/surfaceStore';
import {
  type SectionId,
  type SurfaceDocument,
  type SurfaceId,
  type SurfaceLeafNode,
  type SurfaceNode,
} from '@/features/placements/surfaces/types';
import { filterSurfaceTree, isSurfaceEnabled, walkSurfaceLeaves } from '@/features/placements/surfaces/utils/filterSurface';
import { type PlacementSource } from '@/features/placements/types';
import { getConsistentArray } from '@/helpers/getConsistentArray';
import { logger } from '@/logger';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { deepEqual } from '@/worklets/comparisons';

const useDiscoverSurfaceStore = getSurfaceStore('discover');

export type DiscoverSurfacePlacementRefs = Record<PlacementSource, string[]>;

export type DiscoverSurface = {
  id: SurfaceId;
  tabs: DiscoverTab[];
};

export type DiscoverTab = {
  id: SectionId;
  label?: string;
  sections: SurfaceLeafNode[];
};

type SurfaceTree = SurfaceDocument | SurfaceNode;

export const useDiscoverSurface = createDerivedStore<DiscoverSurface | undefined>(
  $ => {
    const rawSurface = $(useDiscoverSurfaceStore, state => state.getData());
    const surfaceLastFetchedAt = $(useDiscoverSurfaceStore, state => state.lastFetchedAt);
    const placementsById = $(usePlacementsStore, state => state.placementsById);
    const placementsLastFetchedAt = $(usePlacementsStore, state => state.lastFetchedAt);
    const placementsReady = $(usePlacementsStore, state => state.getStatus('isSuccess'));

    if (!rawSurface) return undefined;

    const enabledSurface = filterSurfaceTree(rawSurface, surface => isSurfaceEnabled(surface.enabled, Date.now()));
    if (!enabledSurface) return undefined;
    if (!placementsReady) return buildDiscoverSurface(enabledSurface);
    if (isSurfaceWaitingForPlacements(enabledSurface, placementsById, surfaceLastFetchedAt, placementsLastFetchedAt)) {
      return buildDiscoverSurface(enabledSurface);
    }

    const surfaceWithPlacements = filterMissingPlacementSurface(enabledSurface, placementsById);
    return surfaceWithPlacements ? buildDiscoverSurface(surfaceWithPlacements) : undefined;
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
  let containsPlacement = false;

  walkSurfaceLeaves(surface, leaf => {
    if (leaf.placement === placementId) containsPlacement = true;
  });

  return containsPlacement;
}

function getMissingSurfacePlacementIds(
  surface: SurfaceTree,
  placementsById: ReturnType<typeof usePlacementsStore.getState>['placementsById']
): string[] {
  const missingPlacementIds = new Set<string>();

  walkSurfaceLeaves(surface, leaf => {
    if (leaf.placement && !placementsById[leaf.placement]) missingPlacementIds.add(leaf.placement);
  });

  return missingPlacementIds.size ? [...missingPlacementIds].sort() : [];
}

function filterMissingPlacementSurface(
  surface: SurfaceDocument,
  placementsById: ReturnType<typeof usePlacementsStore.getState>['placementsById']
): SurfaceDocument | undefined {
  return filterSurfaceTree(surface, item => 'items' in item || !item.placement || placementsById[item.placement] !== undefined);
}

function getDiscoverSurfacePlacementRefs(
  surface: DiscoverSurface,
  placementsById: ReturnType<typeof usePlacementsStore.getState>['placementsById']
): DiscoverSurfacePlacementRefs {
  const refIdsBySource: DiscoverSurfacePlacementRefs = {
    hyperliquid: [],
    polymarket: [],
    rainbow: [],
  };

  for (const tab of surface.tabs) {
    for (const section of tab.sections) {
      collectDiscoverSurfacePlacementRefs(section, placementsById, refIdsBySource);
    }
  }

  return {
    hyperliquid: getConsistentArray(refIdsBySource.hyperliquid),
    polymarket: getConsistentArray(refIdsBySource.polymarket),
    rainbow: getConsistentArray(refIdsBySource.rainbow),
  };
}

function collectDiscoverSurfacePlacementRefs(
  surface: SurfaceLeafNode,
  placementsById: ReturnType<typeof usePlacementsStore.getState>['placementsById'],
  refIdsBySource: DiscoverSurfacePlacementRefs
): void {
  if (!surface.placement) return;

  const placement = placementsById[surface.placement];
  if (!placement) return;

  for (const item of placement.items) {
    refIdsBySource[placement.source].push(item.id);
  }
}

function buildDiscoverSurface(surface: SurfaceDocument): DiscoverSurface | undefined {
  const tabs: DiscoverTab[] = [];

  for (const item of surface.items) {
    if (!('items' in item)) {
      warnInvalidDiscoverSurface(surface.id, item.id, 'top-level-leaf');
      continue;
    }

    const sections: SurfaceLeafNode[] = [];

    for (const section of item.items) {
      if ('items' in section) {
        warnInvalidDiscoverSurface(surface.id, section.id, 'nested-container');
        continue;
      }

      if (!(DISPLAY_VALUES as readonly string[]).includes(section.display)) {
        warnInvalidDiscoverSurface(surface.id, section.id, 'unsupported-display');
        continue;
      }

      sections.push(section);
    }

    if (!sections.length) {
      warnInvalidDiscoverSurface(surface.id, item.id, 'empty-tab');
      continue;
    }

    tabs.push({
      id: item.id,
      label: item.label,
      sections,
    });
  }

  if (!tabs.length) {
    warnInvalidDiscoverSurface(surface.id, surface.id, 'empty-surface');
    return undefined;
  }

  return {
    id: surface.id,
    tabs,
  };
}

function warnInvalidDiscoverSurface(surfaceId: string, nodeId: string, reason: string): void {
  logger.warn('[useDiscoverSurface]: invalid Discover surface shape', {
    nodeId,
    reason,
    surfaceId,
  });
}
