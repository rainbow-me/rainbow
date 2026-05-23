import { type PlacementSource } from '@/features/placements/types';

export const DISPLAYS = {
  PERP_PILL_CAROUSEL: 'perp_pill.carousel',
  PERP_TILE_CAROUSEL: 'perp_tile.carousel',
  PERP_TILE_GRID: 'perp_tile.grid',
  PERP_ROW_LIST: 'perp_row.list',
  PREDICTION_TILE_CAROUSEL: 'prediction_tile.carousel',
  PREDICTION_TILE_GRID: 'prediction_tile.grid',
  PREDICTION_TILE_WIDGET_CAROUSEL: 'prediction_tile_widget.carousel',
  PREDICTION_SPORT_WIDGET_CAROUSEL: 'prediction_sport_widget.carousel',
  TOKEN_CELL_LIST: 'token_cell.list',
} as const;

export const DESTINATION_ROOTS = {
  PERPS: 'perps',
  PREDICTIONS: 'predictions',
  TOKENS: 'tokens',
  DAPPS: 'dapps',
} as const;

export const SOURCE_BY_DISPLAY = {
  [DISPLAYS.PERP_PILL_CAROUSEL]: 'hyperliquid',
  [DISPLAYS.PERP_TILE_CAROUSEL]: 'hyperliquid',
  [DISPLAYS.PERP_TILE_GRID]: 'hyperliquid',
  [DISPLAYS.PERP_ROW_LIST]: 'hyperliquid',
  [DISPLAYS.PREDICTION_TILE_CAROUSEL]: 'polymarket',
  [DISPLAYS.PREDICTION_TILE_GRID]: 'polymarket',
  [DISPLAYS.PREDICTION_TILE_WIDGET_CAROUSEL]: 'polymarket',
  [DISPLAYS.PREDICTION_SPORT_WIDGET_CAROUSEL]: 'polymarket',
  [DISPLAYS.TOKEN_CELL_LIST]: 'rainbow',
} as const satisfies Record<(typeof DISPLAYS)[keyof typeof DISPLAYS], PlacementSource>;

export const DISPLAY_VALUES = Object.keys(SOURCE_BY_DISPLAY);
export const DESTINATION_ROOT_VALUES = Object.values(DESTINATION_ROOTS);
