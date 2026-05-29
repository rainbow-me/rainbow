// ============ v1 (legacy DiscoverHome carousels) ============================ //

export const PLACEMENT_SCREENS = {
  DISCOVER: 'discover',
} as const;

export const PLACEMENT_IDS = {
  DISCOVER_PERPS_CAROUSEL: 'discover_featured_perps_carousel',
  DISCOVER_PREDICTIONS_CAROUSEL: 'discover_featured_predictions_carousel',
} as const;

export const PLACEMENT_IDS_BY_SCREEN = {
  [PLACEMENT_SCREENS.DISCOVER]: [PLACEMENT_IDS.DISCOVER_PERPS_CAROUSEL, PLACEMENT_IDS.DISCOVER_PREDICTIONS_CAROUSEL],
} as const;

// ============ v2 (placement document contract) ============================== //

export const PLACEMENT_SOURCES = {
  HYPERLIQUID: 'hyperliquid',
  POLYMARKET: 'polymarket',
  RAINBOW: 'rainbow',
} as const;

export const PLACEMENT_TYPES = {
  PERP: 'perp',
  PREDICTION: 'prediction',
  TOKEN: 'token',
} as const;
