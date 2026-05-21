import { type NativeCurrencyKey } from '@/entities/nativeCurrencyTypes';
import { type CompactLineChartData } from '@/features/charts/line/compact/types';
import { createLineChartDataStore, type FetchedLineChartData } from '@/features/charts/stores/factories/createLineChartDataStore';
import { metadataClient } from '@/graphql';
import Routes from '@/navigation/routesNames';
import { type ChainId } from '@/state/backendNetworks/types';

const CHART_ID_SEPARATOR = '|';

type TokenChartParams = {
  address: string;
  chainId: ChainId;
  currency: NativeCurrencyKey;
};

type TokenPriceChart = {
  points?: [timestamp: number, price: number][];
};

export const useTokenLineChartsStore = createLineChartDataStore(fetchTokenLineCharts, {
  activeOnRoute: Routes.DISCOVER_SCREEN,
});

export function buildTokenLineChartId({ address, chainId, currency }: TokenChartParams): string {
  return [address, chainId, currency].join(CHART_ID_SEPARATOR);
}

async function fetchTokenLineCharts(chartIds: readonly string[], _abortController: AbortController | null): Promise<FetchedLineChartData> {
  const chartFetches = chartIds.map(chartId => fetchTokenLineChart(chartId));
  const results = await Promise.allSettled(chartFetches);

  const chartsById: FetchedLineChartData = {};
  let didResolve = false;
  let firstError: unknown;

  for (let i = 0; i < chartIds.length; i++) {
    const result = results[i];

    if (result.status === 'fulfilled') {
      didResolve = true;
      chartsById[chartIds[i]] = result.value;
    } else if (firstError === undefined) {
      firstError = result.reason;
    }
  }

  if (!didResolve && firstError !== undefined) throw firstError;

  return chartsById;
}

async function fetchTokenLineChart(chartId: string): Promise<CompactLineChartData | null> {
  const params = parseTokenLineChartId(chartId);
  if (!params) return null;

  const response = await metadataClient.priceChart({
    address: params.address,
    chainId: params.chainId,
    currency: params.currency,
    day: true,
    hour: false,
    month: false,
    week: false,
    year: false,
  });

  return buildLineChartData(response.token?.priceCharts.day as TokenPriceChart | undefined);
}

function parseTokenLineChartId(chartId: string): TokenChartParams | null {
  const [address, chainId, currency] = chartId.split(CHART_ID_SEPARATOR);
  const numericChainId = Number(chainId);

  if (!address || !Number.isInteger(numericChainId) || !currency) return null;

  return {
    address,
    chainId: numericChainId as ChainId,
    currency: currency as NativeCurrencyKey,
  };
}

function buildLineChartData(priceChart: TokenPriceChart | undefined): CompactLineChartData | null {
  const points = priceChart?.points?.filter(isPricePoint) ?? [];
  if (!points.length) return null;

  const prices = new Float32Array(points.length);
  const timestamps = new Uint32Array(points.length);

  for (let i = 0; i < points.length; i++) {
    const [timestamp, price] = points[i];
    prices[i] = price;
    timestamps[i] = timestamp > 1_000_000_000_000 ? Math.floor(timestamp / 1000) : timestamp;
  }

  return { prices, timestamps };
}

function isPricePoint(point: unknown): point is [number, number] {
  return Array.isArray(point) && point.length >= 2 && typeof point[0] === 'number' && typeof point[1] === 'number';
}
