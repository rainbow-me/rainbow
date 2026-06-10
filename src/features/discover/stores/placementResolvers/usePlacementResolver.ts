import { useMemo } from 'react';

import {
  isDiscoverPlacementHydrating,
  selectDiscoverPlacementBySource,
  useDiscoverPlacementsStore,
  type DiscoverPlacementResult,
} from '@/features/discover/stores/discoverPlacementsStore';
import { type PlacementId, type PlacementItem, type PlacementSource } from '@/features/placements/types';
import { isScheduleWindowEnabled } from '@/features/placements/utils/scheduling';

type ResolvedPlacementData<Data> = {
  data: Data | undefined;
  isError?: boolean;
  isLoading: boolean;
};

type PlacementResolverLoadingInput<Data, Hydrated> = {
  items: Hydrated[];
  placementItems: PlacementItem[];
  resolvedData: Data | undefined;
  resolvedError: boolean;
  resolvedLoading: boolean;
};

type PlacementResolverConfig<Source extends PlacementSource, Data, Hydrated> = {
  deriveLoading?: (input: PlacementResolverLoadingInput<Data, Hydrated>) => boolean;
  enabled: boolean;
  pairItem: (item: PlacementItem, data: Data) => Hydrated | undefined;
  source: Source;
  useResolvedData: (placementItems: PlacementItem[]) => ResolvedPlacementData<Data>;
};

const EMPTY_PLACEMENT_ITEMS: PlacementItem[] = [];

export function usePlacementResolver<Source extends PlacementSource, Data, Hydrated>(
  placementId: PlacementId,
  config: PlacementResolverConfig<Source, Data, Hydrated>
): DiscoverPlacementResult<Hydrated> {
  const { deriveLoading = deriveDefaultResolvedLoading, enabled, pairItem, source, useResolvedData } = config;

  const placement = useDiscoverPlacementsStore(state => selectDiscoverPlacementBySource(state, placementId, source));
  const placementItems = useMemo(() => filterPlacementItems(placement?.items ?? EMPTY_PLACEMENT_ITEMS, Date.now()), [placement?.items]);
  const placementsLoading = useDiscoverPlacementsStore(state => isDiscoverPlacementHydrating(state, placementId, source));
  const resolved = useResolvedData(placementItems);
  const items = useMemo(() => buildResolvedItems(placementItems, resolved.data, pairItem), [pairItem, placementItems, resolved.data]);
  const resolvedLoading = deriveLoading({
    items,
    placementItems,
    resolvedData: resolved.data,
    resolvedError: resolved.isError === true,
    resolvedLoading: resolved.isLoading,
  });

  return useMemo(
    () => ({
      isLoading: enabled && placementItems.length > 0 && items.length === 0 && (placementsLoading || resolvedLoading),
      items: enabled ? items : [],
      placement: enabled && items.length ? placement : undefined,
    }),
    [enabled, items, placement, placementItems.length, placementsLoading, resolvedLoading]
  );
}

function filterPlacementItems(placementItems: PlacementItem[], now: number): PlacementItem[] {
  const items = placementItems.filter(item => isScheduleWindowEnabled(item, now));
  return items.length === placementItems.length ? placementItems : items;
}

function buildResolvedItems<Data, Hydrated>(
  placementItems: PlacementItem[],
  resolvedData: Data | undefined,
  pairItem: (item: PlacementItem, data: Data) => Hydrated | undefined
): Hydrated[] {
  if (!resolvedData) return [];

  const items: Hydrated[] = [];

  for (const item of placementItems) {
    const resolved = pairItem(item, resolvedData);
    if (resolved !== undefined) items.push(resolved);
  }

  return items;
}

function deriveDefaultResolvedLoading<Data, Hydrated>({
  items,
  placementItems,
  resolvedError,
  resolvedLoading,
}: PlacementResolverLoadingInput<Data, Hydrated>): boolean {
  return placementItems.length > 0 && items.length === 0 && resolvedLoading && !resolvedError;
}
