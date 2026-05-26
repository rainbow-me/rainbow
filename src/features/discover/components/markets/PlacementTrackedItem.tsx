import { useCallback, type ReactNode } from 'react';

import {
  PlacementCardProvider,
  PlacementPredictionOutcomeProvider,
  trackPlacementCardPress,
  trackPredictionOutcomePress,
  type TrackPlacementCardPress,
  type TrackPredictionOutcomePress,
} from '@/features/discover/components/markets/marketPressContext';
import { type Placement, type PlacementId, type PlacementItem } from '@/features/placements/types';

type PlacementTrackedItemProps<T extends PlacementItem> = {
  children: ReactNode;
  item: T;
  itemIndex: number;
  placement: Placement | undefined;
  placementId: PlacementId | undefined;
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
