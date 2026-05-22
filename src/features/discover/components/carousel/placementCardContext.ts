import { createContext, useContext } from 'react';

import { type PlacementItemAnalyticsMetadata } from '@/features/placements/types';

export type TrackPlacementCardPress = (metadata?: PlacementItemAnalyticsMetadata) => void;
export type TrackPredictionOutcomePress = (metadata: PlacementItemAnalyticsMetadata & { outcome: string }) => void;

const PlacementCardContext = createContext<TrackPlacementCardPress | undefined>(undefined);
const PlacementPredictionOutcomeContext = createContext<TrackPredictionOutcomePress | undefined>(undefined);

export const PlacementCardProvider = PlacementCardContext.Provider;
export const PlacementPredictionOutcomeProvider = PlacementPredictionOutcomeContext.Provider;

export function usePlacementCardTrackPress(): TrackPlacementCardPress | undefined {
  return useContext(PlacementCardContext);
}

export function usePlacementPredictionOutcomeTrackPress(): TrackPredictionOutcomePress | undefined {
  return useContext(PlacementPredictionOutcomeContext);
}
