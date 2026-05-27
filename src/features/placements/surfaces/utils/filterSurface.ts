import { type Enabled, type Surface } from '@/features/placements/surfaces/types';

export function filterSurfaceTree(surface: Surface, predicate: (surface: Surface) => boolean): Surface | undefined {
  if (!predicate(surface)) return undefined;

  if (surface.items === undefined) return surface;

  const filteredItems: Surface[] = [];
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

export function isSurfaceEnabled(enabled: Enabled | undefined, now: number): boolean {
  if (enabled === undefined || enabled === true) return true;
  if (enabled === false) return false;

  const startsAt = enabled.startsAt ? Date.parse(enabled.startsAt) : undefined;
  const endsAt = enabled.endsAt ? Date.parse(enabled.endsAt) : undefined;

  if (startsAt !== undefined && (!Number.isFinite(startsAt) || now < startsAt)) return false;
  if (endsAt !== undefined && (!Number.isFinite(endsAt) || now >= endsAt)) return false;

  return true;
}
