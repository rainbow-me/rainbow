import { CandleResolution } from '../types';

// ============ Internal Types ================================================= //

export type Price = {
  candleResolution: CandleResolution;
  lastUpdated: number;
  percentChange: number;
  price: number;
  volume: number;
};

export type Bar = {
  /** Close price */
  c: number;
  /** High price */
  h: number;
  /** Low price */
  l: number;
  /** Open price */
  o: number;
  /** Timestamp in seconds */
  t: number;
  /** Volume */
  v: number;
};

export type CandlestickResponse = {
  candleResolution: CandleResolution;
  candles: Bar[];
  hasPreviousCandles: boolean;
  lastFetchedCurrentPriceAt: number | undefined;
} | null;

// ============ Enums ========================================================== //

/**
 * The candle resolutions supported by the API but not currently used in the app.
 */
enum DisabledCandleResolution {
  M30 = 'RESOLUTION_30_MIN',
  UNSPECIFIED = 'RESOLUTION_UNSPECIFIED',
}

// ============ API Types ====================================================== //

export type CandlestickEndpointResponse = {
  metadata: CandlestickChartMetadata;
  result: CandlestickChartResult;
};

export type CandlestickChartMetadata = {
  /** EVM chain ID part of the token identifier */
  chainId: number;
  /** Number of candles in the payload arrays */
  count: number;
  /** UTC End timestamp of the first candle */
  endTime: string;
  /** Number of candles requested */
  requestedCandles: string;
  /** Candle resolution */
  resolution: CandleResolution | DisabledCandleResolution;
  /** Duration of one candle in minutes */
  resolutionDuration: number;
  /** UTC Timestamp when the request arrived */
  requestTime: string;
  /** UTC Timestamp when this response was generated */
  responseTime: string;
  /** UTC Start timestamp of the first candle */
  startTime: string;
  /** Token identifier in the form `'address:chainId'` (e.g., `'0x123…:1'`) */
  tokenId: string;
};

export type GetCandlestickChartRequest = {
  /** Pricing currency code (e.g., `'usd'`) */
  currency: string;
  /** Number of candles to request */
  requested_candles: number;
  /** Candle resolution */
  resolution: CandleResolution | DisabledCandleResolution;
  /** Inclusive start of the time window, as epoch-seconds */
  start_time?: number;
  /** Token identifier in the form `'address:chainId'` (e.g., `'0x123…:1'`) */
  token_id: string;
};

type CandlestickChartPayload = {
  /** Close prices as decimal strings */
  c: string[];
  /** High prices as decimal strings */
  h: string[];
  /** Low prices as decimal strings */
  l: string[];
  /** Open prices as decimal strings */
  o: string[];
  /** Candle open-time for each slot (UTC timestamp) */
  t: string[];
  /** Trade volumes (base-token units) as decimal strings */
  v: string[];
};

type CandlestickChartSummary = {
  /** First candle price */
  first: string;
  /** Last candle price */
  last: string;
  /** Maximum price across the window */
  max: string;
  /** Minimum price across the window */
  min: string;
};

type CandlestickChartResult = {
  /** Chart details */
  payload: CandlestickChartPayload;
  /** Chart summary over close prices values */
  summary: CandlestickChartSummary;
};
