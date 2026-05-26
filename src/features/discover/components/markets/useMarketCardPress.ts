import { useCallback } from 'react';

import { type TrackPlacementCardPress } from '@/features/discover/components/markets/marketPressContext';
import { type PlacementItemAnalyticsMetadata } from '@/features/placements/types';

export function useMarketCardPress({
  metadata,
  onPress,
  trackPress,
}: {
  metadata?: PlacementItemAnalyticsMetadata;
  onPress: () => void;
  trackPress?: TrackPlacementCardPress;
}) {
  return useCallback(() => {
    trackPress?.(metadata);
    onPress();
  }, [metadata, onPress, trackPress]);
}
