import { type Enabled, type SurfaceDocument, type SurfaceLeafNode, type SurfaceNode } from '@/features/placements/surfaces/types';

type FilterableSurface = SurfaceDocument | SurfaceNode;

export function filterSurfaceTree(
  surface: SurfaceDocument,
  predicate: (surface: FilterableSurface) => boolean
): SurfaceDocument | undefined;
export function filterSurfaceTree(surface: SurfaceNode, predicate: (surface: FilterableSurface) => boolean): SurfaceNode | undefined;
export function filterSurfaceTree(
  surface: FilterableSurface,
  predicate: (surface: FilterableSurface) => boolean
): FilterableSurface | undefined {
  if (!predicate(surface)) return undefined;

  if (!('items' in surface)) return surface;

  const filteredItems: SurfaceNode[] = [];
  let didChange = false;

  for (const item of surface.items) {
    const filteredItem = filterSurfaceTree(item, predicate);
    if (!filteredItem) {
      didChange = true;
      continue;
    }
    if (filteredItem !== item) didChange = true;
    filteredItems.push(filteredItem);
  }

  if (!filteredItems.length) return undefined;
  return didChange ? { ...surface, items: filteredItems } : surface;
}

export function walkSurfaceLeaves(surface: FilterableSurface, visit: (surface: SurfaceLeafNode) => void): void {
  if (!('items' in surface)) {
    visit(surface);
    return;
  }

  for (const item of surface.items) {
    walkSurfaceLeaves(item, visit);
  }
}

export function isSurfaceEnabled(enabled: Enabled | undefined, now: number): boolean {
  if (enabled === undefined || enabled === true) return true;
  if (enabled === false) return false;

  const startsAt = enabled.startsAt ? Date.parse(enabled.startsAt) : undefined;
  const endsAt = enabled.endsAt ? Date.parse(enabled.endsAt) : undefined;

  if (startsAt !== undefined && (!Number.isFinite(startsAt) || now < startsAt)) return false;
  if (endsAt !== undefined && (!Number.isFinite(endsAt) || now >= endsAt)) return false;

  return true;
}
