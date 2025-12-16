import {
  BlendMode,
  BlurStyle,
  ClipOp,
  PaintStyle,
  SkCanvas,
  SkColor,
  SkPaint,
  SkParagraph,
  SkPicture,
  Skia,
  StrokeCap,
  StrokeJoin,
  TileMode,
} from '@shopify/react-native-skia';
import { State as GestureState } from 'react-native-gesture-handler';
import { SharedValue } from 'react-native-reanimated';
import { triggerHaptics } from 'react-native-turbo-haptics';
import { getColorForTheme } from '@/design-system/color/useForegroundColor';
import { TextSegment } from '@/design-system/components/SkiaText/useSkiaText';
import { deepFreeze } from '@/utils/deepFreeze';
import { normalizeSpringConfig } from '@/worklets/animations';
import { createBlankPicture } from '@/worklets/skia';
import { Animator } from '../../candlestick/classes/Animator';
import { TimeFormatter } from '../../candlestick/classes/TimeFormatter';
import { LineSmoothing } from '../../line/LineSmoothingAlgorithms';
import { InteractionConfig, LineEffectsConfig, LineSeriesBuilder, SeriesDataInput } from '../../line/LineSeriesBuilder';
import { DrawParams } from '../../line/types';
import { EntranceAnimation, OutcomeSeries, PolymarketInterval, SERIES_COLORS, SERIES_PALETTES, SeriesPalette } from '../types';

// ============ Types ========================================================== //

export type OutcomePrice = {
  color: string;
  label: string;
  price: number;
  tokenId: string;
};

export type ActiveInteractionData = {
  outcomes: OutcomePrice[];
  timestamp: number;
};

const MAX_PROGRESS = 100;
const MIN_PROGRESS = 0;
const RISE_OFFSET = 10;

const ENTRANCE_ANIMATION_CONFIGS = deepFreeze({
  [EntranceAnimation.Draw]: {
    circle: { start: 0.85, end: 1 },
  },
  [EntranceAnimation.Rise]: {
    startY: 10,
    endY: 0,
  },
});

export type PolymarketChartConfig = {
  animation: {
    entranceAnimation: EntranceAnimation;
    entranceAnimationConfig?: { damping: number; mass: number; stiffness: number };
    springConfig: { damping: number; mass: number; stiffness: number };
  };
  chart: {
    backgroundColor: string;
    paddingRatioVertical: number;
    xAxisGap: number;
    xAxisHeight: number;
    xAxisInset: number;
    yAxisPaddingLeft: number;
    yAxisPaddingRight: number;
  };
  crosshair: {
    dotColor: string;
    dotSize: number;
    dotStrokeWidth: number;
    lineColor: string;
    strokeWidth: number;
    yOffset: number;
  };
  endCircle: {
    enabled: boolean;
    radius: number;
    shadow: { alpha: number; blur: number; spread?: number; x?: number; y?: number };
  };
  grid: {
    color: string;
    strokeWidth: number;
  };
  line: {
    colors?: SeriesPalette | readonly [string, string, string, string, string];
    overrideSeriesColors?: boolean;
    strokeWidth: number;
  };
  lineShadow: {
    enabled: boolean;
    alpha: number;
    blur: number;
    y: number;
  };
  tooltip: {
    bubbleHeight: number;
    bubblePaddingHorizontal: number;
    strokeWidth: number;
  };
};

const AVERAGE_CHARACTER_WIDTH = 52 / 8;

export class PolymarketChartManager {
  private readonly __workletClass = true;

  private readonly chartHeight: number;
  private readonly chartWidth: number;
  private readonly availableWidth: number;
  private readonly config: PolymarketChartConfig;

  private backgroundColor: SkColor;
  private buildParagraph: (segments: TextSegment | TextSegment[]) => SkParagraph | null;
  private interval: PolymarketInterval = '1d';
  private isDarkMode: boolean;
  private readonly smoothingMode: LineSmoothing | undefined;
  private lastVisibleRange = { startIndex: -1, endIndex: -1 };
  private series: OutcomeSeries[] = [];
  private timeDomain: { endTs: number; startTs: number } | null = null;
  private readonly fallbackTimeDomain = { endTs: 1, startTs: 0 };
  private yAxisWidth = 0;

  private hasPlayedEntranceAnimation = false;
  private isAnimating = false;
  private isEntranceAnimating = false;
  private previousBounds: { max: number; min: number } | null = null;
  private targetBounds: { max: number; min: number } | null = null;

  private interactionIndex: number | null = null;
  private interactionX: number | null = null;
  private seriesMetadata: { color: string; label: string; tokenId: string }[] = [];

  private readonly activeInteraction: SharedValue<ActiveInteractionData | undefined> | undefined;
  private readonly interactionProgress: SharedValue<number>;

  private readonly animationProgress: SharedValue<number>;
  private readonly chartMaxY: SharedValue<number>;
  private readonly chartMinY: SharedValue<number>;
  private readonly chartPicture: SharedValue<SkPicture>;
  private readonly crosshairPicture: SharedValue<SkPicture>;
  private readonly isChartGestureActive: SharedValue<boolean>;

  private readonly animator: Animator;
  private readonly blankPicture: SkPicture;
  private readonly lineSeriesBuilder: LineSeriesBuilder;
  private readonly pictureRecorder = Skia.PictureRecorder();
  private readonly timeFormatter = new TimeFormatter();

  private readonly colors: {
    black: SkColor;
    crosshairLine: SkColor;
    labelQuinary: SkColor;
    labelSecondary: SkColor;
    white: SkColor;
  };

  private readonly paints: {
    bottomShadow: SkPaint;
    bubbleFill: SkPaint;
    bubbleStroke: SkPaint;
    crosshairLine: SkPaint;
    endCircle: SkPaint | null;
    endCircleShadow: SkPaint | null;
    grid: SkPaint;
    greyCircle: SkPaint;
    greyLine: SkPaint;
    lineShadow: SkPaint | null;
    text: SkPaint;
    topShadow: SkPaint;
  };

  private lineEffectsConfig: LineEffectsConfig | undefined;
  private gridTopY = 0;

  constructor({
    activeInteraction,
    animationProgress,
    buildParagraph,
    chartHeight,
    chartMaxY,
    chartMinY,
    chartPicture,
    chartWidth,
    config,
    crosshairPicture,
    interactionProgress,
    isChartGestureActive,
    isDarkMode,
    smoothingMode,
  }: {
    activeInteraction: SharedValue<ActiveInteractionData | undefined> | undefined;
    animationProgress: SharedValue<number>;
    buildParagraph: (segments: TextSegment | TextSegment[]) => SkParagraph | null;
    chartHeight: number;
    chartMaxY: SharedValue<number>;
    chartMinY: SharedValue<number>;
    chartPicture: SharedValue<SkPicture>;
    chartWidth: number;
    config: PolymarketChartConfig;
    crosshairPicture: SharedValue<SkPicture>;
    interactionProgress: SharedValue<number>;
    isChartGestureActive: SharedValue<boolean>;
    isDarkMode: boolean;
    smoothingMode?: LineSmoothing;
  }) {
    if (activeInteraction) this.activeInteraction = activeInteraction;
    this.animationProgress = animationProgress;
    this.backgroundColor = Skia.Color(config.chart.backgroundColor);
    this.buildParagraph = buildParagraph;
    this.chartHeight = chartHeight;
    this.chartMaxY = chartMaxY;
    this.chartMinY = chartMinY;
    this.chartPicture = chartPicture;
    this.chartWidth = chartWidth;
    this.config = config;
    this.crosshairPicture = crosshairPicture;
    this.interactionProgress = interactionProgress;
    this.isChartGestureActive = isChartGestureActive;
    this.isDarkMode = isDarkMode;
    this.smoothingMode = smoothingMode;

    this.animator = new Animator(() => this.rebuildChart());
    const fullHeight = chartHeight + config.chart.xAxisHeight + config.chart.xAxisGap * 2;
    this.blankPicture = createBlankPicture(chartWidth, fullHeight);
    this.lineSeriesBuilder = new LineSeriesBuilder(config.line.strokeWidth);

    this.yAxisWidth = this.calculateYAxisWidth(6);
    this.availableWidth = this.chartWidth - this.yAxisWidth;

    const colorMode = isDarkMode ? 'dark' : 'light';
    this.colors = {
      black: Skia.Color('#000000'),
      crosshairLine: Skia.Color(config.crosshair.lineColor),
      labelQuinary: Skia.Color(getColorForTheme('labelQuinary', colorMode)),
      labelSecondary: Skia.Color(getColorForTheme('labelSecondary', colorMode)),
      white: Skia.Color('#FFFFFF'),
    };

    this.paints = {
      bottomShadow: this.createBottomShadowPaint(),
      bubbleFill: this.createBubbleFillPaint(),
      bubbleStroke: this.createBubbleStrokePaint(),
      crosshairLine: this.createCrosshairLinePaint(),
      endCircle: null,
      endCircleShadow: null,
      grid: this.createGridPaint(),
      greyCircle: this.createGreyCirclePaint(),
      greyLine: this.createGreyLinePaint(),
      lineShadow: null,
      text: this.createTextPaint(),
      topShadow: this.createTopShadowPaint(),
    };

    this.initializeLineEffects();
  }

  private initializeLineEffects(): void {
    const { endCircle, lineShadow } = this.config;

    if (lineShadow?.enabled) {
      const paint = Skia.Paint();
      paint.setAntiAlias(true);
      paint.setStyle(PaintStyle.Stroke);
      paint.setStrokeWidth(this.config.line.strokeWidth);
      paint.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, lineShadow.blur / 2, true));
      this.paints.lineShadow = paint;
    }

    if (endCircle?.enabled) {
      const circlePaint = Skia.Paint();
      circlePaint.setAntiAlias(true);
      this.paints.endCircle = circlePaint;

      const lightModeAlphaMultiplier = this.isDarkMode ? 1 : 0.5;
      const shadowPaint = Skia.Paint();
      shadowPaint.setAntiAlias(true);
      shadowPaint.setAlphaf(endCircle.shadow.alpha * lightModeAlphaMultiplier);
      shadowPaint.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, endCircle.shadow.blur / 2, true));
      if (this.isDarkMode) {
        shadowPaint.setColorFilter(Skia.ColorFilter.MakeBlend(this.colors.black, BlendMode.SrcIn));
      }
      this.paints.endCircleShadow = shadowPaint;
    }

    this.updateLineEffectsConfig();
  }

  private updateLineEffectsConfig(): void {
    const { endCircle, lineShadow } = this.config;

    if (!lineShadow?.enabled && !endCircle?.enabled) {
      this.lineEffectsConfig = undefined;
      return;
    }

    let config: LineEffectsConfig = {
      endCirclePaint: this.paints.endCircle ?? undefined,
      endCircleRadius: endCircle?.enabled ? endCircle.radius + (endCircle.shadow.spread ?? 0) : undefined,
    };

    if (endCircle?.enabled && this.paints.endCircleShadow) {
      const circleShadowAlphaMultiplier = this.isDarkMode ? 1 : 0.3;
      config = Object.assign(config, {
        endCircleShadowPaint: this.paints.endCircleShadow,
        endCircleShadowAlpha: endCircle.shadow.alpha * circleShadowAlphaMultiplier,
        endCircleShadowOffset:
          endCircle.shadow.x || endCircle.shadow.y ? { x: endCircle.shadow.x ?? 0, y: endCircle.shadow.y ?? 0 } : undefined,
      });
    }

    if (lineShadow?.enabled && this.paints.lineShadow) {
      const lightModeAlphaMultiplier = this.isDarkMode ? 1 : 0.5;
      config = Object.assign(config, {
        lineShadowPaint: this.paints.lineShadow,
        lineShadowAlpha: lineShadow.alpha * lightModeAlphaMultiplier,
        lineShadowYOffset: lineShadow.y,
      });
    }

    this.lineEffectsConfig = config;
  }

  private createBubbleFillPaint(): SkPaint {
    const paint = Skia.Paint();
    paint.setAntiAlias(true);
    paint.setBlendMode(BlendMode.Src);
    return paint;
  }

  private createBubbleStrokePaint(): SkPaint {
    const paint = Skia.Paint();
    paint.setAntiAlias(true);
    paint.setStyle(PaintStyle.Stroke);
    paint.setStrokeWidth(this.config.tooltip.strokeWidth);
    return paint;
  }

  private createGreyLinePaint(): SkPaint {
    const paint = Skia.Paint();
    paint.setAntiAlias(true);
    paint.setBlendMode(BlendMode.Src);
    paint.setColor(this.colors.labelQuinary);
    paint.setStrokeCap(StrokeCap.Round);
    paint.setStrokeJoin(StrokeJoin.Round);
    paint.setStrokeWidth(this.config.line.strokeWidth);
    paint.setStyle(PaintStyle.Stroke);
    return paint;
  }

  private createGreyCirclePaint(): SkPaint {
    const paint = Skia.Paint();
    paint.setAntiAlias(true);
    paint.setBlendMode(BlendMode.Src);
    paint.setColor(this.colors.labelQuinary);
    return paint;
  }

  private createCrosshairLinePaint(): SkPaint {
    const paint = Skia.Paint();
    paint.setColor(this.colors.crosshairLine);
    paint.setAlphaf(0.2);
    paint.setStrokeCap(StrokeCap.Round);
    paint.setStrokeWidth(this.config.crosshair.strokeWidth);
    paint.setBlendMode(BlendMode.Src);
    return paint;
  }

  private createGridPaint(): SkPaint {
    const paint = Skia.Paint();
    paint.setAntiAlias(true);
    paint.setColor(Skia.Color(this.config.grid.color));
    paint.setStrokeCap(StrokeCap.Round);
    paint.setStrokeWidth(this.config.grid.strokeWidth);
    return paint;
  }

  private createBottomShadowPaint(): SkPaint {
    const paint = Skia.Paint();
    paint.setColor(this.backgroundColor);
    paint.setAlphaf(0.48);
    paint.setImageFilter(Skia.ImageFilter.MakeDropShadow(0, 4, 5, 5, this.backgroundColor, null));
    return paint;
  }

  private createTopShadowPaint(): SkPaint {
    const paint = Skia.Paint();
    paint.setColor(this.backgroundColor);
    paint.setAlphaf(0.48);
    paint.setImageFilter(Skia.ImageFilter.MakeDropShadow(0, -4, 5, 5, this.backgroundColor, null));
    return paint;
  }

  private createTextPaint(): SkPaint {
    const paint = Skia.Paint();
    paint.setBlendMode(BlendMode.Src);
    return paint;
  }

  private calculateYAxisWidth(maxCharacters: number): number {
    const labelWidth = Math.ceil(maxCharacters * AVERAGE_CHARACTER_WIDTH);
    return this.config.chart.yAxisPaddingLeft + labelWidth + this.config.chart.yAxisPaddingRight;
  }

  private formatPercentage(value: number): string {
    const percent = value * 100;
    if (percent >= 99.95) return '100%';
    if (percent <= 0.05) return '0%';
    return `${percent.toFixed(1)}%`;
  }

  /**
   * Calculates the horizontal distance between data points.
   * The line spans from x=0 to x=(chartWidth - yAxisWidth).
   */
  private getStride(length: number): number {
    if (length <= 1) return 0;
    return this.availableWidth / (length - 1);
  }

  /**
   * Returns the X offset for the first data point.
   * First point starts at the left edge (x=0).
   */
  private getOffsetX(): number {
    return 0;
  }

  private computeTimeDomain(series: OutcomeSeries[]): { endTs: number; startTs: number } | null {
    let startTs = Number.POSITIVE_INFINITY;
    let endTs = Number.NEGATIVE_INFINITY;

    for (const s of series) {
      const len = s.timestamps.length;
      if (!len) continue;
      const first = s.timestamps[0];
      const last = s.timestamps[len - 1];
      const seriesStart = Math.min(first, last);
      const seriesEnd = Math.max(first, last);
      if (seriesStart < startTs) startTs = seriesStart;
      if (seriesEnd > endTs) endTs = seriesEnd;
    }

    if (startTs === Number.POSITIVE_INFINITY || endTs === Number.NEGATIVE_INFINITY) return null;
    return { endTs, startTs };
  }

  private getTimeDomain(): { endTs: number; startTs: number } {
    return this.timeDomain ?? this.fallbackTimeDomain;
  }

  private yToPrice(chartRegionHeight: number, maxPrice: number, minPrice: number, y: number): number {
    const priceRange = maxPrice - minPrice;
    return minPrice + (priceRange * (chartRegionHeight - y)) / chartRegionHeight;
  }

  public setSeriesData(series: OutcomeSeries[]): void {
    const hadData = this.series.length > 0;

    const currentKeys = this.lineSeriesBuilder.getSeriesKeys();
    const newKeys = series.map(s => s.tokenId);
    const isMarketSwitch = currentKeys.length !== newKeys.length || !currentKeys.every((k, i) => k === newKeys[i]);

    this.series = series;
    const nextTimeDomain = this.computeTimeDomain(series);
    const shouldAnimate = hadData && !isMarketSwitch && !this.isEntranceAnimating;

    // Capture current state before updating data
    let capturedBounds: { min: number; max: number } | null = null;
    if (shouldAnimate) {
      const currentProgress = this.isAnimating ? this.animationProgress.value / MAX_PROGRESS : 1;
      const currentParams = this.getCaptureParams();
      capturedBounds = { min: currentParams.minPrice, max: currentParams.maxPrice };
      this.lineSeriesBuilder.captureStartState(currentProgress, currentParams);
    }

    // Update data
    const colorsConfig = this.config.line.colors;
    const colors = colorsConfig ? (typeof colorsConfig === 'string' ? SERIES_PALETTES[colorsConfig] : colorsConfig) : null;
    const overrideSeriesColors = this.config.line.overrideSeriesColors === true;
    const seriesData: SeriesDataInput[] = series.map((s, i) => ({
      // Allow config palette to override incoming series colors when requested
      color: overrideSeriesColors
        ? colors?.[i] ?? s.color ?? SERIES_COLORS[i % SERIES_COLORS.length]
        : s.color ?? colors?.[i] ?? SERIES_COLORS[i % SERIES_COLORS.length],
      key: s.tokenId,
      label: s.label,
      prices: s.prices,
      smoothingMode: this.smoothingMode,
      timestamps: s.timestamps,
    }));

    this.seriesMetadata = seriesData.map(s => ({ color: s.color, label: s.label, tokenId: s.key }));
    this.lineSeriesBuilder.setSeriesData(seriesData);
    this.timeDomain = nextTimeDomain;
    const newBounds = this.getPriceBounds();

    if (shouldAnimate && capturedBounds) {
      // Compute target path with final bounds (not interpolated)
      const targetParams = this.getTargetParams(newBounds);
      this.lineSeriesBuilder.setTargetState(targetParams);

      // Use captured bounds (interpolated if was animating) as animation start
      this.previousBounds = capturedBounds;
      this.targetBounds = { max: newBounds.max, min: newBounds.min };
      this.isAnimating = true;
      this.animationProgress.value = MIN_PROGRESS;
      this.rebuildChart();

      this.animator.spring(
        this.animationProgress,
        MAX_PROGRESS,
        normalizeSpringConfig(this.animationProgress.value, MAX_PROGRESS, this.config.animation.springConfig),
        finished => {
          if (!finished) return;
          this.lineSeriesBuilder.clearAnimationState();
          this.isAnimating = false;
          this.previousBounds = null;
          this.targetBounds = null;
          this.chartMinY.value = newBounds.min;
          this.chartMaxY.value = newBounds.max;
          this.rebuildChart();
        }
      );
    } else {
      this.lineSeriesBuilder.clearAnimationState();
      this.isAnimating = false;
      this.previousBounds = null;
      this.targetBounds = null;
      this.chartMinY.value = newBounds.min;
      this.chartMaxY.value = newBounds.max;

      const { entranceAnimation, entranceAnimationConfig, springConfig } = this.config.animation;
      const shouldPlayEntranceAnimation =
        this.getDataLength() > 0 && entranceAnimation !== EntranceAnimation.Fade && !this.hasPlayedEntranceAnimation;

      if (shouldPlayEntranceAnimation) {
        this.hasPlayedEntranceAnimation = true;
        this.isEntranceAnimating = true;
        this.animationProgress.value = MIN_PROGRESS;
        this.rebuildChart();

        const animationConfig = entranceAnimationConfig ?? springConfig;

        this.animator.spring(
          this.animationProgress,
          MAX_PROGRESS,
          normalizeSpringConfig(this.animationProgress.value, MAX_PROGRESS, animationConfig),
          finished => {
            if (!finished) return;
            this.isEntranceAnimating = false;
            this.rebuildChart();
          }
        );
      } else {
        this.rebuildChart();
      }
    }
  }

  /**
   * Gets params for capturing current visual state (with interpolated bounds if animating).
   */
  private getCaptureParams(): DrawParams {
    const length = this.getDataLength();
    const progress = this.animationProgress.value / MAX_PROGRESS;
    const domain = this.getTimeDomain();

    let minPrice: number;
    let maxPrice: number;
    if (this.isAnimating && this.previousBounds && this.targetBounds) {
      minPrice = this.previousBounds.min + (this.targetBounds.min - this.previousBounds.min) * progress;
      maxPrice = this.previousBounds.max + (this.targetBounds.max - this.previousBounds.max) * progress;
    } else {
      minPrice = this.chartMinY.value;
      maxPrice = this.chartMaxY.value;
    }

    const bounds = this.getPriceBounds();

    return {
      availableWidth: this.availableWidth,
      chartRegionHeight: this.chartHeight,
      domainEndTs: domain.endTs,
      domainStartTs: domain.startTs,
      endIndex: bounds.endIndex,
      maxPrice,
      minPrice,
      offsetX: this.getOffsetX(),
      startIndex: bounds.startIndex,
      stride: this.getStride(length),
    };
  }

  /**
   * Gets params for computing target path with final bounds.
   */
  private getTargetParams(bounds: { endIndex: number; max: number; min: number; startIndex: number }): DrawParams {
    const length = this.getDataLength();
    const domain = this.getTimeDomain();
    return {
      availableWidth: this.availableWidth,
      chartRegionHeight: this.chartHeight,
      domainEndTs: domain.endTs,
      domainStartTs: domain.startTs,
      endIndex: bounds.endIndex,
      maxPrice: bounds.max,
      minPrice: bounds.min,
      offsetX: this.getOffsetX(),
      startIndex: bounds.startIndex,
      stride: this.getStride(length),
    };
  }

  public setInterval(interval: PolymarketInterval): void {
    this.interval = interval;
  }

  public clearData(): void {
    this.series = [];
    this.seriesMetadata = [];
    this.lineSeriesBuilder.clearSeries();
    this.lastVisibleRange = { startIndex: -1, endIndex: -1 };
    this.timeDomain = null;

    this.isAnimating = false;
    this.isEntranceAnimating = false;
    this.previousBounds = null;
    this.targetBounds = null;

    if (this.activeInteraction) this.activeInteraction.value = undefined;
    this.interactionIndex = null;
    this.interactionX = null;

    const oldPicture = this.chartPicture.value;
    this.chartPicture.value = this.blankPicture;
    if (oldPicture !== this.blankPicture) {
      oldPicture.dispose();
    }
  }

  private getDataLength(): number {
    return this.lineSeriesBuilder.getMaxLength();
  }

  private getPriceBounds(): { endIndex: number; max: number; min: number; startIndex: number } {
    const length = this.getDataLength();
    if (!length) {
      return { endIndex: 0, max: 1, min: 0, startIndex: 0 };
    }

    const startIndex = 0;
    const endIndex = length - 1;

    const minMax = this.lineSeriesBuilder.getMinMaxForRange(endIndex, startIndex);
    if (!minMax) {
      return { endIndex, max: 1, min: 0, startIndex };
    }

    const range = minMax.max - minMax.min || 0.1;
    const padding = range * this.config.chart.paddingRatioVertical;
    const edgeBuffer = padding * 0.5;

    return {
      endIndex,
      max: Math.min(1 + edgeBuffer, minMax.max + padding),
      min: Math.max(-edgeBuffer, minMax.min - padding),
      startIndex,
    };
  }

  public rebuildChart(): void {
    const length = this.getDataLength();
    if (!length) {
      if (this.chartPicture.value !== this.blankPicture) {
        const oldPicture = this.chartPicture.value;
        this.chartPicture.value = this.blankPicture;
        oldPicture.dispose();
      }
      return;
    }

    const bounds = this.getPriceBounds();
    const progress = this.animationProgress.value / MAX_PROGRESS;

    let minPrice: number;
    let maxPrice: number;
    if (this.isAnimating && this.previousBounds && this.targetBounds) {
      minPrice = this.previousBounds.min + (this.targetBounds.min - this.previousBounds.min) * progress;
      maxPrice = this.previousBounds.max + (this.targetBounds.max - this.previousBounds.max) * progress;
    } else {
      minPrice = this.chartMinY.value;
      maxPrice = this.chartMaxY.value;
    }

    const chartRegionHeight = this.chartHeight;
    const stride = this.getStride(length);
    const offsetX = this.getOffsetX();
    const domain = this.getTimeDomain();

    const params: DrawParams = {
      availableWidth: this.availableWidth,
      chartRegionHeight,
      domainEndTs: domain.endTs,
      domainStartTs: domain.startTs,
      endIndex: bounds.endIndex,
      maxPrice,
      minPrice,
      offsetX,
      startIndex: bounds.startIndex,
      stride,
    };

    const heightWithXAxis = this.chartHeight + this.config.chart.xAxisHeight + this.config.chart.xAxisGap * 2;
    const canvas = this.pictureRecorder.beginRecording({
      height: heightWithXAxis,
      width: this.chartWidth,
      x: 0,
      y: 0,
    });

    this.drawXAxisLabels(canvas, bounds.endIndex, bounds.startIndex);
    canvas.clipRect({ height: this.chartHeight, width: this.chartWidth, x: 0, y: 0 }, ClipOp.Intersect, true);
    this.drawHorizontalGridLines(canvas, 4, maxPrice, minPrice);

    let drawProgress = 1;
    let entranceYOffset = 0;
    let circleScale = 1;

    if (this.isEntranceAnimating) {
      const t = this.animationProgress.value / MAX_PROGRESS;
      switch (this.config.animation.entranceAnimation) {
        case EntranceAnimation.Draw:
          if (this.config.endCircle.enabled) {
            const lineProgressBase = ENTRANCE_ANIMATION_CONFIGS[EntranceAnimation.Draw].circle.start;
            const circleProgressBase = 1 - lineProgressBase;
            drawProgress = Math.min(1, t / lineProgressBase);
            circleScale = Math.max(0, (t - lineProgressBase) / circleProgressBase);
          } else {
            drawProgress = t;
            circleScale = t;
          }
          break;
        case EntranceAnimation.Rise:
          entranceYOffset = (1 - t) * RISE_OFFSET;
          circleScale = t;
          break;
        case EntranceAnimation.Fade:
          circleScale = t;
          break;
      }
    }

    const effectsConfig = this.lineEffectsConfig ? { ...this.lineEffectsConfig, endCircleScale: circleScale } : undefined;
    const interactionIndex = this.interactionIndex;
    const interactionX = this.interactionX;
    const interactionProgress = this.interactionProgress.value;

    if (interactionIndex !== null && interactionX !== null && interactionProgress > 0) {
      const splitX = Math.max(0, Math.min(this.availableWidth, interactionX * this.availableWidth));

      if (this.isChartGestureActive.value) {
        this.drawVerticalLine(canvas, splitX);
      }

      const interactionConfig: InteractionConfig = {
        greyCirclePaint: this.paints.greyCircle,
        greyColor: this.colors.labelQuinary,
        greyLinePaint: this.paints.greyLine,
        normalizedSplitPoint: interactionX,
        progress: interactionProgress,
      };

      this.lineSeriesBuilder.drawAllWithInteraction(canvas, params, effectsConfig, interactionConfig, progress, entranceYOffset);
    } else {
      this.lineSeriesBuilder.drawAll(canvas, params, effectsConfig, progress, drawProgress, entranceYOffset);
    }

    const oldPicture = this.chartPicture.value;
    this.chartPicture.value = this.pictureRecorder.finishRecordingAsPicture();
    if (oldPicture !== this.blankPicture) {
      oldPicture.dispose();
    }

    this.lastVisibleRange = { startIndex: bounds.startIndex, endIndex: bounds.endIndex };
  }

  private drawHorizontalGridLines(canvas: SkCanvas, lineCount: number, maxPrice: number, minPrice: number): void {
    const labelX = this.chartWidth - this.yAxisWidth + this.config.chart.yAxisPaddingLeft;
    const lineEndX = labelX - 8; // Gap before labels
    const halfStroke = this.config.grid.strokeWidth / 2;

    const measureParagraph = this.buildParagraph({
      color: this.colors.labelQuinary,
      foregroundPaint: this.paints.text,
      text: '100%',
    });
    measureParagraph?.layout(this.chartWidth);
    const labelHeight = measureParagraph?.getLineMetrics()[0]?.height ?? 0;
    const halfLabel = labelHeight / 2;
    this.gridTopY = halfLabel || halfStroke;

    const endAlpha = this.isDarkMode ? 0.05 : 0.03;
    const startAlpha = this.isDarkMode ? 0.02 : 0.01;
    const gridColor = this.colors.white;
    const startColor = Float32Array.from([gridColor[0], gridColor[1], gridColor[2], startAlpha]);
    const endColor = Float32Array.from([gridColor[0], gridColor[1], gridColor[2], endAlpha]);

    const gridShader = Skia.Shader.MakeLinearGradient({ x: 0, y: 0 }, { x: lineEndX, y: 0 }, [startColor, endColor], null, TileMode.Clamp);
    this.paints.grid.setShader(gridShader);

    for (let i = 0; i < lineCount; i++) {
      const y = i === 0 ? halfLabel : this.chartHeight * (i / lineCount);

      canvas.drawLine(-halfStroke, y, lineEndX, y, this.paints.grid);

      const price = this.yToPrice(this.chartHeight, maxPrice, minPrice, y);
      const formattedPrice = this.formatPercentage(price);

      const paragraph = this.buildParagraph({
        color: this.colors.labelQuinary,
        foregroundPaint: this.paints.text,
        text: formattedPrice,
      });

      if (paragraph) {
        paragraph.layout(this.chartWidth);
        // Center label on line
        paragraph.paint(canvas, labelX, y - halfLabel);
      }
    }

    // Clean up shader
    this.paints.grid.setShader(null);
    gridShader.dispose();
  }

  private drawXAxisLabels(canvas: SkCanvas, _endIndex: number, _startIndex: number): void {
    const domain = this.timeDomain;
    if (!domain) return;

    const { endTs, startTs } = domain;

    const xAxisY = this.chartHeight + this.config.chart.xAxisGap;
    const xAxisWidth = this.chartWidth - this.config.chart.xAxisInset * 2;

    const startDate = this.timeFormatter.format(startTs);
    const leftParagraph = this.buildParagraph({
      color: this.colors.labelQuinary,
      foregroundPaint: this.paints.text,
      text: startDate,
    });

    if (leftParagraph) {
      leftParagraph.layout(xAxisWidth / 2);
      leftParagraph.paint(canvas, this.config.chart.xAxisInset, xAxisY);
    }

    const endDate = this.timeFormatter.format(endTs);
    const rightParagraph = this.buildParagraph({
      color: this.colors.labelQuinary,
      foregroundPaint: this.paints.text,
      text: endDate,
    });

    if (rightParagraph) {
      rightParagraph.layout(xAxisWidth / 2);
      const textWidth = rightParagraph.getLineMetrics()[0]?.width ?? 0;
      rightParagraph.paint(canvas, this.chartWidth - this.config.chart.xAxisInset - textWidth, xAxisY);
    }
  }

  private updateActiveInteraction(index: number): void {
    if (!this.activeInteraction) return;

    const values = this.lineSeriesBuilder.getValuesAtIndex(index);
    if (!values.length) {
      this.activeInteraction.value = undefined;
      return;
    }

    const outcomes: OutcomePrice[] = values.map(v => {
      const metadata = this.seriesMetadata.find(m => m.tokenId === v.key);
      return {
        color: metadata?.color ?? SERIES_COLORS[0],
        label: v.label,
        price: v.price,
        tokenId: v.key,
      };
    });

    this.activeInteraction.value = {
      outcomes,
      timestamp: values[0].timestamp,
    };
  }

  private buildCrosshairPicture(x: number, active: boolean): void {
    if (!active || !this.getDataLength()) {
      this.isChartGestureActive.value = false;
      this.interactionIndex = null;
      this.interactionX = null;
      if (this.crosshairPicture.value !== this.blankPicture) {
        this.crosshairPicture.value = this.blankPicture;
      }
      return;
    }

    const length = this.getDataLength();
    const offsetX = this.getOffsetX();
    const normalizedX = this.availableWidth > 0 ? Math.max(0, Math.min(1, (x - offsetX) / this.availableWidth)) : 0;

    const index = this.lineSeriesBuilder.getNearestIndex(offsetX, this.getStride(length), x);
    if (index < 0) {
      this.interactionIndex = null;
      this.interactionX = null;
      if (this.crosshairPicture.value !== this.blankPicture) {
        this.crosshairPicture.value = this.blankPicture;
      }
      return;
    }

    const indexChanged = this.interactionIndex !== index;
    this.interactionIndex = index;
    this.interactionX = normalizedX;

    if (indexChanged) {
      triggerHaptics('selection');
      this.updateActiveInteraction(index);
    }

    this.rebuildChart();

    if (this.crosshairPicture.value !== this.blankPicture) {
      this.crosshairPicture.value = this.blankPicture;
    }
  }

  private drawVerticalLine(canvas: SkCanvas, x: number): void {
    const verticalInset = this.config.crosshair.strokeWidth / 2;
    const topY = this.gridTopY || this.config.grid.strokeWidth / 2;
    canvas.drawLine(x, topY, x, this.chartHeight - verticalInset, this.paints.crosshairLine);
  }

  public onLongPressStart(x: number): void {
    if (!this.getDataLength()) return;

    this.isChartGestureActive.value = true;
    triggerHaptics('soft');

    this.interactionProgress.value = 0;
    this.buildCrosshairPicture(x, true);

    this.animator.spring(this.interactionProgress, 1, normalizeSpringConfig(0, 1, this.config.animation.springConfig));
  }

  public onLongPressMove(x: number, state: GestureState): void {
    if (!this.isChartGestureActive.value) return;

    const isActive = state === GestureState.ACTIVE;
    this.buildCrosshairPicture(x, isActive);
  }

  public onLongPressEnd(state: GestureState): void {
    if (state === GestureState.END) {
      triggerHaptics('rigid');
    }

    this.isChartGestureActive.value = false;

    if (this.crosshairPicture.value !== this.blankPicture) {
      this.crosshairPicture.value = this.blankPicture;
    }

    this.animator.spring(
      this.interactionProgress,
      0,
      normalizeSpringConfig(this.interactionProgress.value, 0, this.config.animation.springConfig),
      finished => {
        if (finished) {
          this.interactionIndex = null;
          this.interactionX = null;
          if (this.activeInteraction) this.activeInteraction.value = undefined;
          this.rebuildChart();
        }
      }
    );
  }

  public setBuildParagraph(buildParagraph: (segments: TextSegment | TextSegment[]) => SkParagraph | null): void {
    this.buildParagraph = buildParagraph;
  }

  public setHighlightedSeries(key: string | null): void {
    this.lineSeriesBuilder.setHighlightedSeries(key);
    this.rebuildChart();
  }

  public setColorMode(isDarkMode: boolean, backgroundColor: string): void {
    this.isDarkMode = isDarkMode;
    this.backgroundColor = Skia.Color(backgroundColor);
    const colorMode = isDarkMode ? 'dark' : 'light';
    this.colors.labelQuinary = Skia.Color(getColorForTheme('labelQuinary', colorMode));
    this.colors.labelSecondary = Skia.Color(getColorForTheme('labelSecondary', colorMode));
    this.colors.crosshairLine = Skia.Color(this.config.crosshair.lineColor);

    // Update shadow paints with new background color
    this.paints.bottomShadow.setColor(this.backgroundColor);
    this.paints.bottomShadow.setAlphaf(0.48);
    this.paints.bottomShadow.setImageFilter(Skia.ImageFilter.MakeDropShadow(0, 4, 5, 5, this.backgroundColor, null));

    this.paints.topShadow.setColor(this.backgroundColor);
    this.paints.topShadow.setAlphaf(0.48);
    this.paints.topShadow.setImageFilter(Skia.ImageFilter.MakeDropShadow(0, -4, 5, 5, this.backgroundColor, null));

    // Update end circle shadow paint for light/dark mode
    const lightModeAlphaMultiplier = isDarkMode ? 1 : 0.5;
    if (this.paints.endCircleShadow && this.config.endCircle) {
      this.paints.endCircleShadow.setAlphaf(this.config.endCircle.shadow.alpha * lightModeAlphaMultiplier);
      this.paints.endCircleShadow.setColorFilter(isDarkMode ? Skia.ColorFilter.MakeBlend(this.colors.black, BlendMode.SrcIn) : null);
    }

    // Update crosshair paint color and alpha
    this.paints.crosshairLine.setColor(this.colors.crosshairLine);
    this.paints.crosshairLine.setAlphaf(0.25);

    this.updateLineEffectsConfig();
    this.rebuildChart();
  }

  public dispose(): void {
    this.animator.dispose();
    this.blankPicture.dispose();
    this.lineSeriesBuilder.dispose();
    this.pictureRecorder.dispose();

    for (const paint of Object.values(this.paints)) {
      paint?.dispose();
    }
  }
}
