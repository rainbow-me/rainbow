import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import { type Placement, type PlacementItem } from '@/features/placements/types';

export function trackPlacementInteraction({ item, placement }: { item?: PlacementItem; placement: Placement }) {
  analytics.track(event.placementInteraction, {
    id: placement.id,
    screen: placement.screen,
    order: placement.order,
    version: placement.version,
    itemRefSource: item?.ref.source,
    itemRefId: item?.ref.id,
    itemOrder: item?.order,
  });
}
