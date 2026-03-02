// ============ Animation Types ================================================ //

import { type ResponseByTheme } from '@/__swaps__/utils/swaps';

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

type GammaMarketBase = {
  active: boolean;
  closed: boolean;
  conditionId: string;
  groupItemTitle?: string;
  id: string;
  liquidity: string;
  question: string;
  seriesColor?: string;
  slug: string;
  sportsMarketType?: string;
  startDate?: string;
  volume: string;
};

export type GammaMarketRaw = GammaMarketBase & { clobTokenIds: string; outcomes: string; outcomePrices: string };
export type GammaMarket = GammaMarketBase & { clobTokenIds: string[]; outcomes: string[]; outcomePrices: string[] };

type GammaEventBase = {
  awayTeamName?: string;
  closed: boolean;
  description: string;
  gameId?: number;
  homeTeamName?: string;
  id: string;
  negRisk: boolean;
  slug: string;
  title: string;
};

export type GammaEventRaw = GammaEventBase & { markets: GammaMarketRaw[] };
export type GammaEvent = GammaEventBase & { markets: GammaMarket[] };

// ============ Chart Data Types =============================================== //

/**
 * A single outcome series with price history.
 */
export type OutcomeSeries = {
  /** Hex color for rendering */
  color: ResponseByTheme<string>;
  /** Display label (e.g., "Trump", "Harris") */
  label: string;
  /** Probability values (0-1) */
  prices: Float32Array;
  /** Unix timestamps in seconds */
  timestamps: Uint32Array;
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
  labels: string[];
  tokenIds: string[];
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

export type SeriesPaletteColors = readonly [ResponseByTheme<string>, ResponseByTheme<string>, ResponseByTheme<string>];

// ============ Constants ====================================================== //

export enum SeriesPalette {
  Default = 'default',
  Jewel = 'jewel',
  Midnight = 'midnight',
  Neon = 'neon',
  Sunset = 'sunset',
  Vivid = 'vivid',
}

export const SERIES_PALETTES: Readonly<Record<SeriesPalette, SeriesPaletteColors>> = {
  [SeriesPalette.Default]: toResponseByTheme(['#8BCAF2', '#DC5CEA', '#3666F4']),
  [SeriesPalette.Jewel]: toResponseByTheme(['#3B82F6', '#EF4444', '#8B5CF6']),
  [SeriesPalette.Midnight]: toResponseByTheme(['#60A5FA', '#F87171', '#C084FC']),
  [SeriesPalette.Neon]: toResponseByTheme(['#00E5FF', '#FF2D92', '#BF5AF2']),
  [SeriesPalette.Sunset]: toResponseByTheme(['#F97316', '#FBBF24', '#F472B6']),
  [SeriesPalette.Vivid]: toResponseByTheme(['#22D3EE', '#FB923C', '#A78BFA']),
};

export const DEFAULT_SERIES_PALETTE = SeriesPalette.Default;
export const SERIES_COLORS: readonly [ResponseByTheme<string>, ResponseByTheme<string>, ResponseByTheme<string>] =
  SERIES_PALETTES[DEFAULT_SERIES_PALETTE];

// ============ Utilities ====================================================== //

function toResponseByTheme(colors: [string, string, string]): SeriesPaletteColors {
  return [
    { light: colors[0], dark: colors[0] },
    { light: colors[1], dark: colors[1] },
    { light: colors[2], dark: colors[2] },
  ];
}
