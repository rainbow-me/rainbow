import qs from 'qs';
import { NativeCurrencyKey } from '@/entities';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { ChainId } from '@/state/backendNetworks/types';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { time } from '@/utils';
import { Bar, CandleResolution, GetCandleChartRequest, CandlestickChartResponse } from './types';
import { transformApiResponseToBars } from './utils';
import { getPlatformClient } from '@/resources/platform/client';

const CANDLESTICK_ENDPOINT = '/tokens/charts/GetCandleChart';
const INITIAL_BAR_COUNT = 200;

type ChartSettingsState = {
  barCount: number;
  candleResolution: CandleResolution;
  chartType: 'candlestick' | 'line';
  token: { address: string; chainId: ChainId } | undefined;
  resetCandlestickSettings: () => void;
};

export const useChartsStore = createRainbowStore<ChartSettingsState>(
  set => ({
    barCount: INITIAL_BAR_COUNT,
    candleResolution: CandleResolution.H4,
    chartType: 'candlestick',
    token: undefined,

    resetCandlestickSettings: () =>
      set({
        barCount: INITIAL_BAR_COUNT,
        token: undefined,
      }),
  }),

  { storageKey: 'chartSettingsStore' }
);

export type CandlestickParams = {
  barCount?: number;
  candleResolution?: CandleResolution;
  currency: NativeCurrencyKey;
  startTimestamp?: number;
  token: { address: string; chainId: ChainId } | undefined;
};

export const useCandlestickStore = createQueryStore<Bar[], CandlestickParams>({
  fetcher: fetchCandlestickData,
  params: {
    barCount: $ => $(useChartsStore).barCount,
    candleResolution: $ => $(useChartsStore).candleResolution,
    currency: $ => $(userAssetsStoreManager).currency,
    token: $ => $(useChartsStore).token,
  },
  cacheTime: time.minutes(1),
  staleTime: time.seconds(6),
});

function buildCandleChartRequest(params: CandlestickParams): GetCandleChartRequest {
  const currency = params.currency;
  const resolution = params.candleResolution || CandleResolution.H1;

  const startTime = params.startTimestamp;

  let tokenId = 'eth:1';
  if (params.token) tokenId = `${params.token.address}:${params.token.chainId}`;

  return {
    currency,
    start_time: startTime,
    requested_candles: params.barCount ?? INITIAL_BAR_COUNT,
    resolution,
    token_id: tokenId,
  };
}

function buildQueryParams(request: GetCandleChartRequest): string {
  return qs.stringify({
    currency: request.currency,
    requested_candles: request.requested_candles,
    resolution: request.resolution,
    start_time: request.start_time,
    token_id: request.token_id,
  } satisfies GetCandleChartRequest);
}

async function fetchCandlestickData(params: CandlestickParams, abortController: AbortController | null): Promise<Bar[]> {
  const platformClient = getPlatformClient();
  const request = buildCandleChartRequest(params);
  const queryParams = buildQueryParams(request);

  const fullUrl = `${CANDLESTICK_ENDPOINT}?${queryParams}`;
  const response = await platformClient.get<CandlestickChartResponse>(fullUrl, { abortController });

  if (!response.data || !response.data.result) {
    throw new Error('Invalid response structure from candlestick API');
  }

  return transformApiResponseToBars(response.data);
}
