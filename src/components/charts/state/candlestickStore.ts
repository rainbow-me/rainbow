import qs from 'qs';
import { ChartsState, useChartsStore } from '@/components/charts/state/chartsStore';
import { NativeCurrencyKey } from '@/entities';
import { IS_DEV } from '@/env';
import { ensureError } from '@/logger';
import { getPlatformClient } from '@/resources/platform/client';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { createQueryStore, getQueryKey } from '@/state/internal/createQueryStore';
import { CacheEntry, SetDataParams } from '@/state/internal/queryStore/types';
import { time } from '@/utils';
import { Bar, CandlestickChartMetadata, CandlestickChartResponse, GetCandlestickChartRequest, Price } from '../candlestick/types';
import { areCandlesEqual, getResolutionMinutes, transformApiResponseToBars } from '../candlestick/utils';
import { CandleResolution, ChartType, Token } from '../types';

// ============ Constants ====================================================== //

const CANDLESTICK_ENDPOINT = '/tokens/charts/GetCandleChart';

const ERROR_NO_DATA_FOUND = 'token data not found';
const ERROR_UNSUPPORTED_CHAIN = 'unsupported chain id';

const INITIAL_BAR_COUNT = 200;
const MAX_CANDLES_PER_REQUEST = 1500;

// ============ Core Types ===================================================== //

export type CandlestickResponse = {
  candleResolution: CandleResolution;
  candles: Bar[];
  hasPreviousCandles: boolean;
  lastFetchedCurrentPriceAt: number | undefined;
} | null;

type BaseParams = Pick<CandlestickParams, 'candleResolution' | 'token'> & Partial<Pick<CandlestickParams, 'currency'>>;
type TokenId = string;
type ResponseMetadata = Omit<NonNullable<CandlestickResponse>, 'candles'>;

// ============ Candlestick Store ============================================== //

const CACHE_TIME = time.minutes(2);

type CandlestickParams = {
  barCount?: number;
  candleResolution: CandleResolution;
  currency: NativeCurrencyKey;
  startTimestamp?: number;
  token: Token | null;
};

type CandlestickState = {
  prices: Partial<Record<TokenId, Price>>;
  getPrice: (token?: Token | TokenId) => Price | undefined;
};

export const useCandlestickStore = createQueryStore<CandlestickResponse, CandlestickParams, CandlestickState>(
  {
    fetcher: fetchCandlestickData,
    setData: setCandlestickData,
    enabled: $ => $(useChartsStore, shouldEnable),
    params: {
      candleResolution: $ => $(useChartsStore).candleResolution,
      currency: $ => $(userAssetsStoreManager).currency,
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
      const existingData = getData();
      const tokenId = typeof token === 'string' ? token : getTokenId(token);
      const price = prices[tokenId];
      if (!price || !existingData) return price;

      const { candleResolution, candles } = existingData;

      return {
        candleResolution,
        lastUpdated: price.lastUpdated,
        percentChange: calculatePercentChange(candles),
        price: price.price,
        volume: getMostRecentCandleVolume(candles),
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

    const { candleResolution, hasPreviousCandles, lastFetchedCurrentPriceAt } = parseResponseMetadata(response.data.metadata, params);

    return {
      candleResolution,
      candles: transformApiResponseToBars(response.data),
      hasPreviousCandles,
      lastFetchedCurrentPriceAt,
    };
  } catch (e) {
    if (isKnownError(e))
      return {
        candleResolution: params.candleResolution,
        candles: [],
        hasPreviousCandles: false,
        lastFetchedCurrentPriceAt: undefined,
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

  const baseParams = buildBaseParams({
    candleResolution,
    token,
  });

  const existingData = getData(baseParams);
  if (!existingData?.candles?.length) {
    if (IS_DEV) console.warn('[fetchHistoricalCandles]: No existing candles to prepend historical candles to');
    return null;
  }

  baseParams.barCount = Math.min(candlesToFetch, MAX_CANDLES_PER_REQUEST);
  baseParams.startTimestamp = existingData.candles[0].t;

  return fetchCandles(baseParams, { skipStoreUpdates: 'withCache' });
}

/**
 * Fetches the current price of a token from the candlestick API.
 *
 * @param candleResolution - The candle resolution used to determine the % change and volume.
 * @param currency - The currency to fetch the price in. Defaults to the user's native currency.
 * @param token - The token to fetch the price for.
 */
export async function fetchCandlestickPrice({
  candleResolution,
  currency,
  token,
}: {
  candleResolution: CandleResolution;
  currency?: NativeCurrencyKey;
  token: Token;
}): Promise<Price | null> {
  const response = await useCandlestickStore
    .getState()
    .fetch({ barCount: 2, candleResolution, currency, token }, { skipStoreUpdates: true });
  if (!response) return null;
  return extractPriceFromCandles(response.candles, candleResolution, response.lastFetchedCurrentPriceAt) ?? null;
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
    const isHistoricalFetch = Boolean(params.barCount || params.startTimestamp);
    const queryKey = isHistoricalFetch ? buildBaseQueryKey(params) : rawQueryKey;

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
      const newPrice = extractPriceFromCandles(newData.candles, newData.candleResolution, newData.lastFetchedCurrentPriceAt);
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
    candleResolution: params.candleResolution,
    hasPreviousCandles: requestedCount === returnedCount,
    lastFetchedCurrentPriceAt: includesCurrentPrice ? new Date(metadata.responseTime).getTime() : undefined,
  };
}

function buildCandlestickRequest(params: CandlestickParams): string | null {
  if (!params.token) return null;

  const { barCount: barCountParam, candleResolution, currency, startTimestamp, token } = params;
  const barCount = barCountParam ?? INITIAL_BAR_COUNT;

  const existingData = useCandlestickStore.getState().getData(params) ?? null;
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
    const cutoffIndex = firstIndexAtOrAfterTimestamp(newData.candles, firstExistingTimestamp);
    const mergedCandles = [...newData.candles.slice(0, cutoffIndex), ...existingData.candles];

    return {
      candleResolution: existingData.candleResolution,
      candles: mergedCandles,
      hasPreviousCandles: newData.hasPreviousCandles,
      lastFetchedCurrentPriceAt: existingData.lastFetchedCurrentPriceAt,
    };
  }

  // -- Handle appending new candles
  const overlapStart = firstIndexAtOrAfterTimestamp(existingData.candles, firstNewTimestamp);
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
    candleResolution,
    candles: mergedCandles,
    hasPreviousCandles,
    lastFetchedCurrentPriceAt: newData.lastFetchedCurrentPriceAt,
  };
}

// ============ Utilities ====================================================== //

/**
 * Returns a unique identifier for a token in the format `address:chainId`.
 */
function getTokenId({ address, chainId }: Token): string {
  return `${address}:${chainId}`;
}

/**
 * Creates a standardized parameter object for candlestick cache entries,
 * taking into account only `candleResolution`, `currency`, and `token`.
 */
function buildBaseParams({ candleResolution, currency, token }: BaseParams): CandlestickParams {
  return {
    candleResolution,
    currency: currency ?? userAssetsStoreManager.getState().currency,
    token,
  } satisfies Required<BaseParams>;
}

/**
 * Generates a standardized query key for a candlestick chart data entry,
 * taking into account only `candleResolution`, `currency`, and `token`.
 */
function buildBaseQueryKey(params: BaseParams): string {
  return getQueryKey(buildBaseParams(params));
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
 * Gets the volume of the most recent candle.
 */
function getMostRecentCandleVolume(candles: Bar[]): number {
  return candles[candles.length - 1]?.v ?? 0;
}

/**
 * Builds a `Price` object from candles and the associated response time.
 * @returns A `Price` object, or `undefined` if a response time is not provided.
 */
function extractPriceFromCandles(candles: Bar[], resolution: CandleResolution, responseTime: number | undefined): Price | undefined {
  if (!responseTime) return undefined;
  const currentCandlePrice = candles[candles.length - 1]?.c ?? 0;
  const percentChange = calculatePercentChange(candles);
  const volume = getMostRecentCandleVolume(candles);
  return {
    candleResolution: resolution,
    lastUpdated: responseTime,
    percentChange,
    price: currentCandlePrice,
    volume,
  };
}

/**
 * Runs an O(log n) binary search for the first index whose `t ≥ timestamp`.
 */
function firstIndexAtOrAfterTimestamp(candles: readonly Bar[], timestamp: number): number {
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
 * Determines if a candlestick API error is one of the following known errors:
 * - `No data found`
 * - `Unsupported chain ID`
 */
function isKnownError(error: unknown): boolean {
  const errorMessage = ensureError(error).message;
  return errorMessage === ERROR_NO_DATA_FOUND || errorMessage.includes(ERROR_UNSUPPORTED_CHAIN);
}

/**
 * Prunes prices from the cache in line with the candlestick store's cache time.
 *
 * @returns A new object with stale prices pruned, or the original object if no
 * prices were pruned.
 */
function prunePrices(originalPrices: Partial<Record<TokenId, Price>>, tokenIdToPreserve?: TokenId): Partial<Record<TokenId, Price>> {
  const now = Date.now();
  const expiration = now - CACHE_TIME;
  const prices = { ...originalPrices };
  const priceToPreserve = tokenIdToPreserve ? prices[tokenIdToPreserve] : undefined;

  let didPrune = false;
  for (const tokenId in prices) {
    const price = prices[tokenId];
    if (price && price.lastUpdated < expiration) {
      if (price === priceToPreserve) continue;
      didPrune = true;
      delete prices[tokenId];
    }
  }
  return didPrune ? prices : originalPrices;
}

/**
 * Determines whether to enable the candlestick store.
 * @returns `true` if the current chart type is `Candlestick`, `false` otherwise.
 */
function shouldEnable(state: ChartsState): boolean {
  return state.chartType === ChartType.Candlestick;
}
