import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { type MarketFilter, type PolymarketInterval } from '../types';
import { createStoreActions } from '@/state/internal/utils/createStoreActions';

// ============ Types ========================================================== //

export type PolymarketStoreState = {
  chartInterval: PolymarketInterval;
  highlightedSeriesId: string | null;
  selectedEventSlug: string | null;
  selectedMarketFilter: MarketFilter | null;
  reset: () => void;
  setChartInterval: (interval: PolymarketInterval) => void;
  setHighlightedSeriesId: (id: string | null) => void;
  setSelectedEventSlug: (slug: string | null) => void;
  setSelectedMarketFilter: (filter: MarketFilter | null) => void;
};

// ============ Store ========================================================== //

export const usePolymarketStore = createRainbowStore<PolymarketStoreState>(
  set => ({
    chartInterval: '1d',
    highlightedSeriesId: null,
    selectedEventSlug: null,
    selectedMarketFilter: null,

    reset: () => {
      set({
        chartInterval: '1d',
        highlightedSeriesId: null,
        selectedEventSlug: null,
        selectedMarketFilter: null,
      });
    },

    setChartInterval: (interval: PolymarketInterval) => {
      set(state => {
        if (state.chartInterval === interval) return state;
        return { chartInterval: interval };
      });
    },

    setHighlightedSeriesId: (id: string | null) => {
      set(state => {
        if (state.highlightedSeriesId === id) return state;
        return { highlightedSeriesId: id };
      });
    },

    setSelectedEventSlug: (slug: string | null) => {
      set(state => {
        if (state.selectedEventSlug === slug) return state;
        return { selectedEventSlug: slug };
      });
    },

    setSelectedMarketFilter: (filter: MarketFilter | null) => {
      set(state => {
        if (areMarketFiltersEqual(state.selectedMarketFilter, filter)) return state;
        return { selectedMarketFilter: filter };
      });
    },
  }),

  {
    partialize: state => ({ chartInterval: state.chartInterval }),
    storageKey: 'polymarketStore',
  }
);

export const polymarketChartsActions = createStoreActions(usePolymarketStore);

// ============ Helpers ======================================================== //

function areMarketFiltersEqual(a: MarketFilter | null, b: MarketFilter | null): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  const { tokenIds: aIds, labels: aLabels } = a;
  const { tokenIds: bIds, labels: bLabels } = b;
  if (aIds.length !== bIds.length || aLabels.length !== bLabels.length) return false;
  for (let i = 0; i < aIds.length; i++) {
    if (aIds[i] !== bIds[i]) return false;
  }
  for (let i = 0; i < aLabels.length; i++) {
    if (aLabels[i] !== bLabels[i]) return false;
  }
  return true;
}
