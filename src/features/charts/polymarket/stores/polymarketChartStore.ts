import { time } from '@/utils';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { fetchGammaEvent } from '../api/gammaClient';
import { fetchPriceHistory } from '../api/clobClient';
import {
  FIDELITY_MAP,
  GammaMarket,
  MarketFilter,
  OutcomeSeries,
  PolymarketChartData,
  PolymarketChartParams,
  PolymarketInterval,
  PolymarketMarketChartParams,
  PricePoint,
  SERIES_COLORS,
} from '../types';
import { PolymarketStoreState, usePolymarketStore } from './polymarketStore';

// ============ Constants ====================================================== //

export const MAX_POLYMARKET_SERIES = 3;

const EMPTY_SERIES: OutcomeSeries[] = [];
const YES_COLOR = '#3ECF5B';
const NO_COLOR = '#FF584D';

// ============ Store ========================================================== //

export const usePolymarketChartStore = createQueryStore<PolymarketChartData, PolymarketChartParams>({
  enabled: $ => $(usePolymarketStore, shouldEnable),
  fetcher: fetchPolymarketChartData,
  params: {
    eventSlug: $ => $(usePolymarketStore, getEventSlug),
    interval: $ => $(usePolymarketStore, getInterval),
  },
  cacheTime: time.minutes(2),
  staleTime: time.seconds(20),
});

export const usePolymarketMarketChartStore = createQueryStore<PolymarketChartData, PolymarketMarketChartParams>({
  enabled: $ => $(usePolymarketStore, shouldEnableMarketChart),
  fetcher: fetchPolymarketChartData,
  params: {
    interval: $ => $(usePolymarketStore, getInterval),
    marketFilter: $ => $(usePolymarketStore, getMarketFilter),
  },
  cacheTime: time.minutes(2),
  staleTime: time.seconds(20),
});

// ============ Fetcher ======================================================== //

async function fetchPolymarketChartData(
  params: PolymarketChartParams | PolymarketMarketChartParams,
  abortController: AbortController | null
): Promise<PolymarketChartData> {
  if ('eventSlug' in params) {
    const { eventSlug, fidelity, interval } = params;
    return fetchEventChart(abortController, eventSlug, interval, fidelity);
  }

  const { interval, marketFilter, fidelity } = params;
  if (marketFilter?.tokenIds.length) {
    return fetchMarketFilterChart(abortController, interval, marketFilter, fidelity);
  }
  return null;
}

async function fetchMarketFilterChart(
  abortController: AbortController | null,
  interval: PolymarketInterval,
  marketFilter: MarketFilter,
  fidelity?: number
): Promise<PolymarketChartData> {
  const { labels, tokenIds } = marketFilter;

  const isYesNoMarket = hasYesAndNo(labels);
  const yesIndex = isYesNoMarket ? labels.findIndex(l => l?.toLowerCase() === 'yes') : -1;

  const filteredTokenIds = yesIndex >= 0 ? [tokenIds[yesIndex]] : tokenIds;
  const filteredLabels = yesIndex >= 0 ? [labels[yesIndex]] : labels;

  const resolvedFidelity = resolveFidelityForInterval(null, interval, fidelity);

  const histories = await Promise.all(
    filteredTokenIds.map(tokenId => fetchPriceHistory(abortController, interval, tokenId, resolvedFidelity))
  );
  const useYesNoColors = hasYesAndNo(filteredLabels);

  const series: OutcomeSeries[] = filteredTokenIds
    .map((tokenId, i) => {
      const history = histories[i];
      if (!history?.length) return null;
      const { prices, timestamps } = buildSeriesArrays(history);
      return {
        color: getOutcomeColor(filteredLabels[i], i, useYesNoColors),
        label: filteredLabels[i] ?? `Outcome ${i + 1}`,
        prices,
        timestamps,
        tokenId,
      };
    })
    .filter(s => s !== null);

  return series.length ? { interval, series } : { interval, series: EMPTY_SERIES };
}

async function fetchEventChart(
  abortController: AbortController | null,
  eventSlug: string,
  interval: PolymarketInterval,
  fidelity?: number
): Promise<PolymarketChartData> {
  const event = await fetchGammaEvent(abortController, eventSlug);
  if (!event) return null;

  const markets = selectTopMarketsForChart(event.markets, MAX_POLYMARKET_SERIES);
  if (!markets.length) return { interval, series: EMPTY_SERIES };

  const tokenIds = markets.map(m => m.clobTokenIds[0]).filter(Boolean);
  const resolvedFidelity = resolveFidelityForInterval(event.markets, interval, fidelity);
  const histories = await Promise.all(tokenIds.map(tokenId => fetchPriceHistory(abortController, interval, tokenId, resolvedFidelity)));

  const outcomeLabels = markets.map(m => m.outcomes[0] ?? '');
  const useYesNoColors = hasYesAndNo(outcomeLabels);

  const series: OutcomeSeries[] = markets
    .map((market, i) => {
      const history = histories[i];
      if (!history?.length) return null;
      const { prices, timestamps } = buildSeriesArrays(history);
      return {
        color: getOutcomeColor(market.outcomes[0], i, useYesNoColors),
        label: getMarketLabel(market),
        prices,
        timestamps,
        tokenId: tokenIds[i],
      };
    })
    .filter(s => s !== null);

  return series.length ? { interval, series } : { interval, series: EMPTY_SERIES };
}

// ============ Selectors ====================================================== //

function getEventSlug(state: PolymarketStoreState): string {
  return state.selectedEventSlug ?? '';
}

function getInterval(state: PolymarketStoreState): PolymarketInterval {
  return state.chartInterval;
}

function getMarketFilter(state: PolymarketStoreState): MarketFilter | null {
  return state.selectedMarketFilter;
}

function shouldEnable(state: PolymarketStoreState): boolean {
  return state.selectedEventSlug !== null;
}

function shouldEnableMarketChart(state: PolymarketStoreState): boolean {
  return state.selectedMarketFilter !== null;
}

// ============ Helpers ======================================================== //

function buildSeriesArrays(history: PricePoint[]): { prices: Float32Array; timestamps: Float32Array } {
  const len = history.length;
  const prices = new Float32Array(len);
  const timestamps = new Float32Array(len);
  if (!len) return { prices, timestamps };

  const firstTs = history[0].t;
  const lastTs = history[len - 1].t;
  const isAscending = firstTs <= lastTs;

  for (let i = 0; i < len; i++) {
    const point = isAscending ? history[i] : history[len - 1 - i];
    prices[i] = point.p;
    timestamps[i] = point.t;
  }
  return { prices, timestamps };
}

function getOutcomeColor(label: string, index: number, enableYesNoColors: boolean): string {
  if (enableYesNoColors) {
    const normalized = label?.toLowerCase();
    if (normalized === 'yes') return YES_COLOR;
    if (normalized === 'no') return NO_COLOR;
  }
  return SERIES_COLORS[index % SERIES_COLORS.length];
}

function hasYesAndNo(labels: readonly string[]): boolean {
  if (labels.length !== 2) return false;
  let hasYes = false;
  let hasNo = false;
  for (let i = 0; i < labels.length; i++) {
    const normalized = labels[i]?.toLowerCase();
    if (normalized === 'yes') hasYes = true;
    else if (normalized === 'no') hasNo = true;
    if (hasYes && hasNo) return true;
  }
  return false;
}

function getMarketLabel(market: GammaMarket): string {
  if (market.outcomes.length === 2 && market.outcomes[0] === 'Yes' && market.outcomes[1] === 'No') {
    return market.groupItemTitle ?? market.question.slice(0, 27) + '…';
  }
  return market.outcomes[0] ?? 'Unknown';
}

export function selectTopMarketsForChart<T extends { active: boolean; closed: boolean; clobTokenIds: string[]; outcomePrices: string[] }>(
  markets: T[],
  maxCount: number
): T[] {
  return markets
    .filter(m => m.active && !m.closed && m.clobTokenIds.length > 0)
    .sort((a, b) => (parseFloat(b.outcomePrices[0]) || 0) - (parseFloat(a.outcomePrices[0]) || 0))
    .slice(0, maxCount)
    .reverse();
}

// ============ Fidelity Selection ============================================= //

enum HistoryBucketMinutes {
  FourHours = 240,
  TwelveHours = 720,
  OneDay = 1440,
}

enum HistorySpanDays {
  Short = 60,
  Medium = 180,
}

function resolveFidelityForInterval(markets: GammaMarket[] | null | undefined, interval: PolymarketInterval, fidelity?: number): number {
  if (fidelity !== undefined) return fidelity;
  if (interval !== 'max') return FIDELITY_MAP[interval];

  const spanDays = getSpanDays(markets);
  if (spanDays === null) return FIDELITY_MAP.max;
  if (spanDays <= HistorySpanDays.Short) return HistoryBucketMinutes.FourHours;
  if (spanDays <= HistorySpanDays.Medium) return HistoryBucketMinutes.TwelveHours;
  return HistoryBucketMinutes.OneDay;
}

function getSpanDays(markets: GammaMarket[] | null | undefined): number | null {
  if (!markets?.length) return null;

  let minStart = Number.POSITIVE_INFINITY;
  for (const m of markets) {
    if (!m.startDate) continue;
    const ts = Date.parse(m.startDate);
    if (Number.isFinite(ts) && ts < minStart) {
      minStart = ts;
    }
  }

  if (minStart === Number.POSITIVE_INFINITY) return null;
  const now = Date.now();
  if (now <= minStart) return 0;
  return (now - minStart) / time.days(1);
}
