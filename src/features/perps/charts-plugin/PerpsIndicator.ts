import { SkCanvas, SkColor, SkPaint, SkParagraph, SkPath, BlendMode, SkShader, SkPathEffect, Skia } from '@shopify/react-native-skia';
import { TextSegment } from '@/design-system/components/SkiaText/useSkiaText';
import { DrawParams } from '@/features/charts/candlestick/classes/IndicatorBuilder';
import { formatCandlestickPrice } from '@/features/charts/candlestick/utils';

// ============ Types ========================================================== //

export enum PerpsIndicatorKey {
  Liquidation = 'LIQUIDATION',
  StopLoss = 'STOP_LOSS',
  TakeProfit = 'TAKE_PROFIT',
}

export type PerpsIndicatorConfig = {
  backgroundColor: SkColor;
  chartWidth: number;
  isDarkMode: boolean;
  yAxisWidth: number;
};

export type IndicatorTypeConfig = {
  bubbleMarginLeft: number;
  bubblePaddingHorizontal: number;
  color: string;
  fillAlpha: number;
  glowIntensity: number;
  innerHighlightAlpha: number;
  label: string;
  labelPriceGap: number;
  lineAlpha: number;
  lineCornerRadius: number;
  lineGlowIntensity: number;
  lineWidth: number;
  shadowBlurRadius: number;
  shouldAdjustYAxis: boolean;
  strokeAlpha: number;
};

export type IndicatorStyle = {
  bottomShadowPaint: SkPaint;
  color: SkColor;
  cornerEffect: SkPathEffect | null;
  currentCornerRadius: number;
  fillAlpha: number;
  glowIntensity: number;
  innerHighlightAlpha: number;
  label: string;
  lineAlpha: number;
  lineCornerRadius: number;
  lineFadeShader: SkShader | null;
  lineGlowIntensity: number;
  lineGlowPaint: SkPaint | null;
  linePaint: SkPaint;
  lineWidth: number;
  shadowBlurRadius: number;
  strokeAlpha: number;
  topShadowPaint: SkPaint;
};

export interface PerpsIndicatorPlugin<K extends PerpsIndicatorKey> {
  readonly key: K;
  readonly shouldAdjustYAxis: boolean;
  draw(canvas: SkCanvas, path: SkPath, params: DrawParams, yPosition: number, bubbleWidth: number, maxBubbleWidth: number): void;
  drawBubble(canvas: SkCanvas, yPosition: number, bubbleWidth: number): void;
  drawLine(canvas: SkCanvas, path: SkPath, params: DrawParams, yPosition: number, bubbleWidth: number, maxBubbleWidth: number): void;
  getBubbleWidth(): number;
  getMinMaxInRange(): { max: number; min: number } | null;
  setBuildParagraph(buildParagraph: (segments: TextSegment | TextSegment[]) => SkParagraph | null): void;
  setColorMode(isDarkMode: boolean, backgroundColor: SkColor): void;
  updatePrice(price: number | null): void;
  dispose(): void;
}

type DrawIndicatorBubbleFunction = (
  canvas: SkCanvas,
  y: number,
  style: IndicatorStyle,
  isDarkMode: boolean,
  bubbleWidth: number,
  labelParagraph: SkParagraph,
  priceParagraph: SkParagraph,
  fillPaint: SkPaint,
  strokePaint: SkPaint
) => void;

type DrawIndicatorLineFunction = (
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
) => void;

type CreateIndicatorStyleFn = (config: PerpsIndicatorConfig, typeConfig: IndicatorTypeConfig) => IndicatorStyle;

type DisposeIndicatorStyleFunction = (style: IndicatorStyle) => void;

// ============ PerpsIndicator Class =========================================== //

export class PerpsIndicator<K extends PerpsIndicatorKey> implements PerpsIndicatorPlugin<K> {
  private __workletClass = true;

  // -- Public Properties
  public readonly key: K;
  public readonly shouldAdjustYAxis: boolean;

  // -- Private State
  private cachedBubbleWidth = 0;
  private cachedLabelParagraph: SkParagraph | null = null;
  private cachedPriceParagraph: SkParagraph | null = null;
  private foregroundPaint: SkPaint;
  private fillPaint: SkPaint;
  private strokePaint: SkPaint;
  private isDarkMode: boolean;
  private price: number | null = null;

  // -- Configuration
  private readonly bubbleMarginLeft: number;
  private readonly bubblePaddingHorizontal: number;
  private readonly chartWidth: number;
  private readonly labelPriceGap: number;
  private readonly style: IndicatorStyle;
  private readonly yAxisWidth: number;

  // -- Injected Functions
  private buildParagraph: (segments: TextSegment | TextSegment[]) => SkParagraph | null;
  private readonly drawBubbleFn: DrawIndicatorBubbleFunction;
  private readonly drawLineFn: DrawIndicatorLineFunction;
  private readonly disposeIndicatorStyle: DisposeIndicatorStyleFunction;

  constructor(
    key: K,
    typeConfig: IndicatorTypeConfig,
    config: PerpsIndicatorConfig,
    foregroundPaint: SkPaint,
    fillPaint: SkPaint,
    strokePaint: SkPaint,
    buildParagraph: (segments: TextSegment | TextSegment[]) => SkParagraph | null,
    drawIndicatorBubbleWithLabel: DrawIndicatorBubbleFunction,
    drawIndicatorLine: DrawIndicatorLineFunction,
    createIndicatorStyle: CreateIndicatorStyleFn,
    disposeIndicatorStyle: DisposeIndicatorStyleFunction
  ) {
    this.key = key;
    this.shouldAdjustYAxis = typeConfig.shouldAdjustYAxis;

    this.bubbleMarginLeft = typeConfig.bubbleMarginLeft;
    this.bubblePaddingHorizontal = typeConfig.bubblePaddingHorizontal;
    this.chartWidth = config.chartWidth;
    this.isDarkMode = config.isDarkMode;
    this.labelPriceGap = typeConfig.labelPriceGap;
    this.yAxisWidth = config.yAxisWidth;

    this.buildParagraph = buildParagraph;
    this.drawBubbleFn = drawIndicatorBubbleWithLabel;
    this.drawLineFn = drawIndicatorLine;
    this.disposeIndicatorStyle = disposeIndicatorStyle;

    this.foregroundPaint = foregroundPaint;
    this.fillPaint = fillPaint;
    this.strokePaint = strokePaint;
    this.style = createIndicatorStyle(config, typeConfig);
  }

  // ============ Public Methods =============================================== //

  public updatePrice(price: number | null): void {
    this.price = price;
    this.updateCachedParagraphs();
  }

  private updateCachedParagraphs(): void {
    if (this.price === null) {
      this.cachedBubbleWidth = 0;
      this.cachedLabelParagraph = null;
      this.cachedPriceParagraph = null;
      return;
    }

    const priceText = formatCandlestickPrice(this.price, 'USD', true);
    this.foregroundPaint.setBlendMode(BlendMode.Src);

    const labelParagraph = this.buildParagraph({
      color: this.style.color,
      foregroundPaint: this.foregroundPaint,
      text: this.style.label,
      weight: 'bold',
    });
    const priceParagraph = this.buildParagraph({
      color: this.style.color,
      foregroundPaint: this.foregroundPaint,
      text: priceText,
      weight: 'bold',
    });

    if (!labelParagraph || !priceParagraph) {
      this.cachedBubbleWidth = 0;
      this.cachedLabelParagraph = null;
      this.cachedPriceParagraph = null;
      return;
    }

    labelParagraph.layout(this.chartWidth);
    priceParagraph.layout(this.chartWidth);

    const labelMetrics = labelParagraph.getLineMetrics()[0];
    const priceMetrics = priceParagraph.getLineMetrics()[0];

    if (!labelMetrics || !priceMetrics) {
      this.cachedBubbleWidth = 0;
      this.cachedLabelParagraph = null;
      this.cachedPriceParagraph = null;
      return;
    }

    this.cachedLabelParagraph = labelParagraph;
    this.cachedPriceParagraph = priceParagraph;
    this.cachedBubbleWidth = labelMetrics.width + this.labelPriceGap + priceMetrics.width + this.bubblePaddingHorizontal * 2;
  }

  public getMinMaxInRange(): { max: number; min: number } | null {
    if (this.price === null) return null;
    return { max: this.price, min: this.price };
  }

  public getBubbleWidth(): number {
    return this.cachedBubbleWidth;
  }

  public draw(canvas: SkCanvas, path: SkPath, params: DrawParams, yPosition: number, bubbleWidth: number, maxBubbleWidth: number): void {
    if (this.price === null || !this.cachedLabelParagraph || !this.cachedPriceParagraph) return;

    const { candleRegionHeight, maxPrice, minPrice } = params;
    const priceRange = maxPrice - minPrice || 1;
    if (this.price < minPrice || this.price > maxPrice) return;

    const priceY = candleRegionHeight - ((this.price - minPrice) / priceRange) * candleRegionHeight;

    this.drawLineFn(
      canvas,
      path,
      this.bubbleMarginLeft,
      yPosition,
      bubbleWidth,
      maxBubbleWidth,
      priceY,
      this.chartWidth,
      this.yAxisWidth,
      this.style
    );

    this.drawBubbleFn(
      canvas,
      yPosition,
      this.style,
      this.isDarkMode,
      bubbleWidth,
      this.cachedLabelParagraph,
      this.cachedPriceParagraph,
      this.fillPaint,
      this.strokePaint
    );
  }

  public drawLine(
    canvas: SkCanvas,
    path: SkPath,
    params: DrawParams,
    yPosition: number,
    bubbleWidth: number,
    maxBubbleWidth: number
  ): void {
    if (this.price === null) return;

    const { candleRegionHeight, maxPrice, minPrice } = params;
    const priceRange = maxPrice - minPrice || 1;
    if (this.price < minPrice || this.price > maxPrice) return;

    const priceY = candleRegionHeight - ((this.price - minPrice) / priceRange) * candleRegionHeight;

    this.drawLineFn(
      canvas,
      path,
      this.bubbleMarginLeft,
      yPosition,
      bubbleWidth,
      maxBubbleWidth,
      priceY,
      this.chartWidth,
      this.yAxisWidth,
      this.style
    );
  }

  public drawBubble(canvas: SkCanvas, yPosition: number, bubbleWidth: number): void {
    if (this.price === null || !this.cachedLabelParagraph || !this.cachedPriceParagraph) return;

    this.drawBubbleFn(
      canvas,
      yPosition,
      this.style,
      this.isDarkMode,
      bubbleWidth,
      this.cachedLabelParagraph,
      this.cachedPriceParagraph,
      this.fillPaint,
      this.strokePaint
    );
  }

  public setBuildParagraph(buildParagraph: (segments: TextSegment | TextSegment[]) => SkParagraph | null): void {
    this.buildParagraph = buildParagraph;
    this.updateCachedParagraphs();
  }

  public setColorMode(isDarkMode: boolean, backgroundColor: SkColor): void {
    this.isDarkMode = isDarkMode;
    this.style.bottomShadowPaint.setColor(backgroundColor);
    this.style.bottomShadowPaint.setAlphaf(0.48);
    this.style.bottomShadowPaint.setImageFilter(Skia.ImageFilter.MakeDropShadow(0, 4, 5, 5, backgroundColor, null));
    this.style.topShadowPaint.setColor(backgroundColor);
    this.style.topShadowPaint.setAlphaf(0.48);
    this.style.topShadowPaint.setImageFilter(Skia.ImageFilter.MakeDropShadow(0, -4, 5, 5, backgroundColor, null));
  }

  public dispose(): void {
    this.disposeIndicatorStyle(this.style);
  }
}
