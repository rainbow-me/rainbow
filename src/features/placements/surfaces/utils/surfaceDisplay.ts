import { PLACEMENT_SOURCES } from '@/features/placements/constants';
import { DISPLAYS, MARKET_DISPLAY_VALUES, PREDICTION_DISPLAY_VALUES } from '@/features/placements/surfaces/constants';
import { type Display } from '@/features/placements/surfaces/types';
import { type PlacementSource } from '@/features/placements/types';

const eventCardDisplayValues = [DISPLAYS.PREDICTION_EVENT_CARD_CAROUSEL, DISPLAYS.PREDICTION_EVENT_CARD_LIST] as const;

const SURFACE_SECTION_KINDS = {
  MARKET: 'market',
  PREDICTION: 'prediction',
} as const;

type SurfaceSectionKind = (typeof SURFACE_SECTION_KINDS)[keyof typeof SURFACE_SECTION_KINDS];

function getSurfaceSectionKind(display: Display): SurfaceSectionKind {
  if ((MARKET_DISPLAY_VALUES as readonly string[]).includes(display)) return SURFACE_SECTION_KINDS.MARKET;
  if ((PREDICTION_DISPLAY_VALUES as readonly string[]).includes(display)) return SURFACE_SECTION_KINDS.PREDICTION;
  throw new Error(`[surfaceDisplay]: unsupported display ${display}`);
}

function getPlacementSourceSectionKind(source: PlacementSource): SurfaceSectionKind {
  switch (source) {
    case PLACEMENT_SOURCES.HYPERLIQUID:
    case PLACEMENT_SOURCES.RAINBOW:
      return SURFACE_SECTION_KINDS.MARKET;
    case PLACEMENT_SOURCES.POLYMARKET:
      return SURFACE_SECTION_KINDS.PREDICTION;
  }
}

export function isSurfacePlacementCompatible(display: Display, source: PlacementSource): boolean {
  return getSurfaceSectionKind(display) === getPlacementSourceSectionKind(source);
}

export function isEventCardDisplay(display: string): boolean {
  return (eventCardDisplayValues as readonly string[]).includes(display);
}
