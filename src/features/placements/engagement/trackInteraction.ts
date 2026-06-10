import { analytics } from '@/analytics';
import { event, type EventProperties } from '@/analytics/event';

type PlacementInteraction = EventProperties[typeof event.placementInteraction];
type SurfaceInteraction = EventProperties[typeof event.surfaceInteraction];

export function trackPlacementInteraction({
  display,
  id,
  interactionType,
  itemId,
  itemOrder,
  sectionId,
  sectionTitle,
  source,
  surfaceId,
  type,
  version,
}: PlacementInteraction): void {
  analytics.track(event.placementInteraction, {
    display,
    id,
    interactionType,
    itemId,
    itemOrder,
    sectionId,
    sectionTitle,
    source,
    surfaceId,
    type,
    version,
  });
}

export function trackSurfaceInteraction({
  display,
  destination,
  id,
  sectionId,
  sectionTitle,
  version = 1,
}: Omit<SurfaceInteraction, 'version'> & { version?: SurfaceInteraction['version'] }): void {
  analytics.track(event.surfaceInteraction, {
    display,
    destination,
    id,
    sectionId,
    sectionTitle,
    version,
  });
}
