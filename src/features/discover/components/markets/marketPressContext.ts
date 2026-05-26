import { createContext, useContext } from 'react';

import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import { type Destination, type Display } from '@/features/placements/surfaces/types';
import { type Placement, type PlacementId, type PlacementItem, type PlacementItemAnalyticsMetadata } from '@/features/placements/types';

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
  placementId: PlacementId | undefined;
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

export function trackDiscoverSurfaceTabPress({
  sectionId,
  sectionTitle,
  surfaceId,
  wasActive,
}: {
  sectionId: string;
  sectionTitle: string;
  surfaceId: string;
  wasActive: boolean;
}): void {
  analytics.track(event.discoverSurfaceTabPressed, {
    sectionId,
    sectionTitle,
    surfaceId,
    wasActive,
  });
}

export function trackSurfaceSectionPress({
  destination,
  display,
  placement,
  placementId,
  sectionId,
  surfaceId,
  title,
}: {
  destination: Destination;
  display: Display;
  placement: Placement | undefined;
  placementId?: PlacementId;
  sectionId: string;
  surfaceId: string;
  title: string;
}): void {
  analytics.track(event.surfaceSectionPressed, {
    destination,
    display,
    placementId,
    placementSource: placement?.source,
    placementType: placement?.type,
    placementVersion: placement?.version,
    sectionId,
    sectionTitle: title,
    surfaceId,
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
  placementId: PlacementId | undefined;
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
    placementId: placement.id,
    interactionType,
    surfaceId,
    source: placement.source,
    type: placement.type,
    version: placement.version,
  });
}

export function trackSurfaceInteraction({
  display,
  interactionType,
  placement,
  sectionId,
  surfaceId,
}: {
  display?: Display;
  interactionType: 'carousel_scroll';
  placement?: Placement;
  sectionId?: string;
  surfaceId: string;
}): void {
  analytics.track(event.surfaceInteraction, {
    display,
    interactionType,
    placementId: placement?.id,
    placementSource: placement?.source,
    placementType: placement?.type,
    placementVersion: placement?.version,
    sectionId,
    surfaceId,
  });
}
