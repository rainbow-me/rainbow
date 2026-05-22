import { useCallback, type ReactNode } from 'react';

import {
  PlacementCardProvider,
  PlacementPredictionOutcomeProvider,
  type TrackPlacementCardPress,
  type TrackPredictionOutcomePress,
} from '@/features/discover/components/carousel/placementCardContext';
import { trackPlacementCardPress, trackPredictionOutcomePress } from '@/features/discover/components/placementTracking';
import { type Placement, type PlacementId, type PlacementItem } from '@/features/placements/types';

type PlacementTrackedItemProps<T extends PlacementItem> = {
  children: ReactNode;
  item: T;
  itemIndex: number;
  placement: Placement | undefined;
  placementId: PlacementId;
  surfaceId: string;
  title: string;
};

export function PlacementTrackedItem<T extends PlacementItem>({
  children,
  item,
  itemIndex,
  placement,
  placementId,
  surfaceId,
  title,
}: PlacementTrackedItemProps<T>) {
  const trackPress: TrackPlacementCardPress = useCallback(
    metadata =>
      trackPlacementCardPress({
        item,
        itemIndex,
        metadata,
        placement,
        placementId,
        surfaceId,
        title,
      }),
    [item, itemIndex, placement, placementId, surfaceId, title]
  );

  const trackOutcomePress: TrackPredictionOutcomePress = useCallback(
    metadata =>
      trackPredictionOutcomePress({
        item,
        metadata,
        placementId,
        surfaceId,
      }),
    [item, placementId, surfaceId]
  );

  return (
    <PlacementCardProvider value={trackPress}>
      <PlacementPredictionOutcomeProvider value={trackOutcomePress}>{children}</PlacementPredictionOutcomeProvider>
    </PlacementCardProvider>
  );
}
