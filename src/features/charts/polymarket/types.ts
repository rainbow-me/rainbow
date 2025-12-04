// ============ Animation Types ================================================ //

export enum EntranceAnimation {
  /** Lines draw in from left to right, revealing with round cap at leading edge */
  Draw = 'draw',
  /** No special entrance animation - chart appears immediately */
  Fade = 'fade',
  /** Lines rise up from below their actual position */
  Rise = 'rise',
}

// ============ Interval Types ================================================= //

/**
 * Time intervals supported by the Polymarket CLOB API.
 * These map directly to the `interval` query parameter.
 */
export type PolymarketInterval = '1h' | '6h' | '1d' | '1w' | '1m' | 'max';

/**
 * Fidelity (resolution in minutes) for each interval.
 * Higher fidelity = more data points.
 */
export const FIDELITY_MAP: Readonly<Record<PolymarketInterval, number>> = {
  '1h': 1,
  '6h': 5,
  '1d': 15,
  '1w': 60,
  '1m': 240,
  // Use daily buckets for max to unlock the full history (fidelity is minutes)
  'max': 1440,
};

/** Display labels for intervals */
export const INTERVAL_LABELS: Readonly<Record<PolymarketInterval, string>> = {
  '1h': '1H',
  '6h': '6H',
  '1d': '1D',
  '1w': '1W',
  '1m': '1M',
  'max': 'MAX',
};

// ============ API Response Types ============================================= //

/** A single price point from the CLOB prices-history endpoint. */
export type PricePoint = {
  /** Unix timestamp in seconds */
  t: number;
  /** Price/probability (0.00 to 1.00) */
  p: number;
};

/** Response from the CLOB prices-history endpoint. */
export type ClobPriceHistoryResponse = {
  history: PricePoint[];
};

/** Raw market from the Gamma API (arrays are JSON strings). */
export type GammaMarketRaw = {
  active: boolean;
  clobTokenIds: string;
  closed: boolean;
  conditionId: string;
  groupItemTitle?: string;
  id: string;
  liquidity: string;
  outcomes: string;
  outcomePrices: string;
  question: string;
  slug: string;
  /** Market start timestamp (ISO). Optional in API responses. */
  startDate?: string;
  volume: string;
};

/** Parsed market with proper array types. */
export type GammaMarket = {
  active: boolean;
  clobTokenIds: string[];
  closed: boolean;
  conditionId: string;
  groupItemTitle?: string;
  id: string;
  liquidity: string;
  outcomes: string[];
  outcomePrices: string[];
  question: string;
  slug: string;
  /** Market start timestamp (ISO). Optional in API responses. */
  startDate?: string;
  volume: string;
};

/** Raw event from the Gamma API. */
export type GammaEventRaw = {
  closed: boolean;
  description: string;
  id: string;
  markets: GammaMarketRaw[];
  negRisk: boolean;
  slug: string;
  title: string;
};

/** Parsed event with proper array types. */
export type GammaEvent = {
  closed: boolean;
  description: string;
  id: string;
  markets: GammaMarket[];
  negRisk: boolean;
  slug: string;
  title: string;
};

// ============ Chart Data Types =============================================== //

/**
 * A single outcome series with price history.
 */
export type OutcomeSeries = {
  /** Hex color for rendering */
  color: string;
  /** Display label (e.g., "Trump", "Harris") */
  label: string;
  /** Probability values (0-1) */
  prices: Float32Array;
  /** Unix timestamps in seconds */
  timestamps: Float32Array;
  /** CLOB token ID */
  tokenId: string;
};

/** Chart data for a Polymarket event when successfully fetched. */
export type PolymarketChartDataPayload = {
  interval: PolymarketInterval;
  /** Up to MAX_POLYMARKET_SERIES outcomes */
  series: OutcomeSeries[];
};

/**
 * Complete chart data for a Polymarket event.
 * `null` indicates data has not been fetched yet.
 */
export type PolymarketChartData = PolymarketChartDataPayload | null;

/** Filter for direct tokenId-based chart fetching (used by market sheet). */
export type MarketFilter = {
  tokenIds: string[];
  labels: string[];
};

/** Parameters for fetching chart data. */
export type PolymarketChartParams = {
  eventSlug: string;
  fidelity?: number;
  interval: PolymarketInterval;
};

/** Parameters for fetching market chart data. */
export type PolymarketMarketChartParams = {
  fidelity?: number;
  interval: PolymarketInterval;
  marketFilter: MarketFilter | null;
};

// ============ Constants ====================================================== //

/**
 * Available color palettes for chart series, optimized for dark mode.
 *
 * - **Vivid**: Balanced, modern palette with excellent contrast. The professional default.
 * - **Neon**: Electric, high-saturation colors with a futuristic synthwave aesthetic.
 * - **Jewel**: Rich gemstone-inspired tones for a luxurious, premium feel.
 * - **Midnight**: Cool-toned and sophisticated, elegant and calming.
 * - **Sunset**: Warm golden-hour palette, inviting and approachable.
 */
export enum SeriesPalette {
  Default = 'default',
  Jewel = 'jewel',
  Midnight = 'midnight',
  Neon = 'neon',
  Sunset = 'sunset',
  Vivid = 'vivid',
}

export const SERIES_PALETTES: Readonly<Record<SeriesPalette, readonly [string, string, string, string, string]>> = {
  [SeriesPalette.Default]: ['#8BCAF2', '#DC5CEA', '#3666F4', '#34D399', '#F472B6'],
  [SeriesPalette.Jewel]: ['#3B82F6', '#EF4444', '#8B5CF6', '#10B981', '#F59E0B'],
  [SeriesPalette.Midnight]: ['#60A5FA', '#F87171', '#C084FC', '#2DD4BF', '#FBBF24'],
  [SeriesPalette.Neon]: ['#00E5FF', '#FF2D92', '#BF5AF2', '#30D158', '#FF9F0A'],
  [SeriesPalette.Sunset]: ['#F97316', '#FBBF24', '#F472B6', '#A78BFA', '#22D3EE'],
  [SeriesPalette.Vivid]: ['#22D3EE', '#FB923C', '#A78BFA', '#34D399', '#F472B6'],
};

export const DEFAULT_SERIES_PALETTE = SeriesPalette.Default;
export const SERIES_COLORS: readonly string[] = SERIES_PALETTES[DEFAULT_SERIES_PALETTE];
