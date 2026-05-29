import {
  PaintStyle,
  Skia,
  StrokeCap,
  StrokeJoin,
  TileMode,
  type SkPaint,
  type SkPath,
  type SkPicture,
  type SkPictureRecorder,
  type SkShader,
} from '@shopify/react-native-skia';
import { convertToRGBA, type SharedValue } from 'react-native-reanimated';

import { type CompactLineChartData } from '@/features/charts/line/compact/types';
import { buildSmoothedPath, LineSmoothing } from '@/features/charts/line/LineSmoothingAlgorithms';

// ============ Types ========================================================== //

type CompactLineChartRendererConfig = {
  blankPicture: SkPicture;
  chartPicture: SharedValue<SkPicture>;
  /** Desired line width from the leftmost point to the rightmost. */
  contentWidth: number;
  height: number;
};

// ============ Constants ====================================================== //

const LINE_WIDTH = 2.25;

/** Extra space reserved for stroke caps to prevent clipping. */
export const COMPACT_LINE_CHART_HORIZONTAL_OVERDRAW = LINE_WIDTH;

const GRADIENT_FILL_TOP_ALPHA = 0.35;
const FLAT_PRICE_PADDING_FACTOR = 0.02;
const PRICE_RANGE_PADDING_FACTOR = 0.08;

function getCompactLineChartGeometry(contentWidth: number, height: number): { contentWidth: number; plotHeight: number } {
  'worklet';

  return {
    contentWidth,
    plotHeight: height - LINE_WIDTH * 2,
  };
}

function projectCompactLineChartPoint(
  startTimestamp: number,
  endTimestamp: number,
  timestamp: number,
  price: number,
  {
    geometry,
    maxPrice,
    minPrice,
  }: {
    geometry: { contentWidth: number; plotHeight: number };
    maxPrice: number;
    minPrice: number;
  }
): { x: number; y: number } {
  'worklet';

  const timeRange = endTimestamp - startTimestamp || 1;
  const priceRange = maxPrice - minPrice || 1;

  return {
    x: COMPACT_LINE_CHART_HORIZONTAL_OVERDRAW + ((timestamp - startTimestamp) / timeRange) * geometry.contentWidth,
    y: LINE_WIDTH + geometry.plotHeight - ((price - minPrice) / priceRange) * geometry.plotHeight,
  };
}

function computeCompactLineChartBounds(prices: Float32Array, count: number): { maxPrice: number; minPrice: number } {
  'worklet';

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < count; i++) {
    const value = prices[i];
    if (value < min) min = value;
    if (value > max) max = value;
  }

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { maxPrice: 1, minPrice: 0 };
  }

  const range = max - min;
  if (range === 0) {
    const fallback = Math.max(Math.abs(max) * FLAT_PRICE_PADDING_FACTOR, Number.EPSILON);
    return { maxPrice: max + fallback, minPrice: min - fallback };
  }

  const padding = range * PRICE_RANGE_PADDING_FACTOR;
  return {
    maxPrice: max + padding,
    minPrice: min - padding,
  };
}

export function getCompactLineChartEndPoint(
  data: CompactLineChartData | undefined,
  contentWidth: number,
  height: number
): { x: number; y: number } | undefined {
  'worklet';

  const pointCount = data ? Math.min(data.prices.length, data.timestamps.length) : 0;
  if (!data || pointCount < 2) return undefined;

  const { minPrice, maxPrice } = computeCompactLineChartBounds(data.prices, pointCount);
  const geometry = getCompactLineChartGeometry(contentWidth, height);
  return projectCompactLineChartPoint(
    data.timestamps[0],
    data.timestamps[pointCount - 1],
    data.timestamps[pointCount - 1],
    data.prices[pointCount - 1],
    {
      geometry,
      maxPrice,
      minPrice,
    }
  );
}

// ============ Renderer ======================================================= //

/**
 * Worklet class that draws compact line chart previews
 * onto a Skia canvas. Must be used from the UI thread.
 */
export class CompactLineChartRenderer {
  private readonly __workletClass = true;

  private readonly blankPicture: SkPicture;
  private readonly chartPicture: SharedValue<SkPicture>;
  private readonly contentWidth: number;
  private readonly fillPaint: SkPaint;
  private readonly fillPath: SkPath;
  private readonly height: number;
  private readonly pictureRecorder: SkPictureRecorder;
  private readonly surfaceWidth: number;
  private readonly strokePaint: SkPaint;
  private readonly strokePath: SkPath;

  private currentColor: string | null = null;
  private currentData: CompactLineChartData | undefined;
  private currentShader: SkShader | null = null;

  constructor({ blankPicture, chartPicture, contentWidth, height }: CompactLineChartRendererConfig) {
    this.blankPicture = blankPicture;
    this.chartPicture = chartPicture;
    this.contentWidth = contentWidth;
    this.height = height;
    this.pictureRecorder = Skia.PictureRecorder();
    this.surfaceWidth = contentWidth + COMPACT_LINE_CHART_HORIZONTAL_OVERDRAW * 2;

    this.strokePath = Skia.Path.Make();
    this.fillPath = Skia.Path.Make();

    this.strokePaint = Skia.Paint();
    this.strokePaint.setAntiAlias(true);
    this.strokePaint.setDither(true);
    this.strokePaint.setStyle(PaintStyle.Stroke);
    this.strokePaint.setStrokeWidth(LINE_WIDTH);
    this.strokePaint.setStrokeCap(StrokeCap.Round);
    this.strokePaint.setStrokeJoin(StrokeJoin.Round);

    this.fillPaint = Skia.Paint();
    this.fillPaint.setAntiAlias(true);
    this.fillPaint.setDither(true);
    this.fillPaint.setStyle(PaintStyle.Fill);
  }

  public setData(data: CompactLineChartData | undefined, lineColor: string): void {
    this.currentData = data;

    const pointCount = data ? Math.min(data.prices.length, data.timestamps.length) : 0;
    if (!data || pointCount < 2) {
      this.setBlankPicture();
      return;
    }

    if (lineColor !== this.currentColor) {
      this.setColor(lineColor);
    }

    this.buildPicture(this.buildTargetPoints(data, pointCount), pointCount);
  }

  public recolor(lineColor: string): void {
    if (lineColor === this.currentColor) return;
    this.setData(this.currentData, lineColor);
  }

  public dispose(): void {
    this.fillPaint.setShader(null);
    this.currentShader?.dispose();
    this.currentShader = null;
    this.strokePath.dispose();
    this.fillPath.dispose();
    this.strokePaint.dispose();
    this.fillPaint.dispose();
    this.pictureRecorder.dispose();

    const currentPicture = this.chartPicture.value;
    if (currentPicture !== this.blankPicture) {
      currentPicture.dispose();
    }
  }

  private setColor(color: string): void {
    this.strokePaint.setColor(Skia.Color(color));
    this.updateFillShader(color);
    this.currentColor = color;
  }

  private updateFillShader(color: string): void {
    const [r, g, b] = convertToRGBA(color);
    const rInt = Math.round(r * 255);
    const gInt = Math.round(g * 255);
    const bInt = Math.round(b * 255);
    const topColor = Skia.Color(`rgba(${rInt}, ${gInt}, ${bInt}, 1)`);
    const bottomColor = Skia.Color(`rgba(${rInt}, ${gInt}, ${bInt}, 0)`);

    const previous = this.currentShader;
    const shader = Skia.Shader.MakeLinearGradient(
      { x: 0, y: 0 },
      { x: 0, y: this.height },
      [topColor, bottomColor],
      [0, 1],
      TileMode.Clamp
    );
    this.fillPaint.setShader(shader);
    this.currentShader = shader;
    previous?.dispose();
  }

  private buildPicture(points: Float32Array, count: number): void {
    this.strokePath.reset();
    buildSmoothedPath(this.strokePath, points, count, LineSmoothing.Makima, 1);

    this.fillPath.reset();
    buildSmoothedPath(this.fillPath, points, count, LineSmoothing.Makima, 1);
    this.fillPath.lineTo(points[(count - 1) * 2], this.height);
    this.fillPath.lineTo(points[0], this.height);
    this.fillPath.close();

    const canvas = this.pictureRecorder.beginRecording({
      height: this.height,
      width: this.surfaceWidth,
      x: 0,
      y: 0,
    });

    this.fillPaint.setAlphaf(GRADIENT_FILL_TOP_ALPHA);
    canvas.drawPath(this.fillPath, this.fillPaint);
    canvas.drawPath(this.strokePath, this.strokePaint);

    const oldPicture = this.chartPicture.value;
    this.chartPicture.value = this.pictureRecorder.finishRecordingAsPicture();
    if (oldPicture !== this.blankPicture) {
      oldPicture.dispose();
    }
  }

  private setBlankPicture(): void {
    const oldPicture = this.chartPicture.value;
    this.chartPicture.value = this.blankPicture;
    if (oldPicture !== this.blankPicture) {
      oldPicture.dispose();
    }
  }

  private buildTargetPoints(data: CompactLineChartData, count: number): Float32Array {
    const startTs = data.timestamps[0];
    const endTs = data.timestamps[count - 1];
    const { minPrice, maxPrice } = computeCompactLineChartBounds(data.prices, count);
    const geometry = getCompactLineChartGeometry(this.contentWidth, this.height);
    const points = new Float32Array(count * 2);

    for (let i = 0; i < count; i++) {
      const idx = i * 2;
      const point = projectCompactLineChartPoint(startTs, endTs, data.timestamps[i], data.prices[i], {
        geometry,
        maxPrice,
        minPrice,
      });
      points[idx] = point.x;
      points[idx + 1] = point.y;
    }

    return points;
  }
}
