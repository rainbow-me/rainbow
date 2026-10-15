import { createBaseStore, createStoreActions } from '@storesjs/stores';

import { isHyperliquidToken } from '@/features/charts/utils';
import { CANDLESTICK_CHARTS } from '@/features/config/constants/experimental';
import { useExperimentalFlag } from '@/features/config/hooks/experimentalHooks';
import { useRemoteConfig } from '@/features/config/stores/remoteConfig';
import { useViewedTokenStore } from '@/features/token/data/stores/viewedTokenStore';

import { CandleResolution, ChartType, LineChartTimePeriod, type Token } from '../types';

// ============ Charts Store =================================================== //

export type ChartsState = {
  candleResolution: CandleResolution;
  chartType: ChartType;
  enablePerpsIndicators: boolean;
  lineChartTimePeriod: LineChartTimePeriod;
  /**
   * A signal that is incremented when the user presses the already-selected
   * candle resolution button, used to snap the chart back to the current candle.
   */
  snapSignal: number;
  getChartType: () => ChartType;
  resetChartsState: () => void;
  setCandleResolution: (candleResolution: CandleResolution) => void;
  setChartType: (chartType: ChartType) => void;
  setLineChartTimePeriod: (lineChartTimePeriod: LineChartTimePeriod) => void;
  toggleChartType: () => ChartType;
  togglePerpsIndicators: () => boolean;
};

export const useChartsStore = createBaseStore<ChartsState>(
  (set, get) => ({
    candleResolution: CandleResolution.H1,
    chartType: ChartType.Candlestick,
    enablePerpsIndicators: true,
    lineChartTimePeriod: LineChartTimePeriod.D1,
    snapSignal: 0,

    getChartType: () => resolveChartType(get().chartType, useViewedTokenStore.getState().token),

    resetChartsState: () =>
      set(state => {
        if (state.lineChartTimePeriod === LineChartTimePeriod.D1) return state;
        return { lineChartTimePeriod: LineChartTimePeriod.D1 };
      }),

    setCandleResolution: candleResolution =>
      set(state => {
        if (state.candleResolution === candleResolution) return { snapSignal: state.snapSignal + 1 };
        return { candleResolution };
      }),

    setChartType: chartType =>
      set(state => {
        if (state.chartType === chartType) return state;
        return { chartType };
      }),

    setLineChartTimePeriod: lineChartTimePeriod =>
      set(state => {
        if (state.lineChartTimePeriod === lineChartTimePeriod) return state;
        return { lineChartTimePeriod };
      }),

    toggleChartType: () => {
      set(state => ({
        chartType: state.chartType === ChartType.Candlestick ? ChartType.Line : ChartType.Candlestick,
      }));
      return get().chartType;
    },

    togglePerpsIndicators: () => {
      set(state => ({ enablePerpsIndicators: !state.enablePerpsIndicators }));
      return get().enablePerpsIndicators;
    },
  }),

  {
    partialize: state => ({
      candleResolution: state.candleResolution,
      chartType: state.chartType,
    }),
    storageKey: 'chartSettingsStore',
  }
);

// ============ Store Actions ================================================== //

export const chartsActions = createStoreActions(useChartsStore);

// ============ Hooks ========================================================== //

export function useChartType(): ChartType {
  const { candlestick_charts_enabled } = useRemoteConfig('candlestick_charts_enabled');
  const enableCandlestickCharts = useExperimentalFlag(CANDLESTICK_CHARTS) || candlestick_charts_enabled;
  const chartType = useChartsStore(state => state.chartType);
  const token = useViewedTokenStore(state => state.token);
  return enableCandlestickCharts ? resolveChartType(chartType, token) : ChartType.Line;
}

// ============ Utilities ====================================================== //

export function resolveChartType(chartType: ChartType, token: Token | null): ChartType {
  return isHyperliquidToken(token) ? ChartType.Candlestick : chartType;
}
