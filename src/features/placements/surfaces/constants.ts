import { PLACEMENT_SOURCES } from '@/features/placements/constants';
import { type PlacementSource } from '@/features/placements/types';

export const DISPLAYS = {
  MARKET_PILL_CAROUSEL: 'market_pill.carousel',
  MARKET_TILE_CAROUSEL: 'market_tile.carousel',
  MARKET_TILE_GRID: 'market_tile.grid',
  MARKET_CELL_LIST: 'market_cell.list',
  PREDICTION_TILE_CAROUSEL: 'prediction_tile.carousel',
  PREDICTION_TILE_GRID: 'prediction_tile.grid',
  PREDICTION_TILE_WIDGET_CAROUSEL: 'prediction_tile_widget.carousel',
  PREDICTION_EVENT_CARD_CAROUSEL: 'prediction_event_card.carousel',
  PREDICTION_EVENT_CARD_LIST: 'prediction_event_card.list',
} as const;

export const DESTINATION_ROOTS = {
  PERPS: 'perps',
  PREDICTIONS: 'predictions',
  TOKENS: 'tokens',
} as const;

export const MARKET_DISPLAY_VALUES = [
  DISPLAYS.MARKET_PILL_CAROUSEL,
  DISPLAYS.MARKET_TILE_CAROUSEL,
  DISPLAYS.MARKET_TILE_GRID,
  DISPLAYS.MARKET_CELL_LIST,
] as const;

export const PREDICTION_DISPLAY_VALUES = [
  DISPLAYS.PREDICTION_TILE_CAROUSEL,
  DISPLAYS.PREDICTION_TILE_GRID,
  DISPLAYS.PREDICTION_TILE_WIDGET_CAROUSEL,
  DISPLAYS.PREDICTION_EVENT_CARD_CAROUSEL,
  DISPLAYS.PREDICTION_EVENT_CARD_LIST,
] as const;

export const EVENT_CARD_DISPLAY_VALUES = [DISPLAYS.PREDICTION_EVENT_CARD_CAROUSEL, DISPLAYS.PREDICTION_EVENT_CARD_LIST] as const;

export const DISPLAY_VALUES = [...MARKET_DISPLAY_VALUES, ...PREDICTION_DISPLAY_VALUES] as const;
export const DESTINATION_ROOT_VALUES = Object.values(DESTINATION_ROOTS);
export const SURFACE_SECTION_KINDS = {
  MARKET: 'market',
  PREDICTION: 'prediction',
} as const;

type SurfaceDisplay = (typeof DISPLAY_VALUES)[number];
type SurfaceSectionKind = (typeof SURFACE_SECTION_KINDS)[keyof typeof SURFACE_SECTION_KINDS];

export function getSurfaceSectionKind(display: SurfaceDisplay): SurfaceSectionKind {
  switch (display) {
    case DISPLAYS.MARKET_PILL_CAROUSEL:
    case DISPLAYS.MARKET_TILE_CAROUSEL:
    case DISPLAYS.MARKET_TILE_GRID:
    case DISPLAYS.MARKET_CELL_LIST:
      return SURFACE_SECTION_KINDS.MARKET;
    case DISPLAYS.PREDICTION_TILE_CAROUSEL:
    case DISPLAYS.PREDICTION_TILE_GRID:
    case DISPLAYS.PREDICTION_TILE_WIDGET_CAROUSEL:
    case DISPLAYS.PREDICTION_EVENT_CARD_CAROUSEL:
    case DISPLAYS.PREDICTION_EVENT_CARD_LIST:
      return SURFACE_SECTION_KINDS.PREDICTION;
  }
}

export function getPlacementSourceSectionKind(source: PlacementSource): SurfaceSectionKind {
  switch (source) {
    case PLACEMENT_SOURCES.HYPERLIQUID:
    case PLACEMENT_SOURCES.RAINBOW:
      return SURFACE_SECTION_KINDS.MARKET;
    case PLACEMENT_SOURCES.POLYMARKET:
      return SURFACE_SECTION_KINDS.PREDICTION;
  }
}

export function isSurfacePlacementCompatible(display: SurfaceDisplay, source: PlacementSource): boolean {
  return getSurfaceSectionKind(display) === getPlacementSourceSectionKind(source);
}

/**
 * Whether a surface display renders the event-card layouts (carousel/list).
 * Generic over any prediction event-card display — not specific to sports.
 */
export function isEventCardDisplay(display: string): boolean {
  return (EVENT_CARD_DISPLAY_VALUES as readonly string[]).includes(display);
}
