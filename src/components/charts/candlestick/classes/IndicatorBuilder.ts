import { PaintStyle, SkCanvas, SkColor, SkPaint, SkPath, Skia, StrokeCap, StrokeJoin } from '@shopify/react-native-skia';
import { Bar } from '@/components/charts/candlestick/types';

export type IndicatorKey = 'EMA9' | 'EMA20' | 'EMA50';

export type DrawParams = {
  candleRegionHeight: number;
  candleWidth: number;
  endIndex: number;
  maxPrice: number;
  minPrice: number;
  offsetX: number;
  startIndex: number;
  stride: number;
};

export interface IndicatorPlugin<K extends IndicatorKey> {
  /** The unique indicator identifier, e.g. 'EMA9' */
  readonly key: K;

  /**
   * Recompute the data array based on the entire candle set.
   * - Typically you store the result in a private Float32Array inside the plugin.
   */
  computeData(candles: Bar[]): void;

  /**
   * Returns the min and max data values for the specified visible range.
   * Used by the chart to expand price bounds if needed (e.g. if the indicator line goes higher/lower).
   */
  getMinMaxInRange(startIndex: number, endIndex: number): { min: number; max: number };

  /**
   * Draws the indicator line(s) for the specified visible range.
   * Typically you use the plugin’s cached data array plus the chart coordinate transforms.
   */
  draw(canvas: SkCanvas, path: SkPath, params: DrawParams): void;

  /**
   * Dispose any Skia objects (e.g. paints, path effects).
   * Called by the chart manager when the chart unmounts or is otherwise destroyed.
   */
  dispose(): void;
}

/**
 * Calculates the Exponential Moving Average (EMA) for the provided
 * candles using the candle's close price.
 *
 * @param candles The array of candlestick candles
 * @param period The EMA period (e.g. 9, 20, 50)
 * @returns A Float32Array of EMA values, same length as candles
 */
function calculateEma(candles: Bar[], period: number): Float32Array {
  'worklet';
  if (!candles.length) return new Float32Array(0);

  const alpha = 2 / (period + 1);
  const ema = new Float32Array(candles.length);
  ema[0] = candles[0].c;

  for (let i = 1; i < candles.length; i++) {
    ema[i] = alpha * candles[i].c + (1 - alpha) * ema[i - 1];
  }

  return ema;
}

/**
 * EmaIndicator can handle any period: e.g. 9, 20, 50, etc.
 */
export class EmaIndicator implements IndicatorPlugin<IndicatorKey> {
  private __workletClass = true;

  private paint: SkPaint;
  private period: number;
  private data: Float32Array = new Float32Array(0);

  public readonly key: IndicatorKey;

  /**
   * @param key       e.g. 'EMA9'
   * @param period    numeric period of the EMA
   * @param color     color of this line
   * @param lineWidth stroke width (e.g. your `config.indicatorStrokeWidth`)
   */
  constructor(key: IndicatorKey, period: number, color: SkColor, lineWidth: number) {
    this.key = key;
    this.period = period;

    this.paint = Skia.Paint();
    this.paint.setAntiAlias(true);
    this.paint.setDither(true);
    this.paint.setColor(color);
    this.paint.setStrokeWidth(lineWidth);
    this.paint.setStrokeCap(StrokeCap.Round);
    this.paint.setStrokeJoin(StrokeJoin.Round);
    this.paint.setStyle(PaintStyle.Stroke);

    const cornerEffect = Skia.PathEffect.MakeCorner(6);
    this.paint.setPathEffect(cornerEffect);
    cornerEffect?.dispose();
  }

  computeData(candles: Bar[]): void {
    this.data = calculateEma(candles, this.period);
  }

  getMinMaxInRange(startIndex: number, endIndex: number): { min: number; max: number } {
    if (startIndex > endIndex || !this.data.length) return { min: 0, max: 1 };
    let min = Infinity;
    let max = -Infinity;

    for (let i = startIndex; i <= endIndex; i++) {
      const val = this.data[i];
      if (val < min) min = val;
      if (val > max) max = val;
    }

    if (min === Infinity || max === -Infinity) return { min: 0, max: 1 };
    return { min, max };
  }

  draw(
    canvas: SkCanvas,
    path: SkPath,
    { candleRegionHeight, candleWidth, endIndex, maxPrice, minPrice, offsetX, startIndex, stride }: DrawParams
  ): void {
    if (!this.data.length || endIndex < startIndex) return;

    const priceRange = maxPrice - minPrice || 1;
    // Convert a price to a Y coordinate in the "candle region"
    const priceToY = (p: number) => {
      return candleRegionHeight - ((p - minPrice) / priceRange) * candleRegionHeight;
    };

    const xOffset = offsetX + candleWidth / 2; // Centers the line on the candle
    let hasMoved = false;

    for (let i = startIndex; i <= endIndex; i++) {
      const x = i * stride + xOffset;
      const y = priceToY(this.data[i]);
      if (!hasMoved) {
        path.moveTo(x, y);
        hasMoved = true;
      } else {
        path.lineTo(x, y);
      }
    }

    canvas.drawPath(path, this.paint);
  }

  dispose(): void {
    this.paint.dispose();
  }
}

export class IndicatorBuilder<K extends IndicatorKey> {
  private __workletClass = true;

  /** Registry of possible indicators (key -> plugin). */
  private plugins = new Map<K, IndicatorPlugin<K>>();
  private drawPath = Skia.Path.Make();

  /** Which indicators are currently active. */
  public readonly activeIndicators = new Set<K>();

  /**
   * Registers one or multiple indicator plugins.
   */
  public registerIndicators(plugin: IndicatorPlugin<K>): void;
  public registerIndicators(plugins: IndicatorPlugin<K>[]): void;
  public registerIndicators(pluginOrPlugins: IndicatorPlugin<K> | IndicatorPlugin<K>[]): void {
    const pluginArray = Array.isArray(pluginOrPlugins) ? pluginOrPlugins : [pluginOrPlugins];
    for (const plugin of pluginArray) {
      this.plugins.set(plugin.key, plugin);
    }
  }

  /**
   * Activate an already-registered indicator by key.
   */
  public showIndicators(key: K, candles: Bar[]): void;
  public showIndicators(keys: K[], candles: Bar[]): void;
  public showIndicators(keyOrKeys: K | K[], candles: Bar[]): void {
    const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];
    for (const key of keys) {
      if (this.plugins.has(key)) {
        this.activeIndicators.add(key);
        this.plugins.get(key)?.computeData(candles);
      }
    }
  }

  /**
   * Deactivate an indicator by key.
   */
  public hideIndicators(key: K): void;
  public hideIndicators(keys: K[]): void;
  public hideIndicators(keyOrKeys: K | K[]): void {
    const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];
    for (const key of keys) {
      this.activeIndicators.delete(key);
    }
  }

  /**
   * Toggle an indicator by key.
   */
  public toggleIndicator(key: K): void {
    if (this.activeIndicators.has(key)) {
      this.activeIndicators.delete(key);
    } else {
      if (this.plugins.has(key)) this.activeIndicators.add(key);
    }
  }

  /**
   * Re-compute data for all active indicators whenever the candle data changes.
   */
  public computeAll(candles: Bar[]): void {
    for (const key of this.activeIndicators) {
      const plugin = this.plugins.get(key);
      if (plugin) plugin.computeData(candles);
    }
  }

  /**
   * For a given visible range, returns the min and max among *all active* indicators.
   * Useful to expand chart Y-bounds if an indicator extends beyond the candle’s min/max.
   */
  public getMinMaxForRange(startIndex: number, endIndex: number): { min: number; max: number } | null {
    if (!this.activeIndicators.size) return null;

    let min = Infinity;
    let max = -Infinity;

    for (const key of this.activeIndicators) {
      const plugin = this.plugins.get(key);
      if (!plugin) continue;
      const { min: pluginMin, max: pluginMax } = plugin.getMinMaxInRange(startIndex, endIndex);
      if (pluginMin < min) min = pluginMin;
      if (pluginMax > max) max = pluginMax;
    }

    if (min === Infinity || max === -Infinity) return { min: 0, max: 1 };

    return { min, max };
  }

  /**
   * Draws all active indicators onto the provided Canvas,
   * for the specified visible candle range and draw params.
   */
  public drawAll(canvas: SkCanvas, params: DrawParams): void {
    for (const key of this.activeIndicators) {
      const plugin = this.plugins.get(key);
      if (plugin) plugin.draw(canvas, this.drawPath, params);
      this.drawPath.reset();
    }
  }

  /**
   * Disposes all indicator plugin resources.
   */
  public dispose(): void {
    for (const plugin of this.plugins.values()) {
      plugin.dispose();
    }
    this.activeIndicators.clear();
    this.drawPath.dispose();
    this.plugins.clear();
  }
}
