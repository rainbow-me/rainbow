import { SkCanvas, SkPath, Skia } from '@shopify/react-native-skia';
import { ResponseByTheme } from '@/__swaps__/utils/swaps';
import { InteractionConfig, LineEffectsConfig, LineSeries, LineSeriesConfig, MinMax } from './LineSeries';
import { LineSmoothing } from './LineSmoothingAlgorithms';
import { DrawParams } from './types';

export type SeriesDataInput = {
  color: ResponseByTheme<string>;
  key: string;
  label: string;
  prices: Float32Array;
  /** The smoothing algorithm to use for this series */
  smoothingMode?: LineSmoothing;
  /** Smoothing tension [0, 1] where 0 = linear, 1 = maximum smoothing */
  smoothingTension?: number;
  timestamps: Float32Array;
};

type SeriesValue = {
  key: string;
  label: string;
  price: number;
  timestamp: number;
};

export class LineSeriesBuilder {
  private readonly __workletClass = true;

  private readonly drawPath: SkPath;
  private highlightedKey: string | null = null;
  private readonly lineWidth: number;
  private series: LineSeries[] = [];
  private previousSeriesKeys: string[] = [];

  constructor(lineWidth = 2) {
    this.drawPath = Skia.Path.Make();
    this.lineWidth = lineWidth;
  }

  public getSeriesCount(): number {
    return this.series.length;
  }

  public getMaxLength(): number {
    let max = 0;
    for (const s of this.series) {
      const len = s.getLength();
      if (len > max) max = len;
    }
    return max;
  }

  public getSeriesKeys(): string[] {
    return this.series.map(s => s.key);
  }

  public getSeries(key: string): LineSeries | undefined {
    return this.series.find(s => s.key === key);
  }

  /**
   * Captures the current visual state as animation starting point.
   * Supports smooth interruption - if called mid-animation, captures the
   * interpolated visual at current progress.
   */
  public captureStartState(progress: number, params: DrawParams): void {
    for (const s of this.series) {
      s.captureStartState(progress, params);
    }
    this.previousSeriesKeys = this.series.map(s => s.key);
  }

  /**
   * Sets the animation target state with FINAL bounds (not interpolated).
   * Must be called after setSeriesData updates the prices.
   */
  public setTargetState(params: DrawParams): void {
    for (const s of this.series) {
      s.setTargetState(params);
    }
  }

  public setSeriesData(seriesData: SeriesDataInput[], isDarkMode: boolean): void {
    const newKeys = seriesData.map(d => d.key);
    const keysMatch = this.previousSeriesKeys.length === newKeys.length && this.previousSeriesKeys.every((k, i) => k === newKeys[i]);

    if (keysMatch && this.series.length === seriesData.length) {
      for (let i = 0; i < seriesData.length; i++) {
        const data = seriesData[i];
        const existing = this.series[i];
        existing.setData(data.prices, data.timestamps);
      }
    } else {
      for (const s of this.series) {
        s.dispose();
      }

      this.series = seriesData.map(data => {
        const config: LineSeriesConfig = {
          color: data.color,
          highlighted: data.key === this.highlightedKey,
          isDarkMode,
          key: data.key,
          label: data.label,
          lineWidth: this.lineWidth,
          smoothingMode: data.smoothingMode,
          smoothingTension: data.smoothingTension,
        };

        const series = new LineSeries(config);
        series.setData(data.prices, data.timestamps);
        return series;
      });
    }
  }

  public clearAnimationState(): void {
    for (const s of this.series) {
      s.clearAnimationState();
    }
    this.previousSeriesKeys = [];
  }

  public clearSeries(): void {
    for (const s of this.series) {
      s.dispose();
    }
    this.series = [];
    this.highlightedKey = null;
    this.previousSeriesKeys = [];
  }

  public getMinMaxForRange(endIndex: number, startIndex: number): MinMax | null {
    if (!this.series.length) return null;

    let globalMax = -Infinity;
    let globalMin = Infinity;

    for (const s of this.series) {
      const { max, min } = s.getMinMaxInRange(endIndex, startIndex);
      if (min < globalMin) globalMin = min;
      if (max > globalMax) globalMax = max;
    }

    if (globalMin === Infinity || globalMax === -Infinity) return null;

    return { max: globalMax, min: globalMin };
  }

  public drawAll(
    canvas: SkCanvas,
    params: DrawParams,
    effects: LineEffectsConfig | undefined,
    progress = 1,
    drawProgress = 1,
    entranceYOffset = 0
  ): void {
    for (const s of this.series) {
      if (s.key !== this.highlightedKey) {
        s.draw(canvas, params, this.drawPath, effects, progress, drawProgress, entranceYOffset);
      }
    }

    if (this.highlightedKey) {
      const highlighted = this.series.find(s => s.key === this.highlightedKey);
      if (highlighted) {
        highlighted.draw(canvas, params, this.drawPath, effects, progress, drawProgress, entranceYOffset);
      }
    }
  }

  public drawAllWithInteraction(
    canvas: SkCanvas,
    params: DrawParams,
    effects: LineEffectsConfig | undefined,
    interaction: InteractionConfig,
    progress = 1,
    entranceYOffset = 0
  ): void {
    for (const s of this.series) {
      if (s.key !== this.highlightedKey) {
        s.drawLinesWithInteraction(canvas, params, this.drawPath, effects, interaction, progress, entranceYOffset);
      }
    }
    if (this.highlightedKey) {
      const highlighted = this.series.find(s => s.key === this.highlightedKey);
      highlighted?.drawLinesWithInteraction(canvas, params, this.drawPath, effects, interaction, progress, entranceYOffset);
    }

    for (const s of this.series) {
      if (s.key !== this.highlightedKey) {
        s.drawCirclesWithInteraction(canvas, params, this.drawPath, effects, interaction, progress, entranceYOffset);
      }
    }
    if (this.highlightedKey) {
      const highlighted = this.series.find(s => s.key === this.highlightedKey);
      highlighted?.drawCirclesWithInteraction(canvas, params, this.drawPath, effects, interaction, progress, entranceYOffset);
    }
  }

  public setHighlightedSeries(key: string | null): void {
    if (this.highlightedKey === key) return;

    this.highlightedKey = key;

    // Apply dimming to non-highlighted series, restore opacity to highlighted
    for (const s of this.series) {
      const isHighlighted = s.key === key;
      s.setHighlighted(isHighlighted);

      if (key === null) {
        // No highlight - all series at full opacity
        s.setOpacity(1);
      } else {
        // Dim non-highlighted series
        s.setOpacity(isHighlighted ? 1 : 0.35);
      }
    }
  }

  public getHighlightedKey(): string | null {
    return this.highlightedKey;
  }

  public getValuesAtIndex(index: number): SeriesValue[] {
    const values: SeriesValue[] = [];

    for (const s of this.series) {
      if (index >= 0 && index < s.getLength()) {
        values.push({
          key: s.key,
          label: s.label,
          price: s.getPrice(index),
          timestamp: s.getTimestamp(index),
        });
      }
    }

    return values;
  }

  public getValuesAtTimestamp(timestamp: number): SeriesValue[] {
    const values: SeriesValue[] = [];

    for (const s of this.series) {
      if (!s.getLength()) continue;
      values.push({
        key: s.key,
        label: s.label,
        price: s.getPriceAtTimestamp(timestamp),
        timestamp,
      });
    }

    return values;
  }

  public getNearestIndex(offsetX: number, stride: number, x: number): number {
    if (!this.series.length) return -1;

    const length = this.getMaxLength();
    if (!length) return -1;
    if (length === 1) return 0;

    const domainWidth = stride * (length - 1);
    if (domainWidth <= 0) return 0;

    const normalized = (x - offsetX) / domainWidth;
    const rawIndex = Math.round(normalized * (length - 1));
    return Math.max(0, Math.min(length - 1, rawIndex));
  }

  public dispose(): void {
    for (const s of this.series) {
      s.dispose();
    }
    this.series = [];
    this.drawPath.dispose();
    this.highlightedKey = null;
    this.previousSeriesKeys = [];
  }
}
