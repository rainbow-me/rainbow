import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import { PLACEMENT_SURFACES } from '@/features/placements/constants';
import { type Placement, type PlacementId, type PlacementItem, type PlacementItemAnalyticsMetadata } from '@/features/placements/types';

type PlacementScreen = Placement['surfaces'][number] | undefined;

export function getPlacementScreen(placement: Placement | undefined): PlacementScreen {
  if (!placement) return undefined;
  return placement.surfaces.includes(PLACEMENT_SURFACES.DISCOVER) ? PLACEMENT_SURFACES.DISCOVER : placement.surfaces[0];
}

export function trackPlacementCardPress({
  item,
  metadata,
  placementId,
  placementScreen,
  title,
}: {
  item: PlacementItem;
  metadata: PlacementItemAnalyticsMetadata | undefined;
  placementId: PlacementId;
  placementScreen: PlacementScreen;
  title: string;
}): void {
  analytics.track(event.discoverPlacementCardPressed, {
    placementId,
    placementScreen,
    placementTitle: title,
    itemOrder: item.order,
    marketId: metadata?.marketId ?? item.ref.id,
    marketName: metadata?.marketName,
    marketSlug: metadata?.marketSlug,
    marketSymbol: metadata?.marketSymbol,
    marketType: item.ref.source,
  });
}

export function trackPlacementSeeAllPress({
  placementId,
  placementScreen,
  title,
}: {
  placementId: PlacementId;
  placementScreen: PlacementScreen;
  title: string;
}): void {
  analytics.track(event.discoverPlacementSeeAllPressed, {
    placementId,
    placementScreen,
    placementTitle: title,
  });
}

export function trackPlacementInteraction({
  interactionType,
  placement,
}: {
  interactionType: 'carousel_scroll';
  placement: Placement;
}): void {
  analytics.track(event.placementInteraction, {
    id: placement.id,
    interactionType,
    screen: getPlacementScreen(placement),
    version: placement.version,
  });
}

export function defaultPlacementItemKey(item: PlacementItem): string {
  return `${item.ref.source}:${item.ref.id}`;
}
