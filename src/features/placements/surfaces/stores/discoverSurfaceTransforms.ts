import { type usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { DISPLAY_VALUES } from '@/features/placements/surfaces/constants';
import { type DiscoverSurface, type DiscoverTab } from '@/features/placements/surfaces/stores/discoverSurfaceTypes';
import { type SurfaceDocument, type SurfaceLeafNode } from '@/features/placements/surfaces/types';
import { logger } from '@/logger';

type PlacementsById = ReturnType<typeof usePlacementsStore.getState>['placementsById'];

export function removeDiscoverSportsTab(surface: SurfaceDocument | null | undefined): SurfaceDocument | undefined {
  if (!surface) return undefined;
  const items = surface.items.filter(item => item.id !== 'sports');
  if (!items.length) return undefined;
  return items.length === surface.items.length ? surface : { ...surface, items };
}

export function isSurfaceNewerThanPlacements(surfaceLastFetchedAt: number | null, placementsLastFetchedAt: number | null): boolean {
  return !!surfaceLastFetchedAt && (!placementsLastFetchedAt || surfaceLastFetchedAt > placementsLastFetchedAt);
}

export function getMissingSurfacePlacementIds(surface: DiscoverSurface, placementsById: PlacementsById): string[] {
  const missingPlacementIds = new Set<string>();

  for (const tab of surface.tabs) {
    for (const section of tab.sections) {
      if (section.placement && !placementsById[section.placement]) missingPlacementIds.add(section.placement);
    }
  }

  return [...missingPlacementIds].sort();
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
