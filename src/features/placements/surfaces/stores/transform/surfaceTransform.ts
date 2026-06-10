import { DISPLAYS } from '@/features/placements/surfaces/constants';
import {
  type SectionId,
  type SurfaceDocument,
  type SurfaceId,
  type SurfaceLeafNode,
  type SurfaceSectionNode,
} from '@/features/placements/surfaces/types';
import { isSurfacePlacementCompatible } from '@/features/placements/surfaces/utils/surfaceDisplay';
import { type Placement, type PlacementId, type PlacementSource } from '@/features/placements/types';
import { isScheduleWindowEnabled } from '@/features/placements/utils/scheduling';
import { getConsistentArray } from '@/helpers/getConsistentArray';

export type SurfacePlacementRefs = Record<PlacementSource, string[]>;

export type ResolvedSurface = {
  id: SurfaceId;
  sections: ResolvedSurfaceSection[];
};

export type ResolvedSurfaceSection = {
  id: SectionId;
  label: string;
  items: SurfaceLeafNode[];
};

type PlacementsById = Partial<Record<PlacementId, Placement>>;
type FilterableSurfaceNode = SurfaceDocument | SurfaceSectionNode | SurfaceLeafNode;

export function filterIncompatiblePlacementSurface(surface: SurfaceDocument, placementsById: PlacementsById): SurfaceDocument | undefined {
  return filterSurface(surface, item => {
    if ('items' in item || !item.placement) return true;

    const placement = placementsById[item.placement];
    if (!placement) return true;

    return isSurfacePlacementCompatible(item.display, placement.source);
  });
}

export function filterSurface(
  surface: SurfaceDocument,
  predicate: (surface: FilterableSurfaceNode) => boolean
): SurfaceDocument | undefined {
  if (!predicate(surface)) return undefined;

  const items: SurfaceDocument['items'] = [];
  let didChange = false;

  for (const item of surface.items) {
    if (!predicate(item)) {
      didChange = true;
      continue;
    }

    const sections = item.items.filter(section => predicate(section));
    if (!sections.length) {
      didChange = true;
      continue;
    }
    const didFilterSections = sections.length !== item.items.length;
    if (didFilterSections) didChange = true;

    items.push(didFilterSections ? { ...item, items: sections } : item);
  }

  if (!items.length) return undefined;
  return didChange ? { ...surface, items } : surface;
}

export function getSurfacePlacementRefs(surface: ResolvedSurface, placementsById: PlacementsById, now: number): SurfacePlacementRefs {
  const refIdsBySource: SurfacePlacementRefs = {
    hyperliquid: [],
    polymarket: [],
    rainbow: [],
  };

  for (const section of surface.sections) {
    for (const item of section.items) {
      collectSurfacePlacementRefs(item, placementsById, refIdsBySource, now);
    }
  }

  return {
    hyperliquid: getConsistentArray(refIdsBySource.hyperliquid),
    polymarket: getConsistentArray(refIdsBySource.polymarket),
    rainbow: getConsistentArray(refIdsBySource.rainbow),
  };
}

function collectSurfacePlacementRefs(
  section: SurfaceLeafNode,
  placementsById: PlacementsById,
  refIdsBySource: SurfacePlacementRefs,
  now: number
): void {
  if (!section.placement) return;

  const placement = placementsById[section.placement];
  if (!placement) return;

  const enabledItems = placement.items.filter(item => isScheduleWindowEnabled(item, now));
  const items = section.limit !== undefined && !isListDisplay(section.display) ? enabledItems.slice(0, section.limit) : enabledItems;

  for (const item of items) {
    refIdsBySource[placement.source].push(item.id);
  }
}

function isListDisplay(display: SurfaceLeafNode['display']): boolean {
  return display === DISPLAYS.MARKET_CELL_LIST || display === DISPLAYS.PREDICTION_EVENT_CARD_LIST;
}

export function buildSurface(surface: SurfaceDocument): ResolvedSurface {
  return {
    id: surface.id,
    sections: surface.items.map(item => ({
      id: item.id,
      label: item.label,
      items: item.items,
    })),
  };
}
