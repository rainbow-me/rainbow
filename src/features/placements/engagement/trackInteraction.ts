import { analytics } from '@/analytics';
import { event, type EventProperties } from '@/analytics/event';
import { type Placement, type PlacementItem } from '@/features/placements/types';

export type PlacementInteractionType = Extract<
  EventProperties[typeof event.placementInteraction],
  { interactionType: unknown }
>['interactionType'];

export function trackPlacementInteraction({
  interactionType,
  item,
  placement,
}: {
  interactionType: PlacementInteractionType;
  item?: PlacementItem;
  placement: Placement;
}): void {
  analytics.track(event.placementInteraction, {
    id: placement.id,
    interactionType,
    screen: placement.screen,
    order: placement.order,
    version: placement.version,
    itemRefSource: item?.ref.source,
    itemRefId: item?.ref.id,
    itemOrder: item?.order,
  });
}
