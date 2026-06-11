import { downsampleCompactLineChartData } from '@/features/charts/line/compact/downsampleCompactLineChartData';
import { type CompactLineChartData } from '@/features/charts/line/compact/types';
import {
  aggregateLineChartFetches,
  createLineChartDataStore,
  type FetchedLineChartData,
} from '@/features/charts/stores/factories/createLineChartDataStore';
import { type NativeCurrencyKey } from '@/features/currency/types';
import { metadataClient } from '@/graphql';
import Routes from '@/navigation/routesNames';
import { type ChainId } from '@/state/backendNetworks/types';

const CHART_ID_SEPARATOR = '|';

/** Token sparklines are dense day charts; cap them once here so the view layer never re-samples. */
const TOKEN_SPARKLINE_MAX_POINTS = 24;

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

async function fetchTokenLineCharts(chartIds: readonly string[]): Promise<FetchedLineChartData> {
  return aggregateLineChartFetches(
    chartIds,
    chartIds.map(chartId => fetchTokenLineChart(chartId))
  );
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

/**
 * Normalizes a token price chart timestamp to seconds.
 *
 * The token metadata API returns timestamps inconsistently — sometimes milliseconds,
 * sometimes seconds. Values over 1e12 are treated as milliseconds and converted to
 * seconds so the chart store always holds second-resolution timestamps.
 */
function normalizeTokenChartTimestampSeconds(timestamp: number): number {
  return timestamp > 1_000_000_000_000 ? Math.floor(timestamp / 1000) : timestamp;
}

function buildLineChartData(priceChart: TokenPriceChart | undefined): CompactLineChartData | null {
  const points = priceChart?.points?.filter(isPricePoint) ?? [];
  if (!points.length) return null;

  const prices = new Float32Array(points.length);
  const timestamps = new Uint32Array(points.length);

  for (let i = 0; i < points.length; i++) {
    const [timestamp, price] = points[i];
    prices[i] = price;
    timestamps[i] = normalizeTokenChartTimestampSeconds(timestamp);
  }

  return downsampleCompactLineChartData({ prices, timestamps }, TOKEN_SPARKLINE_MAX_POINTS) ?? null;
}

function isPricePoint(point: unknown): point is [number, number] {
  return Array.isArray(point) && point.length >= 2 && typeof point[0] === 'number' && typeof point[1] === 'number';
}
