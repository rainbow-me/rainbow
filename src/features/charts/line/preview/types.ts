/**
 * Price points drawn by a compact line chart.
 */
export type LineChartPreviewData = {
  prices: Float32Array;
  timestamps: Uint32Array;
};

/**
 * Store shape consumed by `<LineChartPreview />`.
 */
export type LineChartPreviewSource = {
  getChartData: (id: string) => LineChartPreviewData | undefined;
};
