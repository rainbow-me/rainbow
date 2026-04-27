import { type BaseStore } from '@storesjs/stores';

import { type SharedOrDerivedValue } from '@/types/reanimated';

/**
 * Price points drawn by a compact line chart.
 */
export type CompactLineChartData = {
  prices: Float32Array;
  timestamps: Uint32Array;
};

/**
 * Store shape consumed by `<SparklineChart />`.
 */
export type LineChartDataStore = {
  getChartData: (id: string) => CompactLineChartData | undefined;
};

/**
 * Props for `<SparklineChart />`. `<LiveSparklinePointer />` reuses the same shape
 * minus `livePointer` (`Omit<SparklineChartProps<S>, 'livePointer'>`).
 *
 * A string `color` paints once; a shared/derived `color` additionally recolors live.
 */
export type SparklineChartProps<S extends LineChartDataStore> = {
  chartId: string;
  color: string | SharedOrDerivedValue<string>;
  height: number;
  livePointer?: boolean;
  store: BaseStore<S>;
  width: number;
};
