import React, { memo, useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';

import {
  Canvas,
  PaintStyle,
  Picture,
  Skia,
  StrokeCap,
  StrokeJoin,
  TileMode,
  type SkPaint,
  type SkPath,
  type SkPicture,
} from '@shopify/react-native-skia';
import { convertToRGBA, Easing, runOnUI, useAnimatedReaction, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

import { buildSmoothedPath, LineSmoothing } from '@/features/charts/line/LineSmoothingAlgorithms';
import { useWorkletClass } from '@/hooks/reanimated/useWorkletClass';
import { useCleanup } from '@/hooks/useCleanup';
import { createBlankPicture } from '@/worklets/skia';

type PerpSparklineData = { prices: number[]; timestamps: number[] };

type PerpMarketSparklineProps = {
  chartColor: string;
  data?: PerpSparklineData;
  height?: number;
  percentChange: number;
  width?: number;
};

type PreparedSparklineConfig = {
  blankPicture: SkPicture;
  chartPicture: SharedValue<SkPicture>;
  height: number;
  progress: SharedValue<number>;
  width: number;
};

const LINE_WIDTH = 2.25;
const FILL_TOP_ALPHA = 0.35;
const MIN_PADDING_FACTOR = 0.04;
const MAX_PADDING_FACTOR = 0.25;
const STROKE_Y_INSET = LINE_WIDTH;
const ANIMATION_DURATION_MS = 600;

class PerpSparklineRenderer {
  private readonly __workletClass = true;

  private readonly blankPicture: SkPicture;
  private readonly chartPicture: SharedValue<SkPicture>;
  private readonly fillPaint: SkPaint;
  private readonly fillPath: SkPath;
  private readonly height: number;
  private readonly pictureRecorder = Skia.PictureRecorder();
  private readonly progress: SharedValue<number>;
  private readonly strokePaint: SkPaint;
  private readonly strokePath: SkPath;
  private readonly width: number;

  private currentColor: string | null = null;
  private currentStartPoints: Float32Array | null = null;
  private currentTargetPoints: Float32Array | null = null;
  private currentShader: ReturnType<typeof Skia.Shader.MakeLinearGradient> | null = null;

  constructor({ blankPicture, chartPicture, height, progress, width }: PreparedSparklineConfig) {
    this.blankPicture = blankPicture;
    this.chartPicture = chartPicture;
    this.height = height;
    this.progress = progress;
    this.width = width;

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

  public setData(data: PerpSparklineData | undefined, lineColor: string, percentChange: number): void {
    if (!data || data.prices.length < 2) {
      this.currentStartPoints = null;
      this.currentTargetPoints = null;
      this.setBlankPicture();
      return;
    }

    if (lineColor !== this.currentColor) {
      this.strokePaint.setColor(Skia.Color(lineColor));
      this.updateFillShader(lineColor);
      this.currentColor = lineColor;
    }

    const targetPoints = this.buildTargetPoints(new Float32Array(data.prices), percentChange);
    this.currentStartPoints = this.getVisiblePoints() ?? this.buildBaselinePoints(targetPoints.length / 2);
    this.currentTargetPoints = targetPoints;
    this.progress.value = 0;
    this.buildPicture(0);
    this.progress.value = withTiming(1, {
      duration: ANIMATION_DURATION_MS,
      easing: Easing.out(Easing.cubic),
    });
  }

  public render(progress: number): void {
    if (!this.currentTargetPoints) return;
    this.buildPicture(progress);
  }

  public dispose(): void {
    this.currentShader?.dispose();
    this.currentShader = null;
    this.currentStartPoints = null;
    this.currentTargetPoints = null;
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

  private buildPicture(progress: number): void {
    const targetPoints = this.currentTargetPoints;
    if (!targetPoints) return;

    const count = targetPoints.length / 2;
    const startPoints = this.currentStartPoints ?? this.buildBaselinePoints(count);
    const points = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      const idx = i * 2;
      const startY = this.getMappedPointY(startPoints, i, count);
      const targetY = targetPoints[idx + 1];
      points[idx] = targetPoints[idx];
      points[idx + 1] = startY + (targetY - startY) * progress;
    }

    this.strokePath.reset();
    buildSmoothedPath(this.strokePath, points, count, LineSmoothing.Makima, 1);

    this.fillPath.reset();
    buildSmoothedPath(this.fillPath, points, count, LineSmoothing.Makima, 1);
    this.fillPath.lineTo(points[(count - 1) * 2], this.height);
    this.fillPath.lineTo(points[0], this.height);
    this.fillPath.close();

    const canvas = this.pictureRecorder.beginRecording({
      height: this.height,
      width: this.width,
      x: 0,
      y: 0,
    });

    this.fillPaint.setAlphaf(FILL_TOP_ALPHA);
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

  private getVisiblePoints(): Float32Array | null {
    const targetPoints = this.currentTargetPoints;
    if (!targetPoints) return null;

    const count = targetPoints.length / 2;
    const startPoints = this.currentStartPoints ?? this.buildBaselinePoints(count);
    const progress = this.progress.value;
    const points = new Float32Array(targetPoints.length);

    for (let i = 0; i < count; i++) {
      const idx = i * 2;
      const startY = this.getMappedPointY(startPoints, i, count);
      const targetY = targetPoints[idx + 1];
      points[idx] = targetPoints[idx];
      points[idx + 1] = startY + (targetY - startY) * progress;
    }

    return points;
  }

  private buildBaselinePoints(count: number): Float32Array {
    const baselineY = this.getBaselineY();
    const stride = count > 1 ? this.width / (count - 1) : 0;
    const points = new Float32Array(count * 2);

    for (let i = 0; i < count; i++) {
      const idx = i * 2;
      points[idx] = i * stride;
      points[idx + 1] = baselineY;
    }

    return points;
  }

  private buildTargetPoints(prices: Float32Array, percentChange: number): Float32Array {
    const count = prices.length;
    const { minPrice, maxPrice } = this.computeBounds(prices, percentChange);
    const range = maxPrice - minPrice || 1;
    const plotHeight = this.getPlotHeight();
    const stride = count > 1 ? this.width / (count - 1) : 0;
    const points = new Float32Array(count * 2);

    for (let i = 0; i < count; i++) {
      const idx = i * 2;
      points[idx] = i * stride;
      points[idx + 1] = STROKE_Y_INSET + plotHeight - ((prices[i] - minPrice) / range) * plotHeight;
    }

    return points;
  }

  private getMappedPointY(points: Float32Array, targetIndex: number, targetCount: number): number {
    const sourceCount = points.length / 2;
    if (sourceCount === targetCount) return points[targetIndex * 2 + 1];

    const mappedIndex = targetCount > 1 ? Math.round((targetIndex / (targetCount - 1)) * (sourceCount - 1)) : 0;
    return points[mappedIndex * 2 + 1];
  }

  private getBaselineY(): number {
    return STROKE_Y_INSET + this.getPlotHeight() / 2;
  }

  private getPlotHeight(): number {
    return this.height - STROKE_Y_INSET * 2;
  }

  private computeBounds(prices: Float32Array, percentChange: number): { maxPrice: number; minPrice: number } {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;

    for (let i = 0; i < prices.length; i++) {
      const value = prices[i];
      if (value < min) min = value;
      if (value > max) max = value;
    }

    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return { maxPrice: 1, minPrice: 0 };
    }

    const range = max - min;
    if (range === 0) {
      const fallback = Math.max(Math.abs(max) * 0.02, 1);
      return { maxPrice: max + fallback, minPrice: min - fallback };
    }

    const pct = Math.abs(percentChange);
    const paddingFactor = Math.min(Math.max(pct / 100, MIN_PADDING_FACTOR), MAX_PADDING_FACTOR);
    const padding = range * paddingFactor;

    return {
      maxPrice: max + padding,
      minPrice: min - padding,
    };
  }
}

export const PerpMarketSparkline = memo(function PerpMarketSparkline({
  chartColor,
  data,
  height = 42,
  percentChange,
  width = 44,
}: PerpMarketSparklineProps) {
  const initialPicture = useMemo(() => createBlankPicture(width, height), [height, width]);
  const chartPicture = useSharedValue(initialPicture);
  const progress = useSharedValue(1);
  const sparkline = useWorkletClass(
    () => ({
      blankPicture: initialPicture,
      chartPicture,
      height,
      progress,
      width,
    }),
    config => {
      'worklet';
      return new PerpSparklineRenderer(config);
    }
  );

  useEffect(() => {
    runOnUI((nextData: PerpSparklineData | undefined, nextColor: string, nextPercentChange: number) => {
      sparkline.value?.setData(nextData, nextColor, nextPercentChange);
    })(data, chartColor, percentChange);
  }, [chartColor, data, percentChange, sparkline]);

  useAnimatedReaction(
    () => progress.value,
    currentProgress => {
      sparkline.value?.render(currentProgress);
    }
  );

  useCleanup(() => {
    initialPicture.dispose();
    runOnUI(() => {
      sparkline.value?.dispose?.();
      sparkline.value = undefined;
    })();
  }, [initialPicture, sparkline]);

  return (
    <Canvas style={[styles.canvas, { height, width }]}>
      <Picture picture={chartPicture} />
    </Canvas>
  );
});

const styles = StyleSheet.create({
  canvas: {
    overflow: 'visible',
  },
});
