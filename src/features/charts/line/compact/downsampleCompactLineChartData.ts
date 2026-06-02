import { type CompactLineChartData } from '@/features/charts/line/compact/types';

/**
 * Downsamples compact line chart data to at most `maxPoints` points using fixed-bucket
 * averaging. The exact first and last source points are always preserved, so the rendered
 * line endpoint — and any live pointer drawn there — stays accurate.
 *
 * Applied once at the data origin (see `tokenLineChartsStore`); the view layer renders
 * whatever it receives.
 */
export function downsampleCompactLineChartData(
  data: CompactLineChartData | undefined,
  maxPoints: number
): CompactLineChartData | undefined {
  if (!data || maxPoints <= 0) return data;

  const pointCount = Math.min(data.prices.length, data.timestamps.length);
  if (pointCount <= maxPoints) return data;

  if (maxPoints === 1) {
    return {
      prices: data.prices.slice(pointCount - 1),
      timestamps: data.timestamps.slice(pointCount - 1),
    };
  }

  const prices = new Float32Array(maxPoints);
  const timestamps = new Uint32Array(maxPoints);
  const sourceLastIndex = pointCount - 1;
  const targetLastIndex = maxPoints - 1;

  prices[0] = data.prices[0];
  timestamps[0] = data.timestamps[0];
  prices[targetLastIndex] = data.prices[sourceLastIndex];
  timestamps[targetLastIndex] = data.timestamps[sourceLastIndex];

  for (let targetIndex = 1; targetIndex < targetLastIndex; targetIndex++) {
    const bucketStart = Math.floor((targetIndex * sourceLastIndex) / targetLastIndex);
    const bucketEnd = Math.max(bucketStart + 1, Math.floor(((targetIndex + 1) * sourceLastIndex) / targetLastIndex));
    let priceTotal = 0;
    let timestampTotal = 0;
    let bucketSize = 0;

    for (let sourceIndex = bucketStart; sourceIndex <= bucketEnd && sourceIndex < sourceLastIndex; sourceIndex++) {
      priceTotal += data.prices[sourceIndex];
      timestampTotal += data.timestamps[sourceIndex];
      bucketSize += 1;
    }

    if (bucketSize === 0) {
      const fallbackIndex = Math.round((targetIndex * sourceLastIndex) / targetLastIndex);
      prices[targetIndex] = data.prices[fallbackIndex];
      timestamps[targetIndex] = data.timestamps[fallbackIndex];
    } else {
      prices[targetIndex] = priceTotal / bucketSize;
      timestamps[targetIndex] = Math.round(timestampTotal / bucketSize);
    }
  }

  return { prices, timestamps };
}
