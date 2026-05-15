import { createContext, useContext } from 'react';

import { type PlacementItemAnalyticsMetadata } from '@/features/placements/types';

export type TrackPlacementCardPress = (metadata?: PlacementItemAnalyticsMetadata) => void;

const PlacementCardContext = createContext<TrackPlacementCardPress | undefined>(undefined);

export const PlacementCardProvider = PlacementCardContext.Provider;

export function usePlacementCardTrackPress(): TrackPlacementCardPress | undefined {
  return useContext(PlacementCardContext);
}
