import qs from 'qs';
import { NativeCurrencyKey } from '@/entities';
import { IS_DEV } from '@/env';
import { ensureError } from '@/logger';
import { getPlatformClient } from '@/resources/platform/client';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { ChainId } from '@/state/backendNetworks/types';
import { createQueryStore, getQueryKey } from '@/state/internal/createQueryStore';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { CacheEntry, SetDataParams } from '@/state/internal/queryStore/types';
import { time } from '@/utils';
import { Bar, CandleResolution, CandlestickChartMetadata, CandlestickChartResponse, GetCandlestickChartRequest } from './types';
import { getResolutionMinutes, transformApiResponseToBars } from './utils';

// ============ Constants ====================================================== //

const CANDLESTICK_ENDPOINT = '/tokens/charts/GetCandleChart';
const ERROR_NO_DATA_FOUND = 'token data not found';

const INITIAL_BAR_COUNT = 200;
const MAX_CANDLES_PER_REQUEST = 1500;

// ============ Core Types ===================================================== //

export type CandlestickResponse = {
  candles: Bar[];
  hasPreviousCandles: boolean;
  lastFetchedCurrentPriceAt: number | undefined;
  resolution: CandleResolution;
} | null;

type ResponseMetadata = Omit<NonNullable<CandlestickResponse>, 'candles'>;

type TokenId = string;
type Token = { address: string; chainId: ChainId };
type Price = { lastUpdated: number; percentChange: number; price: number };

// ============ Charts Store =================================================== //

type ChartSettingsState = {
  candleResolution: CandleResolution;
  chartType: 'candlestick' | 'line';
  token: Token | null;
  resetCandlestickToken: () => void;
};

export const useChartsStore = createRainbowStore<ChartSettingsState>(
  set => ({
    candleResolution: CandleResolution.H4,
    chartType: 'candlestick',
    token: null,

    resetCandlestickToken: () =>
      set({
        token: null,
      }),
  }),

  { storageKey: 'chartSettingsStore' }
);

// ============ Candlestick Store ============================================== //

const CACHE_TIME = time.minutes(2);

type CandlestickParams = {
  barCount: number | null;
  candleResolution: CandleResolution;
  currency: NativeCurrencyKey;
  startTimestamp: number | null;
  token: Token | null;
};

type CandlestickState = {
  prices: Partial<Record<TokenId, Price>>;
  getPrice: (token?: Token) => Price | undefined;
};

export const useCandlestickStore = createQueryStore<CandlestickResponse, CandlestickParams, CandlestickState>(
  {
    fetcher: fetchCandlestickData,
    setData: setCandlestickData,
    params: {
      barCount: null,
      candleResolution: $ => $(useChartsStore).candleResolution,
      currency: $ => $(userAssetsStoreManager).currency,
      startTimestamp: null,
      token: $ => $(useChartsStore).token,
    },
    cacheTime: CACHE_TIME,
    staleTime: time.seconds(5),
  },

  (_, get) => ({
    prices: {},

    getPrice: providedToken => {
      const token = providedToken ?? useChartsStore.getState().token;
      if (!token) return undefined;

      const { getData, prices } = get();
      const candles = getData()?.candles;
      const tokenId = getTokenId(token);
      const price = prices[tokenId];
      if (!candles || !price) return price;

      return {
        lastUpdated: price.lastUpdated,
        percentChange: calculatePercentChange(candles),
        price: price.price,
      };
    },
  })
);

// ============ Core Fetch Functions =========================================== //

async function fetchCandlestickData(params: CandlestickParams, abortController: AbortController | null): Promise<CandlestickResponse> {
  const requestUrl = buildCandlestickRequest(params);
  if (!requestUrl) return null;

  try {
    const response = await getPlatformClient().get<CandlestickChartResponse>(requestUrl, {
      abortController,
    });

    if (!response.data || !response.data.result) {
      throw new Error('Invalid response structure from candlestick API');
    }

    const { hasPreviousCandles, lastFetchedCurrentPriceAt, resolution } = parseResponseMetadata(response.data.metadata, params);

    return {
      candles: transformApiResponseToBars(response.data),
      hasPreviousCandles,
      lastFetchedCurrentPriceAt,
      resolution,
    };
  } catch (e) {
    if (ensureError(e).message === ERROR_NO_DATA_FOUND)
      return {
        candles: [],
        hasPreviousCandles: false,
        lastFetchedCurrentPriceAt: undefined,
        resolution: params.candleResolution,
      };
    throw e;
  }
}

/**
 * Fetches historical candles for a given token and resolution, funneling
 * updates into the store. Assumes there is existing cached data to merge
 * the historical candles into, and will bail if that is not the case.
 *
 * @param candleResolution - The resolution of the candles to fetch.
 * @param candlesToFetch - The number of candles to fetch. Defaults to 500.
 * @param token - The token to fetch historical candles for.
 *
 * @returns The fetched candles, or `null` if there is no existing cached data.
 */
export async function fetchHistoricalCandles({
  candleResolution,
  candlesToFetch = 500,
  token,
}: {
  candleResolution: CandleResolution;
  candlesToFetch?: number;
  token: Token;
}): Promise<CandlestickResponse> {
  const { fetch: fetchCandles, getData } = useCandlestickStore.getState();

  const baseParams: CandlestickParams = {
    barCount: null,
    candleResolution,
    currency: userAssetsStoreManager.getState().currency,
    startTimestamp: null,
    token,
  };

  const existingData = getData(baseParams);
  if (!existingData?.candles?.length) {
    if (IS_DEV) console.warn('[fetchHistoricalCandles]: No existing candles to prepend historical candles to');
    return null;
  }

  baseParams.barCount = Math.min(candlesToFetch, MAX_CANDLES_PER_REQUEST);
  baseParams.startTimestamp = existingData.candles[0].t;

  return fetchCandles(baseParams, { skipStoreUpdates: 'withCache' });
}

// ============ Cache Updater ================================================== //

function setCandlestickData({
  data,
  params,
  queryKey: rawQueryKey,
  set,
}: SetDataParams<CandlestickResponse, CandlestickParams, CandlestickState>) {
  if (!data || !params.token) return;

  set(state => {
    const isHistoricalFetch = params.barCount || params.startTimestamp;
    const queryKey = isHistoricalFetch
      ? getQueryKey({
          barCount: null,
          candleResolution: params.candleResolution,
          currency: params.currency,
          startTimestamp: null,
          token: params.token,
        })
      : rawQueryKey;

    const existingData = state.queryCache[queryKey]?.data;
    const newData = existingData
      ? mergeOrReturnCached({
          candleResolution: params.candleResolution,
          existingData,
          newData: data,
        })
      : data;

    const updatedEntry: CacheEntry<CandlestickResponse> = {
      cacheTime: CACHE_TIME,
      data: newData,
      errorInfo: null,
      lastFetchedAt: Date.now(),
    };

    let updatedPrices = state.prices;
    if (newData && params.token) {
      const tokenId = getTokenId(params.token);
      const existingPrice = state.prices[tokenId];
      const newPrice = extractPriceFromCandles(newData.candles, newData.lastFetchedCurrentPriceAt);
      const shouldUpdate = !!newPrice && (!existingPrice?.lastUpdated || existingPrice.lastUpdated < newPrice.lastUpdated);
      if (shouldUpdate) updatedPrices = { ...prunePrices(state.prices), [tokenId]: newPrice };
    }

    return {
      ...state,
      prices: updatedPrices,
      queryCache: {
        ...state.queryCache,
        [queryKey]: updatedEntry,
      },
    };
  });
}

// ============ Fetch Helpers ================================================== //

function parseResponseMetadata(metadata: CandlestickChartMetadata, params: CandlestickParams): ResponseMetadata {
  const requestedCount = parseInt(metadata.requestedCandles, 10);
  const returnedCount = metadata.count;
  const includesCurrentPrice = !params.startTimestamp;
  return {
    hasPreviousCandles: requestedCount === returnedCount,
    lastFetchedCurrentPriceAt: includesCurrentPrice ? new Date(metadata.responseTime).getTime() : undefined,
    resolution: params.candleResolution,
  };
}

function buildCandlestickRequest(params: CandlestickParams): string | null {
  if (!params.token) return null;

  const { barCount: barCountParam, candleResolution, currency, startTimestamp, token } = params;
  const barCount = barCountParam ?? INITIAL_BAR_COUNT;

  const existingData = useCandlestickStore.getState().getData(params);
  const isPrepending = startTimestamp !== null;
  const resolutionMinutes = getResolutionMinutes(candleResolution);

  const candlesToRequest = isPrepending
    ? Math.min(barCount, MAX_CANDLES_PER_REQUEST)
    : determineCandlesToRequest({
        existingData,
        requestedBarCount: barCount,
        resolutionMinutes,
      });

  const queryParams: GetCandlestickChartRequest = {
    currency,
    requested_candles: candlesToRequest,
    resolution: candleResolution,
    start_time: startTimestamp ?? undefined,
    token_id: getTokenId(token),
  };

  return `${CANDLESTICK_ENDPOINT}?${qs.stringify(queryParams)}`;
}

/**
 * Determines the optimal number of candles to request based on existing
 * cached data, the requested bar count, and the specified resolution.
 */
function determineCandlesToRequest({
  existingData,
  requestedBarCount,
  resolutionMinutes,
  overlapBuffer = 2,
}: {
  existingData: CandlestickResponse;
  requestedBarCount: number;
  resolutionMinutes: number;
  overlapBuffer?: number;
}): number {
  if (!existingData?.candles?.length) return requestedBarCount;

  const resolutionMs = time.minutes(resolutionMinutes);
  const lastCandleMs =
    Math.max(existingData.candles[existingData.candles.length - 1].t * 1000, existingData.lastFetchedCurrentPriceAt ?? 0) ?? 0;
  const missing = Math.ceil((Date.now() - lastCandleMs) / resolutionMs);

  if (missing > 0 && missing < requestedBarCount) {
    return Math.min(missing + overlapBuffer, requestedBarCount);
  }

  return requestedBarCount;
}

/**
 * Merges new candles into the existing data if the new data differs or
 * contains additional candles, otherwise returns the cached data.
 */
function mergeOrReturnCached({
  candleResolution,
  existingData,
  newData,
}: {
  candleResolution: CandleResolution;
  existingData: CandlestickResponse | undefined;
  newData: NonNullable<CandlestickResponse>;
}): CandlestickResponse {
  if (!existingData?.candles.length) return newData;

  // -- Handle empty candles
  if (!newData.candles.length) {
    if (!existingData.hasPreviousCandles) {
      return existingData;
    }
    return {
      ...existingData,
      hasPreviousCandles: false,
    };
  }

  const firstExistingTimestamp = existingData.candles[0].t;
  const firstNewTimestamp = newData.candles[0].t;
  const isPrepending = firstNewTimestamp < firstExistingTimestamp;

  // -- Handle prepending historical candles
  if (isPrepending) {
    const cutoffIndex = firstIndexOnOrAfterTimestamp(newData.candles, firstExistingTimestamp);
    const mergedCandles = [...newData.candles.slice(0, cutoffIndex), ...existingData.candles];

    return {
      candles: mergedCandles,
      hasPreviousCandles: newData.hasPreviousCandles,
      lastFetchedCurrentPriceAt: existingData.lastFetchedCurrentPriceAt,
      resolution: existingData.resolution,
    };
  }

  // -- Handle appending new candles
  const overlapStart = firstIndexOnOrAfterTimestamp(existingData.candles, firstNewTimestamp);
  const overlapExisting = existingData.candles.length - overlapStart;
  const compareCount = Math.min(overlapExisting, newData.candles.length);

  let overlapIdentical = true;
  for (let i = 0; i < compareCount; i++) {
    if (!areCandlesEqual(existingData.candles[overlapStart + i], newData.candles[i])) {
      overlapIdentical = false;
      break;
    }
  }

  const containsFreshData = newData.candles.length > overlapExisting;
  if (overlapIdentical && !containsFreshData) {
    return {
      ...existingData,
      lastFetchedCurrentPriceAt: newData.lastFetchedCurrentPriceAt,
    };
  }

  const mergedCandles = [...existingData.candles.slice(0, overlapStart), ...newData.candles];
  const hasPreviousCandles = existingData.hasPreviousCandles ? newData.hasPreviousCandles : false;

  return {
    candles: mergedCandles,
    hasPreviousCandles,
    lastFetchedCurrentPriceAt: newData.lastFetchedCurrentPriceAt,
    resolution: candleResolution,
  };
}

// ============ Utilities ====================================================== //

/**
 * Compares two candle `Bar` objects for equality.
 */
export function areCandlesEqual(a: Bar, b: Bar): boolean {
  return a.t === b.t && a.c === b.c && a.o === b.o && a.h === b.h && a.l === b.l && a.v === b.v;
}

/**
 * Returns a unique identifier for a token in the format `address:chainId`.
 */
export function getTokenId(token: Token): string {
  return `${token.address}:${token.chainId}`;
}

/**
 * Calculates the percent change from the previous candle price to the current candle price.
 */
function calculatePercentChange(candles: Bar[]): number {
  const currentCandlePrice = candles[candles.length - 1]?.c ?? 0;
  const previousCandlePrice = candles[candles.length - 2]?.c ?? currentCandlePrice;
  return previousCandlePrice ? ((currentCandlePrice - previousCandlePrice) / previousCandlePrice) * 100 : 0;
}

/**
 * Builds a `Price` object from candles and the associated response time.
 * @returns A `Price` object, or `undefined` if a response time is not provided.
 */
function extractPriceFromCandles(candles: Bar[], responseTime: number | undefined): Price | undefined {
  if (!responseTime) return undefined;
  const currentCandlePrice = candles[candles.length - 1]?.c ?? 0;
  const percentChange = calculatePercentChange(candles);
  return {
    lastUpdated: responseTime,
    percentChange,
    price: currentCandlePrice,
  };
}

/**
 * Runs an O(log n) binary search for the first index whose `t ≥ timestamp`.
 */
function firstIndexOnOrAfterTimestamp(candles: readonly Bar[], timestamp: number): number {
  let left = 0;
  let right = candles.length;
  while (left < right) {
    const middle = (left + right) >>> 1;
    if (candles[middle].t < timestamp) left = middle + 1;
    else right = middle;
  }
  return left;
}

/**
 * Prunes prices from the cache in line with the store's cache time.
 */
function prunePrices(prices: Partial<Record<TokenId, Price>>, tokenIdToPreserve?: TokenId): Partial<Record<TokenId, Price>> {
  const now = Date.now();
  const expiration = now - CACHE_TIME;
  const priceToPreserve = tokenIdToPreserve ? prices[tokenIdToPreserve] : undefined;

  for (const tokenId in prices) {
    const price = prices[tokenId];
    if (price && price.lastUpdated < expiration) {
      if (price === priceToPreserve) continue;
      delete prices[tokenId];
    }
  }
  return prices;
}
