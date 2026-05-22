import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import { type Destination } from '@/features/placements/surfaces/types';
import { type Placement, type PlacementId, type PlacementItem, type PlacementItemAnalyticsMetadata } from '@/features/placements/types';

export function trackPlacementCardPress({
  item,
  itemIndex,
  metadata,
  placement,
  placementId,
  surfaceId,
  title,
}: {
  item: PlacementItem;
  itemIndex: number;
  metadata: PlacementItemAnalyticsMetadata | undefined;
  placement: Placement | undefined;
  placementId: PlacementId;
  surfaceId: string;
  title: string;
}): void {
  analytics.track(event.discoverPlacementCardPressed, {
    placementId,
    surfaceId,
    placementTitle: title,
    itemOrder: itemIndex,
    itemId: item.id,
    marketId: metadata?.marketId ?? item.id,
    marketName: metadata?.marketName,
    marketSlug: metadata?.marketSlug,
    marketSymbol: metadata?.marketSymbol,
    marketType: placement?.source,
  });
}

export function trackPlacementSeeAllPress({
  destination,
  placementId,
  surfaceId,
  title,
}: {
  destination: Destination;
  placementId: PlacementId;
  surfaceId: string;
  title: string;
}): void {
  analytics.track(event.discoverPlacementSeeAllPressed, {
    placementId,
    surfaceId,
    placementTitle: title,
    destination,
  });
}

export function trackPredictionOutcomePress({
  item,
  metadata,
  placementId,
  surfaceId,
}: {
  item: PlacementItem;
  metadata: PlacementItemAnalyticsMetadata & { outcome: string };
  placementId: PlacementId;
  surfaceId: string;
}): void {
  analytics.track(event.discoverPredictionOutcomePressed, {
    placementId,
    surfaceId,
    itemId: item.id,
    marketId: metadata.marketId ?? item.id,
    marketName: metadata.marketName,
    marketSlug: metadata.marketSlug,
    outcome: metadata.outcome,
  });
}

export function trackPlacementInteraction({
  interactionType,
  placement,
  surfaceId,
}: {
  interactionType: 'carousel_scroll';
  placement: Placement;
  surfaceId: string;
}): void {
  analytics.track(event.placementInteraction, {
    id: placement.id,
    interactionType,
    surfaceId,
    source: placement.source,
    type: placement.type,
    version: placement.version,
  });
}

export function defaultPlacementItemKey(item: PlacementItem): string {
  return item.id;
}
