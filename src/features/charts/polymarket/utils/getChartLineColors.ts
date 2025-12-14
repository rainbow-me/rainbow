import { PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { DEFAULT_SERIES_PALETTE, SERIES_PALETTES } from '../types';
import { MAX_POLYMARKET_SERIES, selectTopMarketsForChart } from '../stores/polymarketChartStore';

const FALLBACK_COLORS = SERIES_PALETTES[DEFAULT_SERIES_PALETTE];

/**
 * Builds a fixed-length color array for Polymarket charts, preferring
 * market-provided colors for top markets and falling back to the default
 * palette for remaining slots.
 */
export function getChartLineColors(markets?: PolymarketMarket[]): readonly [string, string, string, string, string] | undefined {
  if (!markets?.length) return undefined;
  const selected = selectTopMarketsForChart(markets, MAX_POLYMARKET_SERIES);
  const topMarkets = selected.length > 5 ? selected.slice(0, 5) : selected;
  return buildFixedLengthColors(topMarkets.map(m => m.color));
}

function buildFixedLengthColors(customColors: string[]): [string, string, string, string, string] {
  const c = FALLBACK_COLORS;
  const o = customColors;
  return [o[0] ?? c[0], o[1] ?? c[1], o[2] ?? c[2], o[3] ?? c[3], o[4] ?? c[4]];
}
