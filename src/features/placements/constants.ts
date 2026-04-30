export const PLACEMENT_SCREENS = {
  DISCOVER: 'discover',
} as const;

export const PLACEMENT_IDS = {
  PERPS: 'discover_featured_perps_carousel',
  PREDICTIONS: 'discover_featured_predictions_carousel',
} as const;

export const PLACEMENT_IDS_BY_SCREEN = {
  [PLACEMENT_SCREENS.DISCOVER]: [PLACEMENT_IDS.PERPS, PLACEMENT_IDS.PREDICTIONS],
} as const;
