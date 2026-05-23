import { type Surface } from '@/features/placements/surfaces/types';
import { isEnabled } from '@/features/placements/surfaces/utils/isEnabled';

export function filterEnabledSurface(surface: Surface, now: number): Surface | undefined {
  if (!isEnabled(surface.enabled, now)) return undefined;

  if (surface.items !== undefined) {
    const filteredItems: Surface[] = [];
    let didChange = false;

    for (const item of surface.items) {
      const filteredItem = filterEnabledSurface(item, now);
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

  return surface;
}
