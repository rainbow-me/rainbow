import { ChartType, ChartTypes } from '@/components/value-chart/Chart';
import { createRainbowStore } from '@/state/internal/createRainbowStore';

type AppSettingsStore = {
  chartType: ChartType;
  toggleChartType: () => void;
};

export const useAppSettingsStore = createRainbowStore<AppSettingsStore>(
  set => ({
    chartType: ChartTypes.LINE,

    toggleChartType: () => {
      set(state => ({ chartType: state.chartType === ChartTypes.LINE ? ChartTypes.CANDLESTICK : ChartTypes.LINE }));
    },
  }),
  {
    storageKey: 'appSettings',
    version: 1,
  }
);
