import { PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { ResponseByTheme } from '@/__swaps__/utils/swaps';
import { MAX_POLYMARKET_SERIES, selectTopMarketsForChart } from '../stores/polymarketChartStore';
import { DEFAULT_SERIES_PALETTE, SERIES_PALETTES, SeriesPaletteColors } from '../types';

const FALLBACK_COLORS: SeriesPaletteColors = SERIES_PALETTES[DEFAULT_SERIES_PALETTE];

/**
 * Builds a fixed-length color array for Polymarket charts, preferring
 * market-provided colors for top markets and falling back to the default
 * palette for remaining slots.
 */
export function getChartLineColors(markets?: PolymarketMarket[]): SeriesPaletteColors | undefined {
  if (!markets?.length) return undefined;
  const selected = selectTopMarketsForChart(markets, MAX_POLYMARKET_SERIES);
  const topMarkets = selected.length > 3 ? selected.slice(0, 3) : selected;
  return buildFixedLengthColors(topMarkets.map(m => m.color));
}

function buildFixedLengthColors(customColors: ResponseByTheme<string>[]): SeriesPaletteColors {
  const c = FALLBACK_COLORS;
  const o = customColors;
  return [o[0] ?? c[0], o[1] ?? c[1], o[2] ?? c[2]];
}
