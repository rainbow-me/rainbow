import {
  BlendMode,
  BlurStyle,
  PaintStyle,
  SkCanvas,
  SkColor,
  SkPaint,
  SkPath,
  SkParagraph,
  SkPathEffect,
  Skia,
  StrokeCap,
  StrokeJoin,
  TileMode,
} from '@shopify/react-native-skia';
import { TextSegment } from '@/design-system/components/SkiaText/useSkiaText';
import { DrawParams } from '@/features/charts/candlestick/classes/IndicatorBuilder';
import { RED_CANDLE_COLOR } from '@/features/charts/candlestick/constants';
import { HYPERLIQUID_GREEN } from '@/features/perps/context/PerpsAccentColorContext';
import { deepFreeze } from '@/utils/deepFreeze';
import {
  IndicatorStyle,
  IndicatorTypeConfig,
  PerpsIndicator,
  PerpsIndicatorConfig,
  PerpsIndicatorKey,
  PerpsIndicatorPlugin,
} from './PerpsIndicator';

// ============ Constants ====================================================== //

const BUBBLE_HEIGHT = 18;
const BUBBLE_MARGIN_LEFT = 8;
const BUBBLE_PADDING_HORIZONTAL = 6;
const BUBBLE_SPACING = 6;
const EPSILON = 1e-3;
const LABEL_PRICE_GAP = 3;
const LINE_CURVE_RIGHT_PADDING = 24;
const LINE_FADE_DISTANCE = 80;
const MIN_CENTER_DISTANCE = BUBBLE_HEIGHT + BUBBLE_SPACING;
const STROKE_WIDTH = 1;
const Y_AXIS_FADE_WIDTH_OFFSET = -40;

const CONFIG_DEFAULTS = {
  bubbleMarginLeft: BUBBLE_MARGIN_LEFT,
  bubblePaddingHorizontal: BUBBLE_PADDING_HORIZONTAL,
  fillAlpha: 0.24,
  glowIntensity: 0,
  innerHighlightAlpha: 0,
  labelPriceGap: LABEL_PRICE_GAP,
  lineAlpha: 0.4,
  lineCornerRadius: 44,
  lineGlowIntensity: 0,
  lineWidth: 1.0,
  shadowBlurRadius: 3,
  shouldAdjustYAxis: true,
  strokeAlpha: 0.15,
};

const PRIORITY_MAP: Record<PerpsIndicatorKey, number> = {
  [PerpsIndicatorKey.Liquidation]: 0,
  [PerpsIndicatorKey.StopLoss]: 1,
  [PerpsIndicatorKey.TakeProfit]: 2,
};

// ============ Indicator Configs ============================================== //

const COLORS = {
  liquidation: RED_CANDLE_COLOR,
  stopLoss: 'orange',
  takeProfit: HYPERLIQUID_GREEN,
};

const INDICATOR_CONFIGS = deepFreeze({
  [PerpsIndicatorKey.Liquidation]: {
    ...CONFIG_DEFAULTS,
    color: COLORS.liquidation,
    label: 'LIQ',
  },
  [PerpsIndicatorKey.StopLoss]: {
    ...CONFIG_DEFAULTS,
    color: COLORS.stopLoss,
    label: 'SL',
  },
  [PerpsIndicatorKey.TakeProfit]: {
    ...CONFIG_DEFAULTS,
    color: COLORS.takeProfit,
    label: 'TP',
  },
});

// ============ Types ========================================================== //

export type PerpsIndicatorData = Record<PerpsIndicatorKey, number | null>;

export type PerpsIndicatorBuilderConfig = PerpsIndicatorConfig & {
  buildParagraph: (segments: TextSegment | TextSegment[]) => SkParagraph | null;
  perpsIndicatorData: PerpsIndicatorData | null;
};

// ============ Shared Drawing Utilities ======================================= //

function createIndicatorStyle(config: PerpsIndicatorConfig, typeConfig: IndicatorTypeConfig): IndicatorStyle {
  'worklet';
  const backgroundColor = config.backgroundColor;
  const indicatorColor = Skia.Color(typeConfig.color);

  const {
    fillAlpha,
    glowIntensity,
    innerHighlightAlpha,
    label,
    lineAlpha,
    lineCornerRadius,
    lineGlowIntensity,
    lineWidth,
    shadowBlurRadius,
    strokeAlpha,
  } = typeConfig;

  const linePaint = Skia.Paint();
  linePaint.setAntiAlias(true);
  linePaint.setStyle(PaintStyle.Stroke);
  linePaint.setStrokeWidth(lineWidth);
  linePaint.setStrokeCap(StrokeCap.Round);
  linePaint.setStrokeJoin(StrokeJoin.Round);
  linePaint.setColor(indicatorColor);
  linePaint.setAlphaf(lineAlpha);

  let lineGlowPaint: SkPaint | null = null;
  if (lineGlowIntensity > 0) {
    const glowPaint = Skia.Paint();
    glowPaint.setAntiAlias(true);
    glowPaint.setStyle(PaintStyle.Stroke);
    glowPaint.setStrokeWidth(lineWidth);
    glowPaint.setStrokeCap(StrokeCap.Round);
    glowPaint.setStrokeJoin(StrokeJoin.Round);
    glowPaint.setColor(indicatorColor);
    glowPaint.setAlphaf(lineGlowIntensity);
    glowPaint.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 6, true));
    lineGlowPaint = glowPaint;
  }

  const bottomShadowPaint = Skia.Paint();
  bottomShadowPaint.setColor(backgroundColor);
  bottomShadowPaint.setAlphaf(0.48);
  bottomShadowPaint.setImageFilter(Skia.ImageFilter.MakeDropShadow(0, 4, 5, 5, backgroundColor, null));

  const topShadowPaint = Skia.Paint();
  topShadowPaint.setColor(backgroundColor);
  topShadowPaint.setAlphaf(0.48);
  topShadowPaint.setImageFilter(Skia.ImageFilter.MakeDropShadow(0, -4, 5, 5, backgroundColor, null));

  return {
    bottomShadowPaint,
    color: indicatorColor,
    cornerEffect: null,
    currentCornerRadius: 0,
    fillAlpha,
    glowIntensity,
    innerHighlightAlpha,
    label,
    lineAlpha,
    lineCornerRadius,
    lineGlowIntensity,
    lineGlowPaint,
    linePaint,
    lineWidth,
    shadowBlurRadius,
    strokeAlpha,
    topShadowPaint,
  };
}

function disposeIndicatorStyle(style: IndicatorStyle): void {
  'worklet';
  const effect = style.cornerEffect;
  if (effect) {
    effect.dispose();
    style.cornerEffect = null;
  }
  style.linePaint.dispose();
  const glowPaint = style.lineGlowPaint;
  if (glowPaint) {
    glowPaint.dispose();
    style.lineGlowPaint = null;
  }
  style.bottomShadowPaint.dispose();
  style.topShadowPaint.dispose();
  style.currentCornerRadius = 0;
}

function ensureCornerEffect(style: IndicatorStyle, radius: number): SkPathEffect | null {
  'worklet';
  const normalizedRadius = radius > 0 ? radius : 0;

  if (normalizedRadius === 0) {
    if (style.cornerEffect) {
      style.cornerEffect.dispose();
      style.cornerEffect = null;
    }
    style.currentCornerRadius = 0;
    return null;
  }

  if (style.cornerEffect && style.currentCornerRadius === normalizedRadius) {
    return style.cornerEffect;
  }

  if (style.cornerEffect) {
    style.cornerEffect.dispose();
  }

  const effect = Skia.PathEffect.MakeCorner(normalizedRadius);
  style.cornerEffect = effect;
  style.currentCornerRadius = normalizedRadius;
  return effect;
}

function drawIndicatorBubbleWithLabel(
  canvas: SkCanvas,
  y: number,
  style: IndicatorStyle,
  isDarkMode: boolean,
  bubbleWidth: number,
  labelParagraph: SkParagraph,
  priceParagraph: SkParagraph,
  fillPaint: SkPaint,
  strokePaint: SkPaint
): void {
  'worklet';
  const labelMetrics = labelParagraph.getLineMetrics()[0];
  const priceMetrics = priceParagraph.getLineMetrics()[0];

  if (!labelMetrics || !priceMetrics) {
    return;
  }

  const bubbleY = y - BUBBLE_HEIGHT / 2;
  const textY = bubbleY + (BUBBLE_HEIGHT - Math.max(labelMetrics.height, priceMetrics.height)) / 2;

  const rect = {
    rect: {
      height: BUBBLE_HEIGHT,
      width: bubbleWidth,
      x: BUBBLE_MARGIN_LEFT,
      y: bubbleY,
    },
    rx: BUBBLE_HEIGHT / 2,
    ry: BUBBLE_HEIGHT / 2,
  };

  if (isDarkMode) {
    canvas.drawRRect(rect, style.bottomShadowPaint);
    canvas.drawRRect(rect, style.topShadowPaint);
  }

  fillPaint.setBlendMode(BlendMode.Src);
  fillPaint.setAntiAlias(true);
  fillPaint.setColor(style.color);
  fillPaint.setAlphaf(style.fillAlpha);
  canvas.drawRRect(rect, fillPaint);

  if (isDarkMode) {
    strokePaint.setAntiAlias(true);
    strokePaint.setStyle(PaintStyle.Stroke);
    strokePaint.setStrokeWidth(STROKE_WIDTH);
    strokePaint.setColor(style.color);
    strokePaint.setAlphaf(style.strokeAlpha);
    const innerRect = {
      rect: {
        height: rect.rect.height - STROKE_WIDTH,
        width: rect.rect.width - STROKE_WIDTH,
        x: rect.rect.x + STROKE_WIDTH / 2,
        y: rect.rect.y + STROKE_WIDTH / 2,
      },
      rx: rect.rx - STROKE_WIDTH / 2,
      ry: rect.ry - STROKE_WIDTH / 2,
    };
    canvas.drawRRect(innerRect, strokePaint);
  }

  const labelX = BUBBLE_MARGIN_LEFT + BUBBLE_PADDING_HORIZONTAL;
  const priceX = labelX + labelMetrics.width + LABEL_PRICE_GAP;

  labelParagraph.paint(canvas, labelX, textY);
  priceParagraph.paint(canvas, priceX, textY);
}

function drawIndicatorLine(
  canvas: SkCanvas,
  path: SkPath,
  bubbleX: number,
  bubbleY: number,
  bubbleWidth: number,
  maxBubbleWidth: number,
  priceY: number,
  chartWidth: number,
  providedYAxisWidth: number,
  style: IndicatorStyle
): void {
  'worklet';
  const yAxisWidth = providedYAxisWidth + Y_AXIS_FADE_WIDTH_OFFSET;

  path.reset();
  const chartEndX = chartWidth - yAxisWidth;
  const bubbleRightEdge = bubbleX + bubbleWidth;
  const horizontalReach = chartEndX - bubbleRightEdge;
  const verticalDelta = priceY - bubbleY;
  const verticalDistance = verticalDelta < 0 ? -verticalDelta : verticalDelta;
  path.moveTo(bubbleRightEdge, bubbleY);

  if (horizontalReach <= EPSILON) {
    path.lineTo(chartEndX, priceY);
  } else if (verticalDistance <= EPSILON) {
    path.lineTo(chartEndX, bubbleY);
  } else {
    const widthDelta = maxBubbleWidth - bubbleWidth;
    let anchorReach = LINE_CURVE_RIGHT_PADDING;
    if (widthDelta > 0) {
      anchorReach += widthDelta;
    }

    const absoluteLineRadius = style.lineCornerRadius;
    if (absoluteLineRadius > anchorReach) {
      anchorReach = absoluteLineRadius;
    }

    if (anchorReach > horizontalReach) {
      anchorReach = horizontalReach;
    }

    if (anchorReach > EPSILON) {
      const anchorX = bubbleRightEdge + anchorReach;
      const thirdReach = anchorReach / 3;

      path.cubicTo(bubbleRightEdge + thirdReach, bubbleY, bubbleRightEdge + thirdReach * 2, priceY, anchorX, priceY);
      if (anchorX < chartEndX) {
        path.lineTo(chartEndX, priceY);
      }
    } else {
      path.lineTo(chartEndX, priceY);
    }
  }

  const cornerEffect = ensureCornerEffect(style, 0);

  const glowPaint = style.lineGlowPaint;
  if (glowPaint) {
    glowPaint.setPathEffect(cornerEffect);
    canvas.drawPath(path, glowPaint);
  }

  const fadeEndX = chartEndX;
  const fadeStartX = fadeEndX - LINE_FADE_DISTANCE;
  const lineFadeShader = Skia.Shader.MakeLinearGradient(
    { x: fadeStartX, y: 0 },
    { x: fadeEndX, y: 0 },
    [style.color, Skia.Color(0x00000000)],
    null,
    TileMode.Clamp
  );

  style.linePaint.setPathEffect(cornerEffect);
  style.linePaint.setShader(lineFadeShader);
  canvas.drawPath(path, style.linePaint);
  style.linePaint.setShader(null);
  lineFadeShader.dispose();
}

// ============ Perps Indicator Builder ======================================== //

export type IndicatorPosition = {
  bubbleWidth: number;
  bubbleY: number;
  indicator: PerpsIndicatorPlugin<PerpsIndicatorKey>;
  price: number;
  priceY: number;
  sortPriority: number;
};

export class PerpsIndicatorBuilder {
  private __workletClass = true;

  private readonly config: PerpsIndicatorBuilderConfig;
  private readonly indicators: Map<PerpsIndicatorKey, PerpsIndicatorPlugin<PerpsIndicatorKey> | null>;

  private readonly drawPath = Skia.Path.Make();
  private readonly foregroundPaint = Skia.Paint();
  private readonly fillPaint = Skia.Paint();
  private readonly strokePaint = Skia.Paint();

  constructor(config: PerpsIndicatorBuilderConfig) {
    this.config = config;
    this.indicators = new Map<PerpsIndicatorKey, PerpsIndicatorPlugin<PerpsIndicatorKey> | null>();
    for (const indicatorKey of Object.values(PerpsIndicatorKey)) {
      if (!config.perpsIndicatorData?.[indicatorKey]) {
        this.indicators.set(indicatorKey, null);
        continue;
      }
      this.indicators.set(indicatorKey, this.createIndicator(indicatorKey));
    }
  }

  private createIndicator(key: PerpsIndicatorKey): PerpsIndicatorPlugin<PerpsIndicatorKey> {
    return new PerpsIndicator(
      key,
      INDICATOR_CONFIGS[key],
      this.config,
      this.foregroundPaint,
      this.fillPaint,
      this.strokePaint,
      this.config.buildParagraph,
      drawIndicatorBubbleWithLabel,
      drawIndicatorLine,
      createIndicatorStyle,
      disposeIndicatorStyle
    );
  }

  public updateData(data: PerpsIndicatorData | null): void {
    if (!data) {
      for (const indicator of this.indicators.values()) {
        if (!indicator) continue;
        indicator.dispose();
        this.indicators.set(indicator.key, null);
      }
      return;
    }

    for (const [key, indicator] of this.indicators.entries()) {
      const price = data[key] ?? null;

      if (!indicator && price !== null) {
        const newIndicator = this.createIndicator(key);
        newIndicator.updatePrice(price);
        this.indicators.set(key, newIndicator);
      } else if (indicator && price === null) {
        indicator.dispose();
        this.indicators.set(key, null);
      } else if (indicator) {
        indicator.updatePrice(price);
      }
    }
  }

  public getMinMaxForRange(): { max: number; min: number } | null {
    let min = Infinity;
    let max = -Infinity;
    let hasAny = false;

    for (const indicator of this.indicators.values()) {
      if (!indicator || !indicator.shouldAdjustYAxis) continue;
      const range = indicator.getMinMaxInRange();
      if (range) {
        hasAny = true;
        if (range.min < min) min = range.min;
        if (range.max > max) max = range.max;
      }
    }

    if (!hasAny || min === Infinity || max === -Infinity) return null;
    return { max, min };
  }

  private calculatePositions(params: DrawParams): IndicatorPosition[] {
    const positions: IndicatorPosition[] = [];
    const { candleRegionHeight, maxPrice, minPrice } = params;
    const priceRange = maxPrice - minPrice || 1;
    let maxBubbleWidth = 0;

    for (const indicator of this.indicators.values()) {
      if (!indicator) continue;
      const range = indicator.getMinMaxInRange();
      if (!range) continue;

      const price = range.min;
      if (price < minPrice || price > maxPrice) continue;

      const priceY = candleRegionHeight - ((price - minPrice) / priceRange) * candleRegionHeight;
      const bubbleWidth = indicator.getBubbleWidth();
      if (bubbleWidth > maxBubbleWidth) maxBubbleWidth = bubbleWidth;

      positions.push({
        bubbleWidth,
        bubbleY: priceY,
        indicator,
        price,
        priceY,
        sortPriority: PRIORITY_MAP[indicator.key] ?? 999,
      });
    }

    if (positions.length === 0) return [];

    positions.sort((a, b) => a.priceY - b.priceY);

    for (let i = 1; i < positions.length; i++) {
      const prev = positions[i - 1];
      const current = positions[i];
      const minAllowedY = prev.bubbleY + MIN_CENTER_DISTANCE;
      if (current.bubbleY < minAllowedY) {
        current.bubbleY = minAllowedY;
      }
    }

    return positions;
  }

  public drawLines(canvas: SkCanvas, params: DrawParams): IndicatorPosition[] {
    const positions = this.calculatePositions(params);

    let maxBubbleWidth = 0;
    for (const pos of positions) {
      if (pos.bubbleWidth > maxBubbleWidth) maxBubbleWidth = pos.bubbleWidth;
    }

    for (const pos of positions) {
      pos.indicator.drawLine(canvas, this.drawPath, params, pos.bubbleY, pos.bubbleWidth, maxBubbleWidth);
      this.drawPath.reset();
    }

    return positions;
  }

  public drawBubbles(canvas: SkCanvas, positions: IndicatorPosition[]): void {
    for (const pos of positions) {
      pos.indicator.drawBubble(canvas, pos.bubbleY, pos.bubbleWidth);
    }
  }

  public setBuildParagraph(buildParagraph: (segments: TextSegment | TextSegment[]) => SkParagraph | null): void {
    for (const indicator of this.indicators.values()) {
      if (!indicator) continue;
      indicator.setBuildParagraph(buildParagraph);
    }
  }

  public setColorMode(isDarkMode: boolean, backgroundColor: SkColor): void {
    this.config.backgroundColor = backgroundColor;
    this.config.isDarkMode = isDarkMode;
    for (const indicator of this.indicators.values()) {
      if (!indicator) continue;
      indicator.setColorMode(isDarkMode, backgroundColor);
    }
  }

  public dispose(): void {
    for (const indicator of this.indicators.values()) {
      if (!indicator) continue;
      indicator.dispose();
    }
    this.foregroundPaint.dispose();
    this.fillPaint.dispose();
    this.strokePaint.dispose();
    this.indicators.clear();
    this.drawPath.dispose();
  }
}
