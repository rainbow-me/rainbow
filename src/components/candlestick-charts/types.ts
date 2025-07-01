export type Bar = {
  /** Close price */
  c: number;
  /** High price */
  h: number;
  /** Low price */
  l: number;
  /** Open price */
  o: number;
  /** Timestamp */
  t: number;
  /** Volume */
  v: number;
};

export type BarsResponse = {
  /** Close prices */
  c: number[];
  /** High prices */
  h: number[];
  /** Low prices */
  l: number[];
  /** Open prices */
  o: number[];
  /** Timestamps */
  t: number[];
  /** Volumes */
  v: number[];
};

export enum CandleResolution {
  UNSPECIFIED = 'RESOLUTION_UNSPECIFIED',
  M1 = 'RESOLUTION_1_MIN',
  M5 = 'RESOLUTION_5_MIN',
  M15 = 'RESOLUTION_15_MIN',
  M30 = 'RESOLUTION_30_MIN',
  H1 = 'RESOLUTION_60_MIN',
  H4 = 'RESOLUTION_4_HR',
  H12 = 'RESOLUTION_12_HR',
  D1 = 'RESOLUTION_1_DAY',
  D7 = 'RESOLUTION_7_DAY',
}

export type GetCandleChartRequest = {
  /** Pricing currency code (e.g., "usd") */
  currency: string;
  /** Number of candles to request */
  requested_candles: number;
  /** Candle resolution */
  resolution: CandleResolution;
  /** Inclusive start of the time window, as epoch-seconds */
  start_time?: number;
  /** Token identifier in the form "<address>:<chain_id>" (e.g., "0xtoken..address:1") */
  token_id: string;
};

export type CandleChartMetadata = {
  /** EVM chain ID part of the token identifier */
  chainId: number;
  /** Number of candles in the payload arrays */
  count: number;
  /** UTC End timestamp of the first candle */
  endTime: string;
  /** Number of candles requested */
  requestedCandles: string;
  /** Candle resolution */
  resolution: CandleResolution;
  /** Duration of one candle in minutes */
  resolutionDuration: number;
  /** UTC Timestamp when the request arrived */
  requestTime: string;
  /** UTC Timestamp when this response was generated */
  responseTime: string;
  /** UTC Start timestamp of the first candle */
  startTime: string;
  /** Token identifier in the form "<address>:<chain_id>" */
  tokenId: string;
};

export type CandlestickChartPayload = {
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

export type CandlestickChartSummary = {
  /** First candle price */
  first: string;
  /** Last candle price */
  last: string;
  /** Maximum price across the window */
  max: string;
  /** Minimum price across the window */
  min: string;
};

export type CandlestickChartResult = {
  /** Chart details */
  payload: CandlestickChartPayload;
  /** Chart summary over close prices values */
  summary: CandlestickChartSummary;
};

export type CandlestickChartResponse = {
  metadata: CandleChartMetadata;
  result: CandlestickChartResult;
};
