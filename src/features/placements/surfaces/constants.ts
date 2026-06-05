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

/**
 * Whether a surface display renders the event-card layouts (carousel/list).
 * Generic over any prediction event-card display — not specific to sports.
 */
export function isEventCardDisplay(display: string): boolean {
  return (EVENT_CARD_DISPLAY_VALUES as readonly string[]).includes(display);
}
