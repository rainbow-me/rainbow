import {
  BlendMode,
  BlurStyle,
  PaintStyle,
  SkCanvas,
  SkColor,
  SkPaint,
  SkPath,
  Skia,
  StrokeCap,
  StrokeJoin,
} from '@shopify/react-native-skia';
import { getColorValueForThemeWorklet, ResponseByTheme } from '@/__swaps__/utils/swaps';
import { LineSmoothing, buildSmoothedPath, buildSmoothedPathAnimated } from './LineSmoothingAlgorithms';
import { DrawParams } from './types';
import { ETH_COLOR, ETH_COLOR_DARK } from '@/__swaps__/screens/Swap/constants';

export type LineEffectsConfig = {
  endCirclePaint?: SkPaint;
  endCircleRadius?: number;
  endCircleScale?: number;
} & (
  | { endCircleShadowPaint: SkPaint; endCircleShadowAlpha: number; endCircleShadowOffset?: { x: number; y: number } }
  | { endCircleShadowPaint?: undefined; endCircleShadowAlpha?: undefined; endCircleShadowOffset?: undefined }
) &
  (
    | { lineShadowPaint: SkPaint; lineShadowAlpha: number; lineShadowYOffset?: number }
    | { lineShadowPaint?: undefined; lineShadowAlpha?: undefined; lineShadowYOffset?: undefined }
  );

export type InteractionConfig = {
  greyCirclePaint: SkPaint;
  greyColor: SkColor;
  greyLinePaint: SkPaint;
  normalizedSplitPoint: number;
  progress: number;
};

export type LineSeriesConfig = {
  color: ResponseByTheme<string>;
  highlighted?: boolean;
  isDarkMode: boolean;
  key: string;
  label: string;
  lineWidth?: number;
  /**
   * The smoothing algorithm to use for rendering the line.
   * @default LineSmoothing.Makima
   */
  smoothingMode?: LineSmoothing;
  /**
   * Smoothing tension controlling the amount of curve smoothing.
   * - 0 = polyline (straight line segments with corners at data points)
   * - 1 = full smoothing according to the chosen algorithm
   * @default 1
   */
  smoothingTension?: number;
};

export type MinMax = {
  max: number;
  min: number;
};

type SeriesLayout = {
  domainRange: number;
  endTs: number;
  range: number;
  startTs: number;
  startX: number;
  endX: number;
  width: number;
};

const DEFAULT_SMOOTHING_MODE = LineSmoothing.Makima;
const DEFAULT_SMOOTHING_TENSION = 1;
const DEFAULT_SKIA_COLORS: ResponseByTheme<SkColor> = { dark: Skia.Color(ETH_COLOR_DARK), light: Skia.Color(ETH_COLOR) };
const SAMPLE_COUNT = 90;

export class LineSeries {
  private readonly __workletClass = true;

  public readonly key: string;
  public readonly label: string;

  private readonly lineWidth: number;
  private readonly paint: SkPaint;
  private readonly smoothingMode: LineSmoothing;
  private readonly smoothingTension: number;

  private color: ResponseByTheme<SkColor>;
  private highlighted: boolean;
  private highlightPaint: SkPaint | null = null;
  private isDarkMode: boolean;
  private prices: Float32Array = new Float32Array(0);
  private timestamps: Float32Array = new Float32Array(0);

  private previousPath: Float32Array | null = null;
  private targetPath: Float32Array | null = null;
  private readonly interpolatedColor = new Float32Array(4);
  private readonly layout: SeriesLayout = {
    domainRange: 1,
    endTs: 0,
    range: 1,
    startTs: 0,
    startX: 0,
    endX: 0,
    width: 0,
  };
  private readonly sampleCursor = { index: 0 };
  private readonly splitLeftPath = Skia.Path.Make();
  private readonly splitRightPath = Skia.Path.Make();

  constructor(config: LineSeriesConfig) {
    const {
      color,
      highlighted = false,
      isDarkMode,
      key,
      label,
      lineWidth = 2,
      smoothingMode = DEFAULT_SMOOTHING_MODE,
      smoothingTension = DEFAULT_SMOOTHING_TENSION,
    } = config;

    this.color = { dark: Skia.Color(color.dark), light: Skia.Color(color.light) };
    this.highlighted = highlighted;
    this.isDarkMode = isDarkMode;
    this.key = key;
    this.label = label;
    this.lineWidth = lineWidth;
    this.smoothingMode = smoothingMode;
    this.smoothingTension = smoothingTension;

    this.paint = Skia.Paint();
    this.paint.setAntiAlias(true);
    this.paint.setColor(getColorValueForThemeWorklet(this.color, isDarkMode, DEFAULT_SKIA_COLORS));
    this.paint.setDither(true);
    this.paint.setStrokeCap(StrokeCap.Round);
    this.paint.setStrokeJoin(StrokeJoin.Round);
    this.paint.setStrokeWidth(this.lineWidth);
    this.paint.setStyle(PaintStyle.Stroke);

    if (highlighted) this.createHighlightPaint();
  }

  public setData(prices: Float32Array, timestamps: Float32Array): void {
    this.prices = prices;
    this.timestamps = timestamps;
  }

  private computeLayout(params: DrawParams): SeriesLayout {
    const len = this.timestamps.length;
    const firstTs = len ? this.timestamps[0] : 0;
    const lastTs = len ? this.timestamps[len - 1] : firstTs;
    const startTs = Math.min(firstTs, lastTs);
    const endTs = Math.max(firstTs, lastTs);

    const domainStart = Math.min(params.domainStartTs, params.domainEndTs);
    const domainEnd = Math.max(params.domainStartTs, params.domainEndTs);
    const domainRangeRaw = domainEnd - domainStart;
    const domainRange = domainRangeRaw === 0 ? 1 : domainRangeRaw;

    const startX = params.offsetX + ((startTs - domainStart) / domainRange) * params.availableWidth;
    const endX = params.offsetX + ((endTs - domainStart) / domainRange) * params.availableWidth;
    const range = endTs - startTs || 1;

    this.layout.domainRange = domainRange;
    this.layout.endTs = endTs;
    this.layout.range = range;
    this.layout.startTs = startTs;
    this.layout.startX = startX;
    this.layout.endX = endX;
    this.layout.width = endX - startX;
    return this.layout;
  }

  private samplePriceAtTimestamp(targetTs: number): number {
    const len = this.prices.length;
    if (len === 0) return 0;
    if (len === 1) return this.prices[0];

    const isAscending = this.timestamps[0] <= this.timestamps[len - 1];
    const cursor = this.sampleCursor;
    let i = cursor.index;
    const lastIndex = len - 1;

    const firstTs = this.timestamps[0];
    const lastTs = this.timestamps[lastIndex];

    if (isAscending) {
      if (targetTs <= firstTs) {
        cursor.index = 0;
        return this.prices[0];
      }

      if (targetTs >= lastTs) {
        cursor.index = Math.max(0, lastIndex - 1);
        return this.prices[lastIndex];
      }
    } else {
      if (targetTs >= firstTs) {
        cursor.index = 0;
        return this.prices[0];
      }

      if (targetTs <= lastTs) {
        cursor.index = Math.max(0, lastIndex - 1);
        return this.prices[lastIndex];
      }
    }

    if (i >= lastIndex) i = lastIndex - 1;

    if (isAscending) {
      while (i < lastIndex - 1 && this.timestamps[i + 1] < targetTs) {
        i += 1;
      }
      while (i > 0 && this.timestamps[i] > targetTs) {
        i -= 1;
      }
    } else {
      while (i < lastIndex - 1 && this.timestamps[i + 1] > targetTs) {
        i += 1;
      }
      while (i > 0 && this.timestamps[i] < targetTs) {
        i -= 1;
      }
    }

    cursor.index = i;

    const t0 = this.timestamps[i];
    const t1 = this.timestamps[i + 1];
    if (t1 === t0) return this.prices[i];

    const frac = (targetTs - t0) / (t1 - t0);
    return this.prices[i] + (this.prices[i + 1] - this.prices[i]) * frac;
  }

  /**
   * Captures the current visual state as the animation starting point.
   *
   * If an animation is in progress, captures the interpolated visual at
   * current progress. If not animating, captures the current static visual.
   *
   * @param progress Current animation progress [0,1] (1 if not animating)
   * @param params Draw params at capture moment (with interpolated bounds if animating)
   */
  public captureStartState(progress: number, params: DrawParams): void {
    const { chartRegionHeight, maxPrice, minPrice } = params;
    const priceRange = maxPrice - minPrice || 1;
    const layout = this.computeLayout(params);

    if (this.previousPath && this.targetPath) {
      // Animation in progress - capture interpolated state
      const t = Math.max(0, Math.min(1, progress));
      for (let i = 0; i < SAMPLE_COUNT; i++) {
        const idx = i * 2;
        // Linear interpolation of current animation state
        this.previousPath[idx] = this.previousPath[idx] + (this.targetPath[idx] - this.previousPath[idx]) * t;
        this.previousPath[idx + 1] = this.previousPath[idx + 1] + (this.targetPath[idx + 1] - this.previousPath[idx + 1]) * t;
      }
    } else {
      // Not animating - compute current visual from prices
      if (!this.previousPath) {
        this.previousPath = new Float32Array(SAMPLE_COUNT * 2);
      }
      this.sampleCursor.index = 0;
      for (let i = 0; i < SAMPLE_COUNT; i++) {
        const normalized = i / (SAMPLE_COUNT - 1);
        const targetTs = layout.startTs + normalized * layout.range;
        const price = this.samplePriceAtTimestamp(targetTs);
        const x = layout.startX + normalized * layout.width;
        const y = chartRegionHeight - ((price - minPrice) / priceRange) * chartRegionHeight;
        this.previousPath[i * 2] = x;
        this.previousPath[i * 2 + 1] = y;
      }
    }
    // Clear target until setTargetState is called
    this.targetPath = null;
  }

  /**
   * Sets the animation target state. Must be called after data is updated
   * and with the FINAL target bounds (not interpolated).
   *
   * @param params Draw params with FINAL target bounds
   */
  public setTargetState(params: DrawParams): void {
    const { chartRegionHeight, maxPrice, minPrice } = params;
    const priceRange = maxPrice - minPrice || 1;
    const layout = this.computeLayout(params);

    if (!this.targetPath) {
      this.targetPath = new Float32Array(SAMPLE_COUNT * 2);
    }

    this.sampleCursor.index = 0;
    for (let i = 0; i < SAMPLE_COUNT; i++) {
      const normalized = i / (SAMPLE_COUNT - 1);
      const targetTs = layout.startTs + normalized * layout.range;
      const price = this.samplePriceAtTimestamp(targetTs);
      const x = layout.startX + normalized * layout.width;
      const y = chartRegionHeight - ((price - minPrice) / priceRange) * chartRegionHeight;
      this.targetPath[i * 2] = x;
      this.targetPath[i * 2 + 1] = y;
    }
  }

  public clearAnimationState(): void {
    this.previousPath = null;
    this.targetPath = null;
  }

  public isAnimating(): boolean {
    return this.previousPath !== null && this.targetPath !== null;
  }

  public getLength(): number {
    return this.prices.length;
  }

  public getTimestamp(index: number): number {
    return this.timestamps[index];
  }

  public getPrice(index: number): number {
    return this.prices[index];
  }

  public getMinMaxInRange(endIndex: number, startIndex: number): MinMax {
    if (!this.prices.length || startIndex > endIndex) {
      return { max: 1, min: 0 };
    }

    const clampedEnd = Math.min(this.prices.length - 1, endIndex);
    const clampedStart = Math.max(0, startIndex);

    let max = -Infinity;
    let min = Infinity;

    for (let i = clampedStart; i <= clampedEnd; i++) {
      const val = this.prices[i];
      if (val < min) min = val;
      if (val > max) max = val;
    }

    if (min === Infinity || max === -Infinity) return { max: 1, min: 0 };

    return { max, min };
  }

  /**
   * Draws the line series with configurable spline smoothing.
   *
   * @param canvas Skia canvas
   * @param params Draw params (used for non-animated state only)
   * @param path Reusable path object
   * @param progress Animation progress [0,1] for path morphing
   * @param drawProgress Draw-in progress [0,1] for revealing the line from start to end
   * @param entranceYOffset Vertical offset in pixels for rise animation (0 = no offset)
   * @param effects Optional effects config for shadows and end circles
   */
  public draw(
    canvas: SkCanvas,
    params: DrawParams,
    path: SkPath,
    effects: LineEffectsConfig | undefined,
    progress = 1,
    drawProgress = 1,
    entranceYOffset = 0
  ): void {
    if (!this.prices.length) return;

    path.reset();

    if (this.previousPath && this.targetPath) {
      buildSmoothedPathAnimated(
        path,
        this.previousPath,
        this.targetPath,
        progress,
        SAMPLE_COUNT,
        this.smoothingMode,
        this.smoothingTension
      );
    } else {
      const { chartRegionHeight, maxPrice, minPrice } = params;
      const priceRange = maxPrice - minPrice || 1;
      const layout = this.computeLayout(params);

      const points = new Float32Array(SAMPLE_COUNT * 2);
      this.sampleCursor.index = 0;
      for (let i = 0; i < SAMPLE_COUNT; i++) {
        const normalized = i / (SAMPLE_COUNT - 1);
        const targetTs = layout.startTs + normalized * layout.range;
        const price = this.samplePriceAtTimestamp(targetTs);
        const idx = i * 2;
        points[idx] = layout.startX + normalized * layout.width;
        points[idx + 1] = chartRegionHeight - ((price - minPrice) / priceRange) * chartRegionHeight;
      }

      buildSmoothedPath(path, points, SAMPLE_COUNT, this.smoothingMode, this.smoothingTension);
    }

    if (drawProgress < 1) {
      path.trim(0, drawProgress, false);
    }

    const hasEntranceOffset = entranceYOffset !== 0;
    if (hasEntranceOffset) {
      canvas.save();
      canvas.translate(0, entranceYOffset);
    }

    // Draw line shadow (behind line)
    if (effects?.lineShadowPaint) {
      const yOffset = effects.lineShadowYOffset ?? 0;
      if (yOffset !== 0) {
        canvas.save();
        canvas.translate(0, yOffset);
      }
      effects.lineShadowPaint.setColor(this.getColor());
      effects.lineShadowPaint.setAlphaf(effects.lineShadowAlpha);
      canvas.drawPath(path, effects.lineShadowPaint);
      if (yOffset !== 0) {
        canvas.restore();
      }
    }

    // Draw highlight and main line
    if (this.highlighted && this.highlightPaint) {
      canvas.drawPath(path, this.highlightPaint);
    }
    canvas.drawPath(path, this.paint);

    // Draw end circle (on top of line)
    const circleScale = effects?.endCircleScale ?? 1;
    if (effects?.endCirclePaint && effects.endCircleRadius && circleScale > 0) {
      const lastPoint = path.getLastPt();
      const endX = lastPoint.x;
      const endY = lastPoint.y;
      const scaledRadius = effects.endCircleRadius * circleScale;

      // Draw circle shadow first (with optional offset, scaled)
      if (effects.endCircleShadowPaint) {
        effects.endCircleShadowPaint.setColor(this.getColor());
        effects.endCircleShadowPaint.setAlphaf(effects.endCircleShadowAlpha);
        const shadowX = endX + (effects.endCircleShadowOffset?.x ?? 0) * circleScale;
        const shadowY = endY + (effects.endCircleShadowOffset?.y ?? 0) * circleScale;
        canvas.drawCircle(shadowX, shadowY, scaledRadius, effects.endCircleShadowPaint);
      }

      // Draw circle with line color
      effects.endCirclePaint.setColor(this.getColor());
      canvas.drawCircle(endX, endY, scaledRadius, effects.endCirclePaint);
    }

    if (hasEntranceOffset) {
      canvas.restore();
    }
  }

  public drawLinesWithInteraction(
    canvas: SkCanvas,
    params: DrawParams,
    path: SkPath,
    effects: LineEffectsConfig | undefined,
    interaction: InteractionConfig,
    progress = 1,
    entranceYOffset = 0
  ): void {
    if (!this.prices.length) return;

    path.reset();

    const { chartRegionHeight, maxPrice, minPrice } = params;
    const priceRange = maxPrice - minPrice || 1;
    const layout = this.computeLayout(params);

    if (this.previousPath && this.targetPath) {
      buildSmoothedPathAnimated(
        path,
        this.previousPath,
        this.targetPath,
        progress,
        SAMPLE_COUNT,
        this.smoothingMode,
        this.smoothingTension
      );
    } else {
      const points = new Float32Array(SAMPLE_COUNT * 2);
      this.sampleCursor.index = 0;
      for (let i = 0; i < SAMPLE_COUNT; i++) {
        const normalized = i / (SAMPLE_COUNT - 1);
        const targetTs = layout.startTs + normalized * layout.range;
        const price = this.samplePriceAtTimestamp(targetTs);
        const idx = i * 2;
        points[idx] = layout.startX + normalized * layout.width;
        points[idx + 1] = chartRegionHeight - ((price - minPrice) / priceRange) * chartRegionHeight;
      }

      buildSmoothedPath(path, points, SAMPLE_COUNT, this.smoothingMode, this.smoothingTension);
    }

    const hasEntranceOffset = entranceYOffset !== 0;
    if (hasEntranceOffset) {
      canvas.save();
      canvas.translate(0, entranceYOffset);
    }

    const splitX = params.offsetX + interaction.normalizedSplitPoint * params.availableWidth;
    const clampedSplitX = Math.min(Math.max(splitX, layout.startX), layout.endX);
    const fullyGrey = clampedSplitX <= layout.startX;

    const t = interaction.progress;
    const splitT = this.getTrimTAtXFromPath(path, clampedSplitX);

    this.splitLeftPath.reset();
    this.splitLeftPath.addPath(path);
    this.splitLeftPath.trim(0, splitT, false);

    this.splitRightPath.reset();
    this.splitRightPath.addPath(path);
    this.splitRightPath.trim(splitT, 1, false);

    const color = this.getColor();
    this.interpolatedColor[0] = color[0] + (interaction.greyColor[0] - color[0]) * t;
    this.interpolatedColor[1] = color[1] + (interaction.greyColor[1] - color[1]) * t;
    this.interpolatedColor[2] = color[2] + (interaction.greyColor[2] - color[2]) * t;
    this.interpolatedColor[3] = color[3] + (interaction.greyColor[3] - color[3]) * t;

    if (effects?.lineShadowPaint) {
      const yOffset = effects.lineShadowYOffset ?? 0;
      const drawShadow = (targetPath: SkPath, color: Float32Array | SkColor, alpha: number) => {
        if (alpha <= 0) return;
        canvas.save();
        if (yOffset !== 0) {
          canvas.translate(0, yOffset);
        }
        effects.lineShadowPaint?.setColor(color);
        effects.lineShadowPaint?.setAlphaf(alpha);
        canvas.drawPath(targetPath, effects.lineShadowPaint ?? Skia.Paint());
        canvas.restore();
      };

      if (fullyGrey) {
        const shadowAlpha = effects.lineShadowAlpha * Math.max(0, 1 - t);
        if (shadowAlpha > 0) {
          drawShadow(this.splitRightPath, this.interpolatedColor, shadowAlpha);
        }
      } else {
        drawShadow(this.splitLeftPath, color, effects.lineShadowAlpha);

        const rightShadowAlpha = effects.lineShadowAlpha * (1 - t);
        drawShadow(this.splitRightPath, this.interpolatedColor, rightShadowAlpha);
      }
    }

    if (fullyGrey) {
      this.paint.setBlendMode(BlendMode.Src);
      this.paint.setColor(this.interpolatedColor);
      canvas.drawPath(this.splitRightPath, this.paint);
      this.paint.setColor(color);
      this.paint.setBlendMode(BlendMode.SrcOver);
    } else {
      if (this.highlighted && this.highlightPaint) {
        canvas.drawPath(this.splitLeftPath, this.highlightPaint);
      }
      canvas.drawPath(this.splitLeftPath, this.paint);

      this.paint.setBlendMode(BlendMode.Src);
      this.paint.setColor(this.interpolatedColor);
      canvas.drawPath(this.splitRightPath, this.paint);
      this.paint.setColor(color);
      this.paint.setBlendMode(BlendMode.SrcOver);
    }

    if (hasEntranceOffset) {
      canvas.restore();
    }
  }

  public drawCirclesWithInteraction(
    canvas: SkCanvas,
    params: DrawParams,
    path: SkPath,
    effects: LineEffectsConfig | undefined,
    interaction: InteractionConfig,
    progress = 1,
    entranceYOffset = 0
  ): void {
    if (!this.prices.length) return;

    const { chartRegionHeight, maxPrice, minPrice } = params;
    const priceRange = maxPrice - minPrice || 1;
    const layout = this.computeLayout(params);

    path.reset();
    if (this.previousPath && this.targetPath) {
      buildSmoothedPathAnimated(
        path,
        this.previousPath,
        this.targetPath,
        progress,
        SAMPLE_COUNT,
        this.smoothingMode,
        this.smoothingTension
      );
    } else {
      const points = new Float32Array(SAMPLE_COUNT * 2);
      this.sampleCursor.index = 0;
      for (let i = 0; i < SAMPLE_COUNT; i++) {
        const normalized = i / (SAMPLE_COUNT - 1);
        const targetTs = layout.startTs + normalized * layout.range;
        const price = this.samplePriceAtTimestamp(targetTs);
        const idx = i * 2;
        points[idx] = layout.startX + normalized * layout.width;
        points[idx + 1] = chartRegionHeight - ((price - minPrice) / priceRange) * chartRegionHeight;
      }
      buildSmoothedPath(path, points, SAMPLE_COUNT, this.smoothingMode, this.smoothingTension);
    }

    const hasEntranceOffset = entranceYOffset !== 0;
    if (hasEntranceOffset) {
      canvas.save();
      canvas.translate(0, entranceYOffset);
    }

    const { progress: interactionProgress } = interaction;
    const splitX = params.offsetX + interaction.normalizedSplitPoint * params.availableWidth;
    const clampedSplitX = Math.min(Math.max(splitX, layout.startX), layout.endX);
    const fallbackY = this.getYAtIndex(params, Math.max(0, this.prices.length - 1));
    const splitY = this.getYAtXFromPath(path, clampedSplitX, fallbackY);

    const lastPt = path.getLastPt();
    const endX = lastPt.x;
    const endY = lastPt.y;

    const circleRadius = effects?.endCircleRadius ?? 0;
    const color = this.getColor();

    if (circleRadius > 0) {
      const endCircleScale = effects?.endCircleScale ?? 1;
      const scaledRadius = circleRadius * endCircleScale;

      if (scaledRadius > 0) {
        if (effects?.endCircleShadowPaint) {
          const fadedAlpha = effects.endCircleShadowAlpha * (1 - interactionProgress);
          if (fadedAlpha > 0) {
            effects.endCircleShadowPaint.setColor(color);
            effects.endCircleShadowPaint.setAlphaf(fadedAlpha);
            const shadowX = endX + (effects.endCircleShadowOffset?.x ?? 0) * endCircleScale;
            const shadowY = endY + (effects.endCircleShadowOffset?.y ?? 0) * endCircleScale;
            canvas.drawCircle(shadowX, shadowY, scaledRadius, effects.endCircleShadowPaint);
          }
        }

        this.interpolatedColor[0] = color[0] + (interaction.greyColor[0] - color[0]) * interactionProgress;
        this.interpolatedColor[1] = color[1] + (interaction.greyColor[1] - color[1]) * interactionProgress;
        this.interpolatedColor[2] = color[2] + (interaction.greyColor[2] - color[2]) * interactionProgress;
        this.interpolatedColor[3] = color[3] + (interaction.greyColor[3] - color[3]) * interactionProgress;
        interaction.greyCirclePaint.setColor(this.interpolatedColor);
        canvas.drawCircle(endX, endY, scaledRadius, interaction.greyCirclePaint);
      }
    }

    if (effects?.endCirclePaint && circleRadius > 0 && interactionProgress > 0) {
      const scaledRadius = circleRadius * interactionProgress;

      if (effects.endCircleShadowPaint) {
        effects.endCircleShadowPaint.setColor(color);
        effects.endCircleShadowPaint.setAlphaf(effects.endCircleShadowAlpha);
        const shadowX = clampedSplitX + (effects.endCircleShadowOffset?.x ?? 0) * interactionProgress;
        const shadowY = splitY + (effects.endCircleShadowOffset?.y ?? 0) * interactionProgress;
        canvas.drawCircle(shadowX, shadowY, scaledRadius, effects.endCircleShadowPaint);
      }

      effects.endCirclePaint.setColor(color);
      canvas.drawCircle(clampedSplitX, splitY, scaledRadius, effects.endCirclePaint);
    }

    if (hasEntranceOffset) {
      canvas.restore();
    }
  }

  private getTrimTAtXFromPath(path: SkPath, desiredX: number): number {
    const iter = Skia.ContourMeasureIter(path, false, 1);
    const contour = iter.next();
    if (!contour) return 0;

    const totalLength = contour.length();
    if (totalLength === 0) return 0;

    const [startPos] = contour.getPosTan(0);
    const [endPos] = contour.getPosTan(totalLength);

    if (desiredX <= startPos.x) return 0;
    if (desiredX >= endPos.x) return 1;

    let lo = 0;
    let hi = totalLength;

    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2;
      const [pos] = contour.getPosTan(mid);
      if (pos.x < desiredX) {
        lo = mid;
      } else {
        hi = mid;
      }
    }

    const mid = (lo + hi) / 2;
    return Math.max(0, Math.min(1, mid / totalLength));
  }

  private getYAtXFromPath(path: SkPath, desiredX: number, fallbackY: number): number {
    const iter = Skia.ContourMeasureIter(path, false, 1);
    const contour = iter.next();
    if (!contour) return fallbackY;

    const totalLength = contour.length();
    if (totalLength === 0) return fallbackY;

    const [startPos] = contour.getPosTan(0);
    const [endPos] = contour.getPosTan(totalLength);

    if (desiredX <= startPos.x) return startPos.y;
    if (desiredX >= endPos.x) return endPos.y;

    let lo = 0;
    let hi = totalLength;

    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2;
      const [pos] = contour.getPosTan(mid);
      if (pos.x < desiredX) {
        lo = mid;
      } else {
        hi = mid;
      }
    }

    const [finalPos] = contour.getPosTan((lo + hi) / 2);
    return finalPos.y;
  }

  /**
   * Gets the Y position at a specific data index.
   */
  public getYAtIndex(params: DrawParams, index: number): number {
    if (index < 0 || index >= this.prices.length) return 0;

    const { chartRegionHeight, maxPrice, minPrice } = params;
    const priceRange = maxPrice - minPrice || 1;
    const price = this.prices[index];
    return chartRegionHeight - ((price - minPrice) / priceRange) * chartRegionHeight;
  }

  /**
   * Linearly interpolates a price value at normalized position t ∈ [0, 1].
   */
  public setHighlighted(highlighted: boolean): void {
    this.highlighted = highlighted;
    if (highlighted && !this.highlightPaint) {
      this.createHighlightPaint();
    }
  }

  public setColor(colors: ResponseByTheme<string>): void {
    this.color = { dark: Skia.Color(colors.dark), light: Skia.Color(colors.light) };
    const newColor = this.getColor();
    this.paint.setColor(newColor);
    if (this.highlightPaint) {
      this.highlightPaint.setColor(newColor);
    }
  }

  public setOpacity(opacity: number): void {
    this.paint.setAlphaf(opacity);
  }

  public getColor(): SkColor {
    return getColorValueForThemeWorklet(this.color, this.isDarkMode, DEFAULT_SKIA_COLORS);
  }

  private createHighlightPaint(): void {
    this.highlightPaint = Skia.Paint();
    this.highlightPaint.setAntiAlias(true);
    this.highlightPaint.setColor(this.getColor());
    this.highlightPaint.setAlphaf(0.5);
    this.highlightPaint.setStrokeCap(StrokeCap.Round);
    this.highlightPaint.setStrokeJoin(StrokeJoin.Round);
    this.highlightPaint.setStrokeWidth(this.lineWidth);
    this.highlightPaint.setStyle(PaintStyle.Stroke);
    this.highlightPaint.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 4, true));
  }

  public dispose(): void {
    this.highlightPaint?.dispose();
    this.highlightPaint = null;
    this.paint.dispose();
    this.previousPath = null;
    this.targetPath = null;
    this.splitLeftPath.dispose();
    this.splitRightPath.dispose();
  }
}
