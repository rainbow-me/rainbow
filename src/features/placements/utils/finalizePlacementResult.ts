import { type PlacementResult } from '@/features/placements/stores/placementsStore';
import { type Placement, type PlacementItem } from '@/features/placements/types';

/**
 * Pairs configured placement items with their resolved values, preserving the
 * placement order and dropping any items whose ref did not resolve.
 */
export function pairPlacementItems<Resolved, Hydrated>(
  placementItems: PlacementItem[],
  resolvedById: (id: string) => Resolved | undefined,
  toItem: (item: PlacementItem, resolved: Resolved) => Hydrated
): Hydrated[] {
  const items: Hydrated[] = [];

  for (const item of placementItems) {
    const resolved = resolvedById(item.id);
    if (resolved !== undefined) items.push(toItem(item, resolved));
  }

  return items;
}

/**
 * Normalizes a per-source hydration result. `isLoading` is true only while the
 * placement is enabled, has configured refs, and the underlying resolver is in
 * its initial load. A placement is only surfaced once it has resolved items.
 */
export function finalizePlacementResult<Hydrated>({
  enabled,
  hasRefs,
  isInitialLoad,
  items,
  placement,
}: {
  enabled: boolean;
  hasRefs: boolean;
  isInitialLoad: boolean;
  items: Hydrated[];
  placement: Placement | undefined;
}): PlacementResult<Hydrated> {
  if (!enabled) return { isLoading: false, items: [], placement: undefined };

  return {
    isLoading: hasRefs && isInitialLoad && items.length === 0,
    items,
    placement: items.length ? placement : undefined,
  };
}
