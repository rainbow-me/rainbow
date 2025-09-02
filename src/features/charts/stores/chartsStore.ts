import { CANDLESTICK_CHARTS, useExperimentalFlag } from '@/config';
import { useRemoteConfig } from '@/model/remoteConfig';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { createStoreActions } from '@/state/internal/utils/createStoreActions';
import { CandleResolution, ChartType, LineChartTimePeriod, Token } from '../types';

// ============ Charts Store =================================================== //

export type ChartsState = {
  candleResolution: CandleResolution;
  chartType: ChartType;
  lineChartTimePeriod: LineChartTimePeriod;
  /**
   * A signal that is incremented when the user presses the already-selected
   * candle resolution button, used to snap the chart back to the current candle.
   */
  snapSignal: number;
  token: Token | null;
  resetChartsState: () => void;
  setCandleResolution: (candleResolution: CandleResolution) => void;
  setChartType: (chartType: ChartType) => void;
  setLineChartTimePeriod: (lineChartTimePeriod: LineChartTimePeriod) => void;
  setToken: (token: Token) => void;
  toggleChartType: () => ChartType;
};

export const useChartsStore = createRainbowStore<ChartsState>(
  (set, get) => ({
    candleResolution: CandleResolution.H1,
    chartType: ChartType.Candlestick,
    lineChartTimePeriod: LineChartTimePeriod.D1,
    snapSignal: 0,
    token: null,

    resetChartsState: () =>
      set({
        lineChartTimePeriod: LineChartTimePeriod.D1,
        token: null,
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

    setToken: token =>
      set(state => {
        if (areTokensEqual(state.token, token)) return state;
        return { token };
      }),

    toggleChartType: () => {
      set(state => ({
        chartType: state.chartType === ChartType.Candlestick ? ChartType.Line : ChartType.Candlestick,
      }));
      return get().chartType;
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

// ============ Store Actions and Hooks ======================================== //

export const chartsActions = createStoreActions(useChartsStore);

export function useChartType(): ChartType {
  const { candlestick_charts_enabled } = useRemoteConfig('candlestick_charts_enabled');
  const enableCandlestickCharts = useExperimentalFlag(CANDLESTICK_CHARTS) || candlestick_charts_enabled;
  const chartType = useChartsStore(state => state.chartType);
  return enableCandlestickCharts ? chartType : ChartType.Line;
}

// ============ Utilities ====================================================== //

/**
 * Compares two token objects for equality.
 */
function areTokensEqual(previousToken: Token | null, newToken: Token | null): boolean {
  if (!previousToken && !newToken) return true;
  if (!previousToken || !newToken) return false;
  if (typeof previousToken === 'string' || typeof newToken === 'string') return previousToken === newToken;
  return previousToken.address === newToken.address && previousToken.chainId === newToken.chainId;
}
