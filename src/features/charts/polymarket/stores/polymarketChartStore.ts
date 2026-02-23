import { POLYMARKET_SPORTS_MARKET_TYPE } from '@/features/polymarket/constants';
import { isDrawMarket } from '@/features/polymarket/utils/sports';
import { usePolymarketEventStore } from '@/features/polymarket/stores/polymarketEventStore';
import { getOutcomeTeamColor } from '@/features/polymarket/utils/getOutcomeTeam';
import { isThreeWayMoneyline } from '@/features/polymarket/utils/marketClassification';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { type ResponseByTheme } from '@/__swaps__/utils/swaps';
import { time } from '@/utils/time';
import { fetchPriceHistory } from '../api/clobClient';
import { fetchGammaEvent } from '../api/gammaClient';
import {
  FIDELITY_MAP,
  type GammaEvent,
  type GammaMarket,
  type MarketFilter,
  type OutcomeSeries,
  type PolymarketChartData,
  type PolymarketChartParams,
  type PolymarketInterval,
  type PolymarketMarketChartParams,
  type PricePoint,
  SERIES_COLORS,
} from '../types';
import { type PolymarketStoreState, usePolymarketStore } from './polymarketStore';

// ============ Constants ====================================================== //

export const MAX_POLYMARKET_SERIES = 3;

const EMPTY_SERIES: OutcomeSeries[] = [];
const YES_COLOR: ResponseByTheme<string> = { light: '#3ECF5B', dark: '#3ECF5B' };
const NO_COLOR: ResponseByTheme<string> = { light: '#FF584D', dark: '#FF584D' };

// ============ Store ========================================================== //

export const usePolymarketChartStore = createQueryStore<PolymarketChartData, PolymarketChartParams>({
  enabled: $ => $(usePolymarketStore, shouldEnable),
  fetcher: fetchPolymarketChartData,
  params: {
    eventSlug: $ => $(usePolymarketStore, getEventSlug),
    interval: $ => $(usePolymarketStore, getInterval),
  },
  cacheTime: time.minutes(2),
  staleTime: time.seconds(10),
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

// ============ Fetchers ======================================================= //

async function fetchPolymarketChartData(
  params: PolymarketChartParams | PolymarketMarketChartParams,
  abortController: AbortController | null
): Promise<PolymarketChartData> {
  if ('eventSlug' in params) return fetchEventChart(params, abortController);
  if (params.marketFilter?.tokenIds.length) return fetchMarketFilterChart(params, abortController);
  return null;
}

async function fetchEventChart(params: PolymarketChartParams, abortController: AbortController | null): Promise<PolymarketChartData> {
  const event = await fetchGammaEvent(abortController, params.eventSlug);
  if (!event) return null;

  const isSportsEvent = event.gameId !== undefined;
  const inputs = isSportsEvent ? await extractSportsChartInputs(event) : await extractTopMarketsInputs(event);

  return buildChartData(params.interval, inputs, params.fidelity, abortController);
}

async function fetchMarketFilterChart(
  params: PolymarketMarketChartParams,
  abortController: AbortController | null
): Promise<PolymarketChartData> {
  const marketFilter = params.marketFilter;
  if (!marketFilter) return null;
  const inputs = extractMarketFilterInputs(marketFilter);
  return buildChartData(params.interval, inputs, params.fidelity, abortController);
}

// ============ Series Building ================================================ //

type SeriesInputs = {
  colors: ResponseByTheme<string>[] | null;
  labels: string[];
  markets: GammaMarket[] | null;
  tokenIds: string[];
};

async function buildChartData(
  interval: PolymarketInterval,
  inputs: SeriesInputs,
  fidelity: number | undefined,
  abortController: AbortController | null
): Promise<PolymarketChartData> {
  const { colors, labels, markets, tokenIds } = inputs;
  if (!tokenIds.length) return { interval, series: EMPTY_SERIES };

  const resolvedFidelity = resolveFidelity(interval, fidelity, markets);
  const histories = await Promise.all(tokenIds.map(id => fetchPriceHistory(abortController, interval, id, resolvedFidelity)));
  const series = buildSeries(tokenIds, labels, histories, colors);

  return { interval, series };
}

function buildSeries(
  tokenIds: string[],
  labels: string[],
  histories: (PricePoint[] | null)[],
  colors: ResponseByTheme<string>[] | null
): OutcomeSeries[] {
  const useYesNoColors = hasYesAndNo(labels);
  const series: OutcomeSeries[] = [];

  for (let i = 0; i < tokenIds.length; i++) {
    const history = histories[i];
    if (!history?.length) continue;

    const { prices, timestamps } = buildSeriesArrays(history);
    series.push({
      color: colors?.[i] ?? getOutcomeColor(labels[i], i, useYesNoColors),
      label: labels[i] ?? `Outcome ${i + 1}`,
      prices,
      timestamps,
      tokenId: tokenIds[i],
    });
  }

  return series.length ? series : EMPTY_SERIES;
}

// ============ Input Extraction =============================================== //

const EMPTY_INPUTS: SeriesInputs = Object.freeze({ colors: null, labels: [], markets: null, tokenIds: [] });

async function extractSportsChartInputs(event: GammaEvent): Promise<SeriesInputs> {
  const moneylineMarkets = event.markets.filter(isFullGameMoneyline);
  const moneyline = moneylineMarkets[0];
  if (!moneyline) return EMPTY_INPUTS;

  const eventData = await usePolymarketEventStore.getState().fetch({ eventId: event.id });
  const teams = eventData?.teams;

  let labels: string[];
  let tokenIds: string[];
  let markets: GammaMarket[];

  if (isThreeWayMoneyline(moneylineMarkets)) {
    const teamMarkets = moneylineMarkets.filter(m => !isDrawMarket(m)).slice(0, 2);
    labels = teamMarkets.map(m => m.groupItemTitle ?? m.question);
    tokenIds = teamMarkets.map(m => m.clobTokenIds[0]);
    markets = teamMarkets;
  } else {
    labels = moneyline.outcomes;
    tokenIds = moneyline.clobTokenIds;
    markets = [moneyline];
  }

  const colors = labels.map((label, index) => {
    return getOutcomeTeamColor({ outcome: label, outcomeIndex: index, teams });
  });

  return { colors, labels, markets, tokenIds };
}

async function extractTopMarketsInputs(event: GammaEvent): Promise<SeriesInputs> {
  const eventData = await usePolymarketEventStore.getState().fetch({ eventId: event.id });
  const markets = eventData?.markets ?? event.markets;
  const selected = selectTopMarketsForChart(markets, MAX_POLYMARKET_SERIES);

  return {
    colors: eventData ? selected.map(m => ('color' in m ? m.color : null)).filter((c): c is ResponseByTheme<string> => c !== null) : null,
    labels: selected.map(getMarketLabel),
    markets: event.markets,
    tokenIds: selected.map(m => m.clobTokenIds[0]).filter(Boolean),
  };
}

function extractMarketFilterInputs(filter: MarketFilter): SeriesInputs {
  const { labels, tokenIds } = collapseYesNoFilter(filter.labels, filter.tokenIds);
  return { colors: null, labels, markets: null, tokenIds };
}

function collapseYesNoFilter(labels: string[], tokenIds: string[]): { labels: string[]; tokenIds: string[] } {
  if (!hasYesAndNo(labels)) return { labels, tokenIds };
  const yesIndex = labels.findIndex(l => l?.toLowerCase() === 'yes');
  if (yesIndex < 0) return { labels, tokenIds };
  return { labels: [labels[yesIndex]], tokenIds: [tokenIds[yesIndex]] };
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

function buildSeriesArrays(history: PricePoint[]): { prices: Float32Array; timestamps: Uint32Array } {
  const len = history.length;
  const prices = new Float32Array(len);
  const timestamps = new Uint32Array(len);
  if (!len) return { prices, timestamps };

  const firstTimestamp = history[0].t;
  const lastTimestamp = history[len - 1].t;
  const isAscending = firstTimestamp <= lastTimestamp;

  for (let i = 0; i < len; i++) {
    const point = isAscending ? history[i] : history[len - 1 - i];
    prices[i] = point.p;
    timestamps[i] = point.t;
  }
  return { prices, timestamps };
}

function getMarketLabel(market: GammaMarket): string {
  if (market.outcomes.length === 2 && market.outcomes[0] === 'Yes' && market.outcomes[1] === 'No') {
    return market.groupItemTitle ?? market.question.slice(0, 27) + '…';
  }
  return market.outcomes[0] ?? 'Unknown';
}

function getOutcomeColor(label: string, index: number, enableYesNoColors: boolean): ResponseByTheme<string> {
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

function isFullGameMoneyline(m: GammaMarket): boolean {
  return m.active && !m.closed && m.clobTokenIds.length > 0 && m.sportsMarketType === POLYMARKET_SPORTS_MARKET_TYPE.MONEYLINE;
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

// ============ Fidelity ======================================================= //

enum FidelityMinutes {
  FourHours = 240,
  TwelveHours = 720,
  OneDay = 1440,
}

enum MarketSpanDays {
  Short = 60,
  Medium = 180,
}

function resolveFidelity(interval: PolymarketInterval, override: number | undefined, markets: GammaMarket[] | null): number {
  if (override !== undefined) return override;
  if (interval !== 'max') return FIDELITY_MAP[interval];

  const spanDays = getMarketSpanDays(markets);
  if (spanDays === null) return FIDELITY_MAP.max;
  if (spanDays <= MarketSpanDays.Short) return FidelityMinutes.FourHours;
  if (spanDays <= MarketSpanDays.Medium) return FidelityMinutes.TwelveHours;
  return FidelityMinutes.OneDay;
}

function getMarketSpanDays(markets: GammaMarket[] | null): number | null {
  if (!markets?.length) return null;

  let earliestStart = Number.POSITIVE_INFINITY;
  for (const m of markets) {
    if (!m.startDate) continue;
    const ts = Date.parse(m.startDate);
    if (Number.isFinite(ts) && ts < earliestStart) earliestStart = ts;
  }

  if (earliestStart === Number.POSITIVE_INFINITY) return null;
  const now = Date.now();
  return now <= earliestStart ? 0 : (now - earliestStart) / time.days(1);
}
