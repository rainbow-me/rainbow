export const PLACEMENT_SURFACES = {
  DISCOVER: 'discover',
} as const;

export const PLACEMENT_IDS = {
  PERPS: 'perps',
  PREDICTIONS: 'predictions',
  TOKENS: 'tokens',
  PERPS_INDICES: 'perps_indices',
  PERPS_COMMODITIES: 'perps_commodities',
  PERPS_STOCKS: 'perps_stocks',
  PERPS_STOCKS_NEW: 'perps_stocks_new',
  PERPS_CRYPTO_MAJORS: 'perps_crypto_majors',
  PREDICTIONS_TRADFI: 'predictions_tradfi',
  PREDICTIONS_CRYPTO: 'predictions_crypto',
  PREDICTIONS_SPORTS: 'predictions_sports',
  PREDICTIONS_SPORTS_TODAY: 'predictions_sports_today',
  PREDICTIONS_SPORTS_WEEK: 'predictions_sports_week',
} as const;

type PlacementId = (typeof PLACEMENT_IDS)[keyof typeof PLACEMENT_IDS];
type PlacementSurface = (typeof PLACEMENT_SURFACES)[keyof typeof PLACEMENT_SURFACES];

export const PLACEMENT_IDS_BY_SURFACE = {
  [PLACEMENT_SURFACES.DISCOVER]: [
    PLACEMENT_IDS.PERPS,
    PLACEMENT_IDS.PREDICTIONS,
    PLACEMENT_IDS.TOKENS,
    PLACEMENT_IDS.PREDICTIONS_SPORTS_TODAY,
    PLACEMENT_IDS.PREDICTIONS_SPORTS_WEEK,
    PLACEMENT_IDS.PREDICTIONS_SPORTS,
    PLACEMENT_IDS.PERPS_INDICES,
    PLACEMENT_IDS.PERPS_COMMODITIES,
    PLACEMENT_IDS.PERPS_STOCKS,
    PLACEMENT_IDS.PREDICTIONS_TRADFI,
    PLACEMENT_IDS.PERPS_STOCKS_NEW,
    PLACEMENT_IDS.PERPS_CRYPTO_MAJORS,
    PLACEMENT_IDS.PREDICTIONS_CRYPTO,
  ],
} as const satisfies Record<PlacementSurface, readonly PlacementId[]>;
