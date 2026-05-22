import { type PlacementsById } from '@/features/placements/stores/placementsStore';
import { SOURCE_BY_DISPLAY } from '@/features/placements/surfaces/constants';
import { type Surface } from '@/features/placements/surfaces/types';
import { isEnabled } from '@/features/placements/surfaces/utils/isEnabled';

export function filterSurface(surface: Surface, placementsById: PlacementsById, now: number): Surface | undefined {
  if (!isEnabled(surface.enabled, now)) return undefined;

  if (surface.items !== undefined) {
    const filteredItems: Surface[] = [];
    let didChange = false;

    for (const item of surface.items) {
      const filteredItem = filterSurface(item, placementsById, now);
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

  const placement = placementsById[surface.placement];
  if (!placement) return undefined;
  if (placement.source !== SOURCE_BY_DISPLAY[surface.display]) return undefined;
  if (!placement.items.length) return undefined;

  return surface;
}
