import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import { type CardPressHandler } from '@/features/discover/types/sectionLayout';
import { trackPlacementInteraction } from '@/features/placements/engagement/trackInteraction';
import { type SurfaceId, type SurfaceLeaf } from '@/features/placements/surfaces/types';
import { type Placement } from '@/features/placements/types';

/**
 * Records a Discover card press and its placement interaction.
 */
export function trackDiscoverCardPress({
  placement,
  section,
  surfaceId,
  title,
  itemId,
  itemOrder,
  metadata,
}: {
  placement: Placement;
  section: SurfaceLeaf;
  surfaceId: SurfaceId;
  title: string;
  itemId: string;
  itemOrder: number;
  metadata: Parameters<CardPressHandler>[0];
}): void {
  analytics.track(event.discoverCardPressed, {
    placementId: placement.id,
    placementSource: placement.source,
    placementTitle: title,
    itemOrder,
    itemId,
    marketId: metadata.marketId,
    marketName: metadata.marketName,
    marketSlug: metadata.marketSlug,
    marketSymbol: metadata.marketSymbol,
    marketType: placement.type,
  });
  trackPlacementInteraction({
    display: section.display,
    id: placement.id,
    interactionType: 'card_press',
    itemId,
    itemOrder,
    sectionId: section.id,
    sectionTitle: title,
    source: placement.source,
    surfaceId,
    type: placement.type,
    version: placement.version,
  });
}
