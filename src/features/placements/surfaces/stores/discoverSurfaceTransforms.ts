import { type usePlacementsV2Store } from '@/features/placements/stores/placementsStore';
import { DISPLAY_VALUES } from '@/features/placements/surfaces/constants';
import {
  type DiscoverSurface,
  type DiscoverSurfacePlacementRefs,
  type DiscoverTab,
  type SurfaceTree,
} from '@/features/placements/surfaces/stores/discoverSurfaceTypes';
import { type SurfaceDocument, type SurfaceLeafNode } from '@/features/placements/surfaces/types';
import { filterSurfaceTree, walkSurfaceLeaves } from '@/features/placements/surfaces/utils/filterSurface';
import { getConsistentArray } from '@/helpers/getConsistentArray';
import { logger } from '@/logger';

type PlacementsById = ReturnType<typeof usePlacementsV2Store.getState>['placementsById'];

export function isSurfaceWaitingForPlacements(
  surface: SurfaceDocument,
  placementsById: PlacementsById,
  surfaceLastFetchedAt: number | null,
  placementsLastFetchedAt: number | null
): boolean {
  if (!isSurfaceNewerThanPlacements(surfaceLastFetchedAt, placementsLastFetchedAt)) return false;
  return getMissingSurfacePlacementIds(surface, placementsById).length > 0;
}

export function isSurfaceNewerThanPlacements(surfaceLastFetchedAt: number | null, placementsLastFetchedAt: number | null): boolean {
  return !!surfaceLastFetchedAt && (!placementsLastFetchedAt || surfaceLastFetchedAt > placementsLastFetchedAt);
}

export function surfaceContainsPlacement(surface: SurfaceTree, placementId: string): boolean {
  let containsPlacement = false;

  walkSurfaceLeaves(surface, leaf => {
    if (leaf.placement === placementId) containsPlacement = true;
  });

  return containsPlacement;
}

export function getMissingSurfacePlacementIds(surface: SurfaceTree, placementsById: PlacementsById): string[] {
  const missingPlacementIds = new Set<string>();

  walkSurfaceLeaves(surface, leaf => {
    if (leaf.placement && !placementsById[leaf.placement]) missingPlacementIds.add(leaf.placement);
  });

  return missingPlacementIds.size ? [...missingPlacementIds].sort() : [];
}

export function filterMissingPlacementSurface(surface: SurfaceDocument, placementsById: PlacementsById): SurfaceDocument | undefined {
  return filterSurfaceTree(surface, item => 'items' in item || !item.placement || placementsById[item.placement] !== undefined);
}

export function getDiscoverSurfacePlacementRefs(surface: DiscoverSurface, placementsById: PlacementsById): DiscoverSurfacePlacementRefs {
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
  placementsById: PlacementsById,
  refIdsBySource: DiscoverSurfacePlacementRefs
): void {
  if (!surface.placement) return;

  const placement = placementsById[surface.placement];
  if (!placement) return;

  for (const item of placement.items) {
    refIdsBySource[placement.source].push(item.id);
  }
}

export function buildDiscoverSurface(surface: SurfaceDocument): DiscoverSurface | undefined {
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

export function warnInvalidDiscoverSurface(surfaceId: string, nodeId: string, reason: string): void {
  logger.warn('[useDiscoverSurface]: invalid Discover surface shape', {
    nodeId,
    reason,
    surfaceId,
  });
}
