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
