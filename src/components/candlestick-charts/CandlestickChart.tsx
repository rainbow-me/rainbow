import {
  BlendMode,
  Canvas2 as Canvas,
  ClipOp,
  PaintStyle,
  Picture,
  SkCanvas,
  SkColor,
  SkPaint,
  SkParagraph,
  SkPicture,
  Skia,
  StrokeCap,
  StrokeJoin,
  createPicture,
} from '@shopify/react-native-skia';
import { dequal } from 'dequal';
import { cloneDeep, merge } from 'lodash';
import React, { memo, useEffect, useMemo, useRef } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector, State as GestureState } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  SharedValue,
  WithSpringConfig,
  executeOnUIRuntimeSync,
  runOnUI,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { triggerHaptics } from 'react-native-turbo-haptics';
import { SPRING_CONFIGS, TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { Inline, SkiaText, Text, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import { getColorForTheme } from '@/design-system/color/useForegroundColor';
import { TextSegment, useSkiaText } from '@/design-system/components/SkiaText/useSkiaText';
import { NativeCurrencyKey } from '@/entities';
import { convertAmountToNativeDisplayWorklet as formatPrice } from '@/helpers/utilities';
import { useWorkletClass } from '@/hooks/reanimated/useWorkletClass';
import { useCleanup } from '@/hooks/useCleanup';
import { useStableValue } from '@/hooks/useStableValue';
import { supportedNativeCurrencies } from '@/references';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { clamp, opacity, opacityWorklet } from '@/__swaps__/utils/swaps';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { Animator } from './classes/Animator';
import { EmaIndicator, IndicatorBuilder, IndicatorKey } from './classes/IndicatorBuilder';
import { TimeFormatter } from './classes/TimeFormatter';
import { generateMockCandleData } from './mockData';
import { Bar } from './types';
import { ActiveCandleCard } from './ActiveCandleCard';

type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type CandlestickChartProps = {
  backgroundColor?: string;
  candles?: Bar[];
  chartHeight?: number;
  chartWidth?: number;
  config?: DeepPartial<Omit<CandlestickConfig, 'chart'> & { chart: Omit<CandlestickConfig['chart'], 'backgroundColor'> }>;
  showChartControls?: boolean;
  isChartGestureActive: SharedValue<boolean>;
};

export type CandlestickConfig = {
  activeCandleCard: {
    height: number;
    style: StyleProp<ViewStyle>;
  };

  animation: {
    enableCrosshairPulse: boolean;
    springConfig: WithSpringConfig;
  };

  candles: {
    initialWidth: number;
    maxBorderRadius: number;
    maxWidth: number;
    minWidth: number;
    /**
     * Ratio of the space between candles to the width of the candles.
     * @default 0.2833
     */
    spacingRatio: number;
    strokeColor: string;
    strokeWidth: number;
  };

  chart: {
    /**
     * Gap between the chart and the active candle card, in pixels.
     * @default 16
     */
    activeCandleCardGap: number;
    backgroundColor: string;
    /**
     * Vertical padding percentage to apply to the candle region, from 0 to 1.
     * @default 0.1
     */
    candlesPaddingRatioVertical: number;
    panGestureDeceleration: number;
    /**
     * Gap between the chart and the x-axis labels, in pixels.
     * @default 10
     */
    xAxisGap: number;
    /**
     * Height of the x-axis labels, in pixels.
     * @default 13
     */
    xAxisHeight: number;
    /**
     * Horizontal inset to apply to the x-axis, in pixels.
     * @default 16
     */
    xAxisInset: number;
    /**
     * Left padding to apply to the y-axis, in pixels.
     * @default 12
     */
    yAxisPaddingLeft: number;
    /**
     * Right padding to apply to the y-axis, in pixels.
     * @default 8
     */
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

  grid: {
    color: string;
    dotted: boolean;
    strokeWidth: number;
  };

  indicators: {
    strokeWidth: number;
  };

  priceBubble: {
    height: number;
    hidden: boolean;
    paddingHorizontal: number;
  };

  volume: {
    color: string;
    /**
     * Max percentage of chart height that the volume bars should occupy, from 0 to 1.
     * @default 0.175
     */
    heightFactor: number;
  };
};

export const DEFAULT_CANDLESTICK_CONFIG: CandlestickConfig = {
  activeCandleCard: {
    height: 75,
    style: {
      backgroundColor: '#141619',
      borderRadius: 20,
      height: 75,
      width: 350,
    },
  },

  animation: {
    enableCrosshairPulse: false,
    springConfig: { mass: 0.1, stiffness: 50, damping: 50 },
  },

  candles: {
    initialWidth: 9,
    maxBorderRadius: 6,
    maxWidth: 20,
    minWidth: 2,
    spacingRatio: 3.4 / 12,
    strokeColor: opacity(globalColors.white100, 0.1),
    strokeWidth: 1,
  },

  chart: {
    activeCandleCardGap: 16,
    backgroundColor: '#141619',
    candlesPaddingRatioVertical: 0.1,
    panGestureDeceleration: 0.9975,
    xAxisGap: 10,
    xAxisHeight: 13,
    xAxisInset: 16,
    yAxisPaddingLeft: 12,
    yAxisPaddingRight: 8,
  },

  crosshair: {
    dotColor: globalColors.white100,
    lineColor: globalColors.white100,
    dotSize: 3,
    dotStrokeWidth: 5 / 3,
    strokeWidth: 2,
    yOffset: -72,
  },

  grid: {
    color: '#222528',
    dotted: true,
    strokeWidth: 1,
  },

  indicators: {
    strokeWidth: 4 / 3,
  },

  priceBubble: {
    height: 18,
    hidden: true,
    paddingHorizontal: 5,
  },

  volume: {
    color: '#2B2D2F',
    heightFactor: 0.175,
  },
};

/**
 * Finds the value at a specific percentile position in an unsorted array.
 *
 * For example, if k=0, returns the minimum value; if k=arr.length-1, returns the maximum.
 * Efficiently calculates percentiles for volume analysis without fully sorting the array.
 *
 * @param array      Input array of numbers
 * @param percentile Target percentile position index (0-based)
 * @returns          The value at the specified percentile position
 */
function findPercentile(array: number[], percentile: number): number {
  'worklet';
  const a = array.slice();
  let left = 0,
    right = a.length - 1;
  while (left <= right) {
    const pivot = a[right];
    let i = left;
    for (let j = left; j < right; j++) {
      if (a[j] < pivot) {
        [a[i], a[j]] = [a[j], a[i]];
        i += 1;
      }
    }
    [a[i], a[right]] = [a[right], a[i]];
    if (i === percentile) return a[i];
    if (i < percentile) left = i + 1;
    else right = i - 1;
  }
  return a[Math.min(percentile, a.length - 1)];
}

/**
 * Creates a blank SkPicture to serve as an initial placeholder.
 */
function createBlankPicture(width: number, height: number): SkPicture {
  'worklet';
  return createPicture(
    () => {
      return;
    },
    { width, height }
  );
}

function getEmaPeriod(type: IndicatorKey): number {
  'worklet';
  switch (type) {
    case 'EMA9':
      return 9;
    case 'EMA20':
      return 20;
    case 'EMA50':
      return 50;
  }
}

function getYOffsetForPriceLabel(index: number, textHeight: number): number {
  'worklet';
  if (index === 0) return 6;
  return -(textHeight ?? 0) / 2 - 0.5;
}

function getYAxisLabelWidth(maxCharacters: number): number {
  'worklet';
  return Math.ceil(maxCharacters * (52 / 6));
}

const EMA_INDICATORS: IndicatorKey[] = ['EMA9', 'EMA20', 'EMA50'];
const VOLUME_DECAY_FACTOR = 0.97;

class CandlestickChartManager {
  private __workletClass = true;

  private backgroundColor: SkColor;
  private blankPicture: SkPicture;
  private buildParagraph: (segments: TextSegment | TextSegment[]) => SkParagraph | null;
  private candleStrokeColor: SkColor;
  private candleWidth: number;
  private candles: Bar[];
  private chartHeight: number;
  private chartWidth: number;
  private config: CandlestickConfig;
  private isDarkMode: boolean;
  private nativeCurrency: { currency: NativeCurrencyKey; decimals: number };
  private volumeBarColor: SkColor;
  private yAxisWidth: number;

  private activeCandle: SharedValue<Bar | undefined>;
  private chartMaxY: SharedValue<number>;
  private chartMinY: SharedValue<number>;
  private chartPicture: SharedValue<SkPicture>;
  private chartScale: SharedValue<number>;
  private crosshairPicture: SharedValue<SkPicture>;
  private indicatorPicture: SharedValue<SkPicture>;
  private isDecelerating: SharedValue<boolean>;
  private isChartGestureActive: SharedValue<boolean>;
  private maxDisplayedVolume: SharedValue<number>;
  private offset: SharedValue<number>;
  private xAxisLabels: SharedValue<string[]>;

  private lastVisibleRange = { startIndex: -1, endIndex: -1 };
  private maxVolumeDisplayed = 0;
  private panStartOffset = 0;
  private pinchInfo = { startFocalX: 0, startOffset: 0, startWidth: 0 };

  private animator = new Animator(() => this.rebuildChart());
  private indicatorBuilder = new IndicatorBuilder<IndicatorKey>();
  private timeFormatter = new TimeFormatter();

  private pictureRecorder = Skia.PictureRecorder();

  private colors = {
    black: Skia.Color('#000000'),
    crosshairDot: Skia.Color('#FFFFFF'),
    crosshairLine: Skia.Color('#FFFFFF'),
    crosshairPriceBubble: Skia.Color(getColorForTheme('fill', 'light')),
    labelSecondary: Skia.Color(getColorForTheme('labelSecondary', 'light')),
    labelQuinary: Skia.Color(getColorForTheme('labelQuinary', 'light')),
    green: Skia.Color('#00CC4B'),
    red: Skia.Color('#FA5343'),
    transparent: Skia.Color('transparent'),
    white: Skia.Color('#FFFFFF'),

    EMA9: Skia.Color('white'),
    EMA20: Skia.Color('#42A5F5'),
    EMA50: Skia.Color('#AB47BC'),
  };

  private paints = {
    background: Skia.Paint(),
    bottomShadow: Skia.Paint(),
    candleBody: Skia.Paint(),
    candleWick: Skia.Paint(),
    candleStroke: Skia.Paint(),
    chartArea: Skia.Paint(),
    crosshairDot: Skia.Paint(),
    crosshairLine: Skia.Paint(),
    grid: Skia.Paint(),
    text: Skia.Paint(),
    topShadow: Skia.Paint(),
    volume: Skia.Paint(),

    EMA9: Skia.Paint(),
    EMA20: Skia.Paint(),
    EMA50: Skia.Paint(),
  };

  // ============ Constructor ================================================== //

  constructor({
    activeCandle,
    buildParagraph,
    candles,
    chartHeight,
    chartMaxY,
    chartMinY,
    chartPicture,
    chartScale,
    chartWidth,
    chartXOffset,
    config,
    crosshairPicture,
    indicatorPicture,
    isChartGestureActive,
    isDarkMode,
    isDecelerating,
    maxDisplayedVolume,
    nativeCurrency,
    xAxisLabels,
  }: {
    activeCandle: SharedValue<Bar | undefined>;
    buildParagraph: (segments: TextSegment | TextSegment[]) => SkParagraph | null;
    candles: Bar[];
    chartHeight: number;
    chartMaxY: SharedValue<number>;
    chartMinY: SharedValue<number>;
    chartPicture: SharedValue<SkPicture>;
    chartScale: SharedValue<number>;
    chartWidth: number;
    chartXOffset: SharedValue<number>;
    config: CandlestickConfig;
    crosshairPicture: SharedValue<SkPicture>;
    indicatorPicture: SharedValue<SkPicture>;
    isChartGestureActive: SharedValue<boolean>;
    isDarkMode: boolean;
    isDecelerating: SharedValue<boolean>;
    maxDisplayedVolume: SharedValue<number>;
    nativeCurrency: { currency: NativeCurrencyKey; decimals: number };
    xAxisLabels: SharedValue<string[]>;
  }) {
    // ========== Core State ==========
    this.backgroundColor = Skia.Color(config.chart.backgroundColor);
    this.blankPicture = createBlankPicture(chartWidth, chartHeight);
    this.buildParagraph = buildParagraph;
    this.candleStrokeColor = Skia.Color(config.candles.strokeColor);
    this.candleWidth = config.candles.initialWidth;
    this.candles = candles;
    this.chartHeight = chartHeight;
    this.chartWidth = chartWidth;
    this.config = config;
    this.isDarkMode = isDarkMode;
    this.nativeCurrency = nativeCurrency;
    this.volumeBarColor = Skia.Color(config.volume.color);

    // ========== Shared Values ==========
    this.activeCandle = activeCandle;
    this.chartMaxY = chartMaxY;
    this.chartMinY = chartMinY;
    this.chartPicture = chartPicture;
    this.chartScale = chartScale;
    this.crosshairPicture = crosshairPicture;
    this.indicatorPicture = indicatorPicture;
    this.isDecelerating = isDecelerating;
    this.isChartGestureActive = isChartGestureActive;
    this.maxDisplayedVolume = maxDisplayedVolume;
    this.offset = chartXOffset;
    this.xAxisLabels = xAxisLabels;

    // ========== Colors ==========
    this.colors.crosshairDot = Skia.Color(this.config.crosshair.dotColor);
    this.colors.crosshairLine = Skia.Color(this.config.crosshair.lineColor);

    if (isDarkMode) {
      this.colors.crosshairPriceBubble = Skia.Color(getColorForTheme('fill', 'dark'));
      this.colors.labelSecondary = Skia.Color(getColorForTheme('labelSecondary', 'dark'));
      this.colors.labelQuinary = Skia.Color(getColorForTheme('labelQuinary', 'dark'));
    }

    // ========== Paint Setup ==========
    this.paints.background.setColor(this.colors.transparent);
    this.paints.chartArea.setColor(this.colors.transparent);

    this.paints.candleBody.setAntiAlias(true);
    this.paints.candleBody.setDither(true);
    this.paints.candleBody.setBlendMode(BlendMode.Src);

    this.paints.candleStroke.setAntiAlias(true);
    this.paints.candleStroke.setDither(true);
    this.paints.candleStroke.setBlendMode(BlendMode.Plus);
    this.paints.candleStroke.setColor(this.candleStrokeColor);
    this.paints.candleStroke.setStrokeWidth(this.config.candles.strokeWidth);
    this.paints.candleStroke.setStyle(PaintStyle.Stroke);

    this.paints.candleWick.setStrokeCap(StrokeCap.Round);
    this.paints.candleWick.setAntiAlias(true);
    this.paints.candleWick.setDither(true);

    this.paints.volume.setColor(this.volumeBarColor);
    this.paints.volume.setAntiAlias(true);
    this.paints.volume.setDither(true);
    this.paints.volume.setBlendMode(BlendMode.Src);

    this.paints.text.setBlendMode(BlendMode.Src);

    this.paints.bottomShadow.setColor(this.backgroundColor);
    this.paints.bottomShadow.setAlphaf(0.48);
    this.paints.bottomShadow.setImageFilter(Skia.ImageFilter.MakeDropShadow(0, 4, 5, 5, this.backgroundColor, null));

    this.paints.topShadow.setColor(this.backgroundColor);
    this.paints.topShadow.setAlphaf(0.48);
    this.paints.topShadow.setImageFilter(Skia.ImageFilter.MakeDropShadow(0, -4, 5, 5, this.backgroundColor, null));

    this.paints.crosshairLine.setStrokeWidth(this.config.crosshair.strokeWidth);
    this.paints.crosshairLine.setStrokeCap(StrokeCap.Round);

    const crosshairPathEffect = Skia.PathEffect.MakeDash([0, 5], 5);
    this.paints.crosshairLine.setPathEffect(crosshairPathEffect);
    crosshairPathEffect.dispose();
    this.paints.crosshairLine.setColor(this.colors.crosshairLine);
    this.paints.crosshairLine.setAlphaf(0.6);

    this.paints.crosshairDot.setAntiAlias(true);
    if (!isDarkMode) {
      const color = opacityWorklet(this.config.crosshair.dotColor, 0.64);
      const shadowColor = Skia.Color(color);
      this.paints.crosshairDot.setImageFilter(Skia.ImageFilter.MakeDropShadow(0, 1, 2, 2, shadowColor, null));
    }

    this.paints.grid.setColor(Skia.Color(this.config.grid.color));
    this.paints.grid.setStrokeWidth(this.config.grid.strokeWidth);
    this.paints.grid.setAntiAlias(true);
    this.paints.grid.setDither(true);

    if (this.config.grid.dotted) {
      const dottedPathEffect = Skia.PathEffect.MakeDash([1.9, 2.9], 2);
      this.paints.grid.setPathEffect(dottedPathEffect);
      dottedPathEffect.dispose();
    }

    // ========== Indicators ==========
    this.indicatorBuilder.registerIndicators(
      EMA_INDICATORS.map(key => new EmaIndicator(key, getEmaPeriod(key), this.colors[key], this.config.indicators.strokeWidth))
    );

    const indicatorPathEffect = Skia.PathEffect.MakeCorner(6);

    this.paints.EMA9.setAntiAlias(true);
    this.paints.EMA9.setDither(true);
    this.paints.EMA9.setColor(this.colors.EMA9);
    this.paints.EMA9.setStrokeWidth(this.config.indicators.strokeWidth);
    this.paints.EMA9.setStrokeCap(StrokeCap.Round);
    this.paints.EMA9.setStrokeJoin(StrokeJoin.Round);
    this.paints.EMA9.setPathEffect(indicatorPathEffect);
    this.paints.EMA9.setStyle(PaintStyle.Stroke);

    this.paints.EMA20.setAntiAlias(true);
    this.paints.EMA20.setDither(true);
    this.paints.EMA20.setColor(this.colors.EMA20);
    this.paints.EMA20.setStrokeWidth(this.config.indicators.strokeWidth);
    this.paints.EMA20.setStrokeCap(StrokeCap.Round);
    this.paints.EMA20.setStrokeJoin(StrokeJoin.Round);
    this.paints.EMA20.setPathEffect(indicatorPathEffect);
    this.paints.EMA20.setStyle(PaintStyle.Stroke);

    this.paints.EMA50.setAntiAlias(true);
    this.paints.EMA50.setDither(true);
    this.paints.EMA50.setColor(this.colors.EMA50);
    this.paints.EMA50.setStrokeWidth(this.config.indicators.strokeWidth);
    this.paints.EMA50.setStrokeCap(StrokeCap.Round);
    this.paints.EMA50.setStrokeJoin(StrokeJoin.Round);
    this.paints.EMA50.setPathEffect(indicatorPathEffect);
    this.paints.EMA50.setStyle(PaintStyle.Stroke);

    indicatorPathEffect?.dispose();

    // ========== Initial Chart Build ==========
    const { min, max, startIndex, endIndex } = this.getPriceBounds();
    maxDisplayedVolume.value = this.getMaxDisplayedVolume(startIndex, endIndex);

    this.chartMinY.value = min;
    this.chartMaxY.value = max;
    this.yAxisWidth = this.getYAxisWidth(min, max);
    this.offset.value = this.getMinOffset();

    this.buildBaseCandlesPicture();
  }

  // ============ Chart Layout Utilities ======================================= //

  private getVisibleIndices(): { startIndex: number; endIndex: number } {
    const chartWidth = this.chartWidth;
    const stride = this.getStride(this.candleWidth);
    const rawStart = Math.floor((-this.offset.value - this.candleWidth) / stride) - 1;
    const rawEnd = Math.ceil((chartWidth - this.offset.value) / stride) + 1;
    const startIndex = Math.max(0, rawStart);
    const endIndex = Math.min(this.candles.length - 1, rawEnd);

    if (this.candles.length && (startIndex !== this.lastVisibleRange.startIndex || endIndex !== this.lastVisibleRange.endIndex)) {
      const startDate = this.timeFormatter.format(this.candles[startIndex].t);
      const endDate = this.timeFormatter.format(this.candles[endIndex].t);

      this.xAxisLabels.modify(labels => {
        labels[0] = startDate;
        labels[1] = endDate;
        return labels;
      });

      this.lastVisibleRange.startIndex = startIndex;
      this.lastVisibleRange.endIndex = endIndex;
    }

    return { startIndex, endIndex };
  }

  private getPriceBounds() {
    const { startIndex, endIndex } = this.getVisibleIndices();
    let min = Infinity;
    let max = -Infinity;

    for (let i = startIndex; i <= endIndex; i++) {
      const { l, h } = this.candles[i];
      if (l < min) min = l;
      if (h > max) max = h;
    }

    const indicatorRange = this.indicatorBuilder.getMinMaxForRange(startIndex, endIndex);
    if (indicatorRange) {
      if (indicatorRange.min < min) min = indicatorRange.min;
      if (indicatorRange.max > max) max = indicatorRange.max;
    }

    if (min === Infinity || max === -Infinity) return { min: 0, max: 1, startIndex, endIndex };

    const range = max - min || 1;
    const verticalPadding = range * this.config.chart.candlesPaddingRatioVertical;
    const newBounds = { min: min - verticalPadding, max: max + verticalPadding, startIndex, endIndex };
    this.yAxisWidth = this.getYAxisWidth(newBounds.min, newBounds.max);
    return newBounds;
  }

  private getMaxDisplayedVolume(startIndex: number, endIndex: number): number {
    const volumes: number[] = [];
    for (let i = startIndex; i <= endIndex; i++) volumes.push(this.candles[i].v);
    const p100 = findPercentile(volumes, volumes.length);
    this.maxVolumeDisplayed = Math.max(this.maxVolumeDisplayed * VOLUME_DECAY_FACTOR, p100);
    const maxVolume = this.maxVolumeDisplayed;
    return maxVolume;
  }

  private getNiceInterval(value: number): number {
    const exponent = Math.floor(Math.log10(value));
    const base = Math.pow(10, exponent);
    const fraction = value / base;

    let niceFraction: number;
    if (fraction <= 1.5) niceFraction = 1;
    else if (fraction <= 3) niceFraction = 2;
    else if (fraction <= 7) niceFraction = 5;
    else niceFraction = 10;

    return niceFraction * base;
  }

  private clampCandleWidth(width: number): number {
    return clamp(width, this.config.candles.minWidth, this.config.candles.maxWidth);
  }

  private clampOffset(value: number): number {
    const chartWidth = this.chartWidth - this.yAxisWidth;
    const stride = this.getStride(this.candleWidth);
    const totalCandlesWidth = this.candles.length * stride;
    const minOffset = chartWidth - totalCandlesWidth;
    return clamp(value, minOffset, 0);
  }

  private getPriceAtYPosition(y: number): number {
    const chartHeight = this.chartHeight;
    const minPrice = this.chartMinY.value;
    const maxPrice = this.chartMaxY.value;
    const candleRegionHeight = chartHeight - chartHeight * this.config.volume.heightFactor;
    const priceRange = Math.max(1, maxPrice - minPrice);
    return minPrice + (priceRange * (candleRegionHeight - y)) / candleRegionHeight;
  }

  private getStride(width: number): number {
    return width + width * this.config.candles.spacingRatio;
  }

  private getYAxisWidth(minPrice: number, maxPrice: number): number {
    const currencyDecimals = this.nativeCurrency.decimals;
    const maxCharacters = Math.max(minPrice.toFixed(currencyDecimals).length, maxPrice.toFixed(currencyDecimals).length);
    return this.config.chart.yAxisPaddingLeft + getYAxisLabelWidth(maxCharacters) + this.config.chart.yAxisPaddingRight;
  }

  // ============ Chart Drawing Methods ======================================== //

  private buildBaseCandlesPicture(): void {
    const canvas = this.pictureRecorder.beginRecording({
      height: this.chartHeight,
      width: this.chartWidth,
      x: 0,
      y: 0,
    });

    const candleWidth = this.candleWidth;
    const chartHeight = this.chartHeight;
    const chartWidth = this.chartWidth;

    canvas.clipRect({ x: 0, y: 0, width: chartWidth, height: chartHeight }, ClipOp.Intersect, true);

    const minPrice = this.chartMinY.value;
    const maxPrice = this.chartMaxY.value;
    const volumeRegionHeight = chartHeight * this.config.volume.heightFactor;
    const candleRegionHeight = chartHeight - volumeRegionHeight;
    const priceRange = Math.max(1, maxPrice - minPrice);

    function convertPriceToY(price: number): number {
      return candleRegionHeight - ((price - minPrice) / priceRange) * candleRegionHeight;
    }

    // ========== Grid Lines and Price Labels ==========
    const stride = this.getStride(candleWidth);
    const { startIndex, endIndex } = this.getVisibleIndices();
    const visibleCandles = chartWidth / stride;
    const rawInterval = visibleCandles / 6;
    const candleInterval = Math.max(1, Math.round(this.getNiceInterval(rawInterval)));
    const firstGridIndex = Math.ceil(startIndex / candleInterval) * candleInterval;

    for (let i = firstGridIndex; i <= endIndex; i += candleInterval) {
      const gx = i * stride + this.offset.value + candleWidth / 2;
      canvas.drawLine(gx, 0, gx, chartHeight, this.paints.grid);
    }

    const buildParagraph = this.buildParagraph;
    const labelX = chartWidth - this.yAxisWidth + this.config.chart.yAxisPaddingLeft;
    let labelHeight: number | undefined = undefined;

    for (let i = 0; i <= 3; i++) {
      const y = chartHeight * (i / 4) + 0.5;
      canvas.drawLine(0, y, chartWidth, y, this.paints.grid);

      const formattedPrice = formatPrice(this.getPriceAtYPosition(y), this.nativeCurrency.currency);

      const paragraph = buildParagraph({
        color: this.colors.labelQuinary,
        foregroundPaint: this.paints.text,
        text: formattedPrice,
      });

      if (paragraph) {
        paragraph.layout(chartWidth);
        if (!labelHeight) labelHeight = paragraph.getLineMetrics()[0].height;
        paragraph.paint(canvas, labelX, y + getYOffsetForPriceLabel(i, labelHeight));
      }
    }

    // ========== Volume Bars ==========
    for (let i = startIndex; i <= endIndex; i++) {
      const candle = this.candles[i];
      const cornerRadius = Math.min(this.config.candles.maxBorderRadius, candleWidth / 3);
      const fractionOfMax = candle.v / this.maxDisplayedVolume.value;
      const height = fractionOfMax * volumeRegionHeight;
      const x = i * stride + this.offset.value;
      const y = chartHeight - height;
      canvas.drawRRect({ rect: { height, width: candleWidth, x, y }, rx: cornerRadius, ry: cornerRadius }, this.paints.volume);
    }

    // ========== Current Price Line ==========
    const lastCandle = this.candles[this.candles.length - 1];
    const buffer = (maxPrice - minPrice) * 0.02;
    const isCurrentPriceInRange = lastCandle && minPrice - buffer <= lastCandle.c && lastCandle.c <= maxPrice + buffer;

    let lastCandleColor: SkColor | undefined;
    let currentPriceY: number | undefined;

    if (isCurrentPriceInRange) {
      lastCandleColor = lastCandle.c >= lastCandle.o ? this.colors.green : this.colors.red;
      currentPriceY = convertPriceToY(lastCandle.c);
      this.paints.candleWick.setStrokeWidth(1);
      this.paints.candleWick.setColor(lastCandleColor);
      this.paints.candleWick.setAlphaf(0.4);
      canvas.drawLine(0, currentPriceY, chartWidth - this.yAxisWidth / 2, currentPriceY, this.paints.candleWick);
    }

    // ========== Candle Wicks ==========
    this.paints.candleWick.setColor(this.colors.green);
    this.paints.candleWick.setAlphaf(0.7);
    for (let i = startIndex; i <= endIndex; i++) {
      const candle = this.candles[i];
      if (candle.c < candle.o) continue;
      const x = i * stride + this.offset.value + candleWidth / 2;
      canvas.drawLine(x, convertPriceToY(candle.h), x, convertPriceToY(candle.l), this.paints.candleWick);
    }

    this.paints.candleWick.setColor(this.colors.red);
    this.paints.candleWick.setAlphaf(0.7);
    for (let i = startIndex; i <= endIndex; i++) {
      const candle = this.candles[i];
      if (candle.c >= candle.o) continue;
      const x = i * stride + this.offset.value + candleWidth / 2;
      canvas.drawLine(x, convertPriceToY(candle.h), x, convertPriceToY(candle.l), this.paints.candleWick);
    }

    // ========== Candle Bodies ==========
    const bodyPaint = this.paints.candleBody;
    const strokePaint = this.paints.candleStroke;
    const strokeWidth = this.config.candles.strokeWidth;

    const drawBody = (candle: Bar, x: number) => {
      const top = convertPriceToY(Math.max(candle.o, candle.c));
      const bottom = convertPriceToY(Math.min(candle.o, candle.c));
      const height = Math.max(0.7, bottom - top);
      const cornerRadius = Math.min(this.config.candles.maxBorderRadius, candleWidth / 3);
      canvas.drawRRect({ rect: { height, width: candleWidth, x, y: top }, rx: cornerRadius, ry: cornerRadius }, bodyPaint);

      if (!this.isDarkMode || candleWidth < strokeWidth * 4) return;
      canvas.drawRRect(
        {
          rect: { height: height - strokeWidth, width: candleWidth - strokeWidth, x: x + strokeWidth / 2, y: top + strokeWidth / 2 },
          rx: cornerRadius - strokeWidth / 2,
          ry: cornerRadius - strokeWidth / 2,
        },
        strokePaint
      );
    };

    bodyPaint.setColor(this.colors.green);
    for (let i = startIndex; i <= endIndex; i++) {
      const candle = this.candles[i];
      if (candle.c < candle.o) continue;
      drawBody(candle, i * stride + this.offset.value);
    }

    bodyPaint.setColor(this.colors.red);
    for (let i = startIndex; i <= endIndex; i++) {
      const candle = this.candles[i];
      if (candle.c >= candle.o) continue;
      drawBody(candle, i * stride + this.offset.value);
    }

    // ========== Current Price Bubble ==========
    if (isCurrentPriceInRange && currentPriceY && lastCandleColor) {
      this.drawTextBubble({
        canvas,
        centerY: currentPriceY,
        color: lastCandleColor,
        leftX: labelX,
        priceOrLabel: lastCandle.c,
        strokeOpacity: 0.15,
      });
    }

    const oldPicture = this.chartPicture.value;
    this.chartPicture.value = this.pictureRecorder.finishRecordingAsPicture();
    oldPicture.dispose();
  }

  private buildIndicatorPicture(): void {
    const indicatorPicture = this.indicatorPicture;

    if (!this.indicatorBuilder.activeIndicators.size) {
      if (indicatorPicture.value !== this.blankPicture) {
        indicatorPicture.value = this.blankPicture;
      }
      return;
    }

    const canvas = this.pictureRecorder.beginRecording({
      height: this.chartHeight,
      width: this.chartWidth,
      x: 0,
      y: 0,
    });

    const chartWidth = this.chartWidth;
    canvas.clipRect({ x: 0, y: 0, width: chartWidth, height: this.chartHeight }, ClipOp.Intersect, true);

    const { startIndex, endIndex } = this.getVisibleIndices();
    const candleWidth = this.candleWidth;
    const stride = this.getStride(candleWidth);
    const minPrice = this.chartMinY.value;
    const maxPrice = this.chartMaxY.value;
    const volumeRegionHeight = this.chartHeight * this.config.volume.heightFactor;
    const candleRegionHeight = this.chartHeight - volumeRegionHeight;

    this.indicatorBuilder.drawAll(canvas, {
      candleRegionHeight,
      candleWidth,
      endIndex,
      maxPrice,
      minPrice,
      offsetX: this.offset.value,
      startIndex,
      stride,
    });

    const oldPicture = this.indicatorPicture.value;
    indicatorPicture.value = this.pictureRecorder.finishRecordingAsPicture();
    oldPicture.dispose();
  }

  private buildCrosshairPicture(cx: number, cy: number, active: boolean): void {
    const activeCandle = this.activeCandle;
    const crosshairPicture = this.crosshairPicture;

    if (!active) {
      this.isChartGestureActive.value = false;
      if (activeCandle.value) activeCandle.value = undefined;
      if (crosshairPicture.value !== this.blankPicture) {
        crosshairPicture.value = this.blankPicture;
      }
      return;
    }

    const canvas = this.pictureRecorder.beginRecording({
      height: this.chartHeight,
      width: this.chartWidth,
      x: 0,
      y: 0,
    });

    const candleWidth = this.candleWidth;
    const config = this.config;
    const isDarkMode = this.isDarkMode;
    const stride = this.getStride(candleWidth);

    const unclampedIndex = Math.round((cx - this.offset.value - candleWidth / 2) / stride);
    const nearestCandleIndex = clamp(unclampedIndex, 0, this.candles.length - 1);
    const snappedX = nearestCandleIndex * stride + this.offset.value + candleWidth / 2;
    const yWithOffset = cy + config.crosshair.yOffset;
    const verticalInset = config.crosshair.strokeWidth / 2;

    canvas.drawLine(0, yWithOffset, this.chartWidth, yWithOffset, this.paints.crosshairLine);
    canvas.drawLine(snappedX, 0 + verticalInset, snappedX, this.chartHeight - verticalInset, this.paints.crosshairLine);

    this.paints.crosshairDot.setBlendMode(isDarkMode ? BlendMode.Overlay : BlendMode.SrcOver);
    this.paints.crosshairDot.setColor(isDarkMode ? this.colors.black : this.colors.crosshairDot);
    if (!isDarkMode) this.paints.crosshairDot.setAlphaf(0.08);

    canvas.drawCircle(
      snappedX,
      yWithOffset,
      config.crosshair.dotSize + config.crosshair.dotStrokeWidth / (isDarkMode ? 1 : 0.2),
      this.paints.crosshairDot
    );

    if (isDarkMode) this.paints.crosshairDot.setBlendMode(BlendMode.SrcOver);
    this.paints.crosshairDot.setColor(isDarkMode ? this.colors.crosshairDot : this.colors.white);
    canvas.drawCircle(snappedX, yWithOffset, config.crosshair.dotSize, this.paints.crosshairDot);

    const newActiveCandle = this.candles[nearestCandleIndex];
    const priceAtYPosition = this.getPriceAtYPosition(yWithOffset);

    if (newActiveCandle && !this.config.priceBubble.hidden) {
      this.drawTextBubble({
        canvas,
        centerY: yWithOffset,
        color: this.colors.crosshairPriceBubble,
        leftX: snappedX + 20,
        priceOrLabel: priceAtYPosition,
        stabilizePriceWidth: true,
        strokeOpacity: 0.12,
        textColor: this.colors.labelSecondary,
      });
    }

    activeCandle.value = newActiveCandle;
    this.isChartGestureActive.value = true;

    const oldPicture = this.crosshairPicture.value;
    crosshairPicture.value = this.pictureRecorder.finishRecordingAsPicture();
    oldPicture.dispose();
  }

  private handleAnimations(animate: boolean, forceRebuildBounds: boolean): void {
    const { startIndex: lastStartIndex, endIndex: lastEndIndex } = this.lastVisibleRange;
    const { min, max, startIndex, endIndex } = this.getPriceBounds();

    if (animate) {
      if (forceRebuildBounds || startIndex !== lastStartIndex || endIndex !== lastEndIndex) {
        this.animator.spring([this.chartMinY, this.chartMaxY], [min, max], this.config.animation.springConfig);

        const maxDisplayedVolume = this.getMaxDisplayedVolume(startIndex, endIndex);
        if (forceRebuildBounds || maxDisplayedVolume !== this.maxDisplayedVolume.value) {
          this.animator.spring(this.maxDisplayedVolume, maxDisplayedVolume, this.config.animation.springConfig);
        }
      }
      return;
    }

    if (forceRebuildBounds || startIndex !== lastStartIndex || endIndex !== lastEndIndex) {
      this.chartMinY.value = min;
      this.chartMaxY.value = max;

      const maxDisplayedVolume = this.getMaxDisplayedVolume(startIndex, endIndex);
      if (forceRebuildBounds || maxDisplayedVolume !== this.maxDisplayedVolume.value) {
        this.maxDisplayedVolume.value = maxDisplayedVolume;
      }
    }
  }

  private drawTextBubble({
    canvas,
    centerY,
    color,
    leftX,
    priceOrLabel,
    stabilizePriceWidth,
    strokeOpacity,
    textColor,
  }: {
    canvas: SkCanvas;
    centerY: number;
    color: SkColor;
    leftX: number;
    priceOrLabel: number | string;
    stabilizePriceWidth?: boolean;
    strokeOpacity: number;
    textColor?: SkColor;
  }): void {
    const didProvideRawPrice = typeof priceOrLabel === 'number';
    const formattedPrice = didProvideRawPrice ? formatPrice(priceOrLabel, this.nativeCurrency.currency) : priceOrLabel;
    const paragraph = this.buildParagraph({ color: textColor ?? color, text: formattedPrice });
    if (!paragraph) return;

    paragraph.layout(this.chartWidth);
    const lineMetrics = paragraph.getLineMetrics()[0];
    const labelHeight = lineMetrics.height;

    let labelWidth: number;
    if (stabilizePriceWidth && didProvideRawPrice) {
      const currencyDecimals = this.nativeCurrency.decimals;
      labelWidth = getYAxisLabelWidth(priceOrLabel.toFixed(currencyDecimals).length) - 2;
    } else {
      labelWidth = lineMetrics.width;
    }

    const bubbleHeight = this.config.priceBubble.height;
    const bubblePaddingHorizontal = this.config.priceBubble.paddingHorizontal;
    const bubbleY = centerY - bubbleHeight / 2;

    this.paints.candleBody.setColor(color);
    this.paints.candleBody.setAlphaf(0.24);

    this.paints.candleStroke.setColor(color);
    this.paints.candleStroke.setAlphaf(strokeOpacity);

    const bubbleRect = {
      rect: {
        height: bubbleHeight,
        width: labelWidth + bubblePaddingHorizontal * 2,
        x: leftX - bubblePaddingHorizontal,
        y: bubbleY,
      },
      rx: bubbleHeight / 2,
      ry: bubbleHeight / 2,
    };

    canvas.drawRRect(bubbleRect, this.paints.bottomShadow);
    canvas.drawRRect(bubbleRect, this.paints.topShadow);
    canvas.drawRRect(bubbleRect, this.paints.candleBody);

    if (this.isDarkMode) {
      bubbleRect.rect.height -= this.config.candles.strokeWidth;
      bubbleRect.rect.width -= this.config.candles.strokeWidth;
      bubbleRect.rect.x += this.config.candles.strokeWidth / 2;
      bubbleRect.rect.y += this.config.candles.strokeWidth / 2;
      canvas.drawRRect(bubbleRect, this.paints.candleStroke);
    }

    this.paints.candleBody.setAlphaf(1);
    this.paints.candleStroke.setColor(this.candleStrokeColor);
    this.paints.candleStroke.setAlphaf(0.1);

    const textX = leftX;
    const textY = bubbleY + (bubbleHeight - labelHeight) / 2;
    paragraph.paint(canvas, textX, textY);
  }

  // ============ Public Methods =============================================== //

  public dispose(): void {
    this.candles = [];
    this.crosshairPicture.value.dispose();
    this.chartPicture.value.dispose();
    this.indicatorPicture.value.dispose();
    this.pictureRecorder.dispose();

    this.animator.dispose();
    this.indicatorBuilder.dispose();

    for (const paint of Object.values(this.paints)) paint.dispose();
  }

  public getMinOffset(): number {
    return this.chartWidth - this.yAxisWidth - this.candles.length * this.getStride(this.candleWidth);
  }

  public rebuildChart(animate = true, forceRebuildBounds = false): void {
    this.handleAnimations(animate, forceRebuildBounds);
    this.buildBaseCandlesPicture();
    this.buildIndicatorPicture();
  }

  public setCandles(newCandles: Bar[]): void {
    const wasPinnedToRight = this.offset.value === this.getMinOffset();
    this.candles = newCandles;
    this.lastVisibleRange.startIndex = -1;
    this.lastVisibleRange.endIndex = -1;
    this.maxDisplayedVolume.value = -1;
    this.indicatorBuilder.computeAll(newCandles);
    if (wasPinnedToRight) {
      this.getPriceBounds();
      this.offset.value = this.getMinOffset();
    }
    this.rebuildChart(false, true);
  }

  public setColorMode(
    colorMode: 'dark' | 'light',
    backgroundColor: string | undefined,
    providedConfig: CandlestickChartProps['config']
  ): void {
    const isDarkMode = colorMode === 'dark';
    this.isDarkMode = isDarkMode;
    this.colors.crosshairPriceBubble = Skia.Color(getColorForTheme('fill', colorMode));
    this.colors.labelSecondary = Skia.Color(getColorForTheme('labelSecondary', colorMode));
    this.colors.labelQuinary = Skia.Color(getColorForTheme('labelQuinary', colorMode));

    if (backgroundColor) {
      this.backgroundColor = Skia.Color(backgroundColor);
      this.paints.bottomShadow.setColor(this.backgroundColor);
      this.paints.bottomShadow.setAlphaf(0.48);
      this.paints.bottomShadow.setImageFilter(Skia.ImageFilter.MakeDropShadow(0, 4, 5, 5, this.backgroundColor, null));
      this.paints.topShadow.setColor(this.backgroundColor);
      this.paints.topShadow.setAlphaf(0.48);
      this.paints.topShadow.setImageFilter(Skia.ImageFilter.MakeDropShadow(0, -4, 5, 5, this.backgroundColor, null));
    }

    if (providedConfig?.crosshair?.dotColor) {
      this.colors.crosshairDot = Skia.Color(providedConfig.crosshair.dotColor);
      if (!isDarkMode) {
        const color = opacityWorklet(providedConfig.crosshair.dotColor, 0.64);
        const shadowColor = Skia.Color(color);
        this.paints.crosshairDot.setImageFilter(Skia.ImageFilter.MakeDropShadow(0, 1, 2, 2, shadowColor, null));
      }
    } else {
      this.colors.crosshairDot = Skia.Color(DEFAULT_CANDLESTICK_CONFIG.crosshair.dotColor);
    }

    if (isDarkMode) this.paints.crosshairDot.setImageFilter(null);

    if (providedConfig?.crosshair?.lineColor) {
      this.colors.crosshairLine = Skia.Color(providedConfig.crosshair.lineColor);
    } else {
      this.colors.crosshairLine = Skia.Color(DEFAULT_CANDLESTICK_CONFIG.crosshair.lineColor);
    }

    this.paints.crosshairLine.setColor(this.colors.crosshairLine);
    this.paints.crosshairLine.setAlphaf(0.6);

    if (providedConfig?.grid?.color) {
      this.paints.grid.setColor(Skia.Color(providedConfig.grid.color));
    } else {
      this.paints.grid.setColor(Skia.Color(DEFAULT_CANDLESTICK_CONFIG.grid.color));
    }

    if (providedConfig?.volume?.color) {
      this.volumeBarColor = Skia.Color(providedConfig.volume.color);
    } else {
      this.volumeBarColor = Skia.Color(DEFAULT_CANDLESTICK_CONFIG.volume.color);
    }

    this.rebuildChart(false, true);
  }

  // ============ Indicator Toggles ============================================ //

  public showIndicator(type: IndicatorKey) {
    if (!this.indicatorBuilder.activeIndicators.has(type)) {
      this.indicatorBuilder.showIndicators(type, this.candles);
      this.rebuildChart(true, true);
    }
  }

  public hideIndicator(type: IndicatorKey) {
    if (this.indicatorBuilder.activeIndicators.has(type)) {
      this.indicatorBuilder.hideIndicators(type);
      this.rebuildChart(true, true);
    }
  }

  public toggleIndicator(type: IndicatorKey | 'all') {
    if (type === 'all') {
      if (this.indicatorBuilder.activeIndicators.size === EMA_INDICATORS.length) {
        this.indicatorBuilder.hideIndicators(EMA_INDICATORS);
      } else {
        this.indicatorBuilder.showIndicators(EMA_INDICATORS, this.candles);
      }
      this.rebuildChart(true, true);
      return;
    }
    this.indicatorBuilder.activeIndicators.has(type) ? this.hideIndicator(type) : this.showIndicator(type);
  }

  // ============ Gesture Handlers ============================================= //

  public onLongPressStart(x: number, y: number): void {
    triggerHaptics('soft');
    if (this.config.animation.enableCrosshairPulse) {
      requestAnimationFrame(() => {
        this.chartScale.value = withTiming(0.9925, TIMING_CONFIGS.buttonPressConfig, isFinished => {
          if (!isFinished) return;
          triggerHaptics('soft');
          this.chartScale.value = withTiming(1, TIMING_CONFIGS.tabPressConfig);
        });
      });
    }
    this.buildCrosshairPicture(x, y, true);
  }

  public onLongPressMove(x: number, y: number, state: GestureState): void {
    const isActive = state === GestureState.ACTIVE;
    this.buildCrosshairPicture(x, y, isActive);
  }

  public onLongPressEnd(x: number, y: number, state: GestureState): void {
    if (state === GestureState.END) triggerHaptics('rigid');
    this.buildCrosshairPicture(x, y, false);
    this.activeCandle.value = undefined;
  }

  public onPanStart(): void {
    this.panStartOffset = this.offset.value;
    if (this.isDecelerating.value) this.isDecelerating.value = false;
  }

  public onPanChange(changeX: number): void {
    const currentOffset = this.offset.value;
    const proposed = currentOffset + changeX;
    const clamped = this.clampOffset(proposed);

    if (clamped !== currentOffset) {
      this.animator.direct(this.offset, clamped);
      if ((!clamped || clamped === this.getMinOffset()) && currentOffset !== this.panStartOffset) {
        triggerHaptics('soft');
      }
    }
  }

  public onPanEnd(velocityX: number): void {
    if (Math.abs(velocityX) > 100) {
      this.isDecelerating.value = true;

      this.animator.decay(
        this.offset,
        {
          clamp: [this.getMinOffset(), 0],
          deceleration: this.config.chart.panGestureDeceleration,
          velocity: velocityX,
        },
        () => {
          if (this.isDecelerating.value) this.isDecelerating.value = false;
        }
      );
    }
  }

  public onPinchStart(focalX: number): void {
    this.pinchInfo.startFocalX = focalX;
    this.pinchInfo.startOffset = this.offset.value;
    this.pinchInfo.startWidth = this.candleWidth;
    if (this.isDecelerating.value) this.isDecelerating.value = false;
  }

  public onPinchUpdate(scale: number): void {
    const { startFocalX, startOffset, startWidth } = this.pinchInfo;
    const newWidth = this.clampCandleWidth(startWidth * scale);
    const newStride = this.getStride(newWidth);
    const oldStride = this.getStride(startWidth);
    const candleIndexAtFocalX = (startFocalX - startOffset) / oldStride;
    const safeIndex = clamp(candleIndexAtFocalX, 0, this.candles.length - 1);

    if (newWidth === this.candleWidth) return;

    this.candleWidth = newWidth;
    this.animator.direct(this.offset, this.clampOffset(startFocalX - safeIndex * newStride));
  }
}

function useCandlestickChart({
  backgroundColor,
  candles,
  chartHeight,
  chartWidth,
  isChartGestureActive,
  isDarkMode,
  providedConfig,
}: {
  backgroundColor: string;
  candles: Bar[];
  chartHeight: number;
  chartWidth: number;
  isChartGestureActive: SharedValue<boolean>;
  isDarkMode: boolean;
  providedConfig: CandlestickChartProps['config'];
}) {
  const { config, initialPicture, xAxisWidth } = useStableValue(() =>
    buildChartConfig({
      backgroundColor,
      chartHeight,
      chartWidth,
      providedConfig,
    })
  );

  const buildParagraph = useSkiaText({
    align: 'left',
    color: 'labelQuinary',
    size: '11pt',
    weight: 'bold',
  });

  const xAxisLabelPaint = useStableValue(() => {
    const paint = Skia.Paint();
    paint.setColor(Skia.Color(getColorForTheme('labelQuinary', isDarkMode ? 'dark' : 'light')));
    return paint;
  });

  const activeCandle = useSharedValue<Bar | undefined>(undefined);
  const chartMaxY = useSharedValue(0);
  const chartMinY = useSharedValue(0);
  const chartScale = useSharedValue(1);
  const chartXOffset = useSharedValue(getInitialOffset(candles, chartWidth, config));
  const isDecelerating = useSharedValue(false);
  const maxDisplayedVolume = useSharedValue(0);
  const xAxisLabels = useSharedValue<string[]>([]);

  const chartPicture = useSharedValue(initialPicture);
  const crosshairPicture = useSharedValue(initialPicture);
  const indicatorPicture = useSharedValue(initialPicture);

  const chartManager = useWorkletClass(getNativeCurrency, nativeCurrency => {
    'worklet';
    return new CandlestickChartManager({
      activeCandle,
      buildParagraph,
      candles,
      chartHeight,
      chartMaxY,
      chartMinY,
      chartPicture,
      chartScale,
      chartWidth,
      chartXOffset,
      config,
      crosshairPicture,
      indicatorPicture,
      isChartGestureActive,
      isDarkMode,
      isDecelerating,
      maxDisplayedVolume,
      nativeCurrency,
      xAxisLabels,
    });
  });

  // -- TODO: Enable once the backend API is up
  // useListen(
  //   useCandlestickStore,
  //   state => state.getData(),
  //   candles => {
  //     if (!candles?.length) return;
  //     runOnUI(() => chartManager.value?.setCandles(candles))();
  //   }
  // );

  const chartTransform = useDerivedValue(() => [{ scale: chartScale.value }]);

  useAnimatedReaction(
    () => isDecelerating.value,
    (current, previous) => {
      if (!current && previous) {
        const minOffset = chartManager.value?.getMinOffset?.();
        if (chartXOffset.value === 0 || chartXOffset.value === minOffset) {
          triggerHaptics('soft');
        }
      }
    },
    []
  );

  useAnimatedReaction(
    () => activeCandle.value?.t,
    (selected, previous) => {
      if (selected && previous && selected !== previous) {
        triggerHaptics('selection');
      }
    },
    []
  );

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    handleThemeChange({ backgroundColor, chartManager, isDarkMode, providedConfig, xAxisLabelPaint, xAxisLabels });
  }, [backgroundColor, chartManager, isDarkMode, providedConfig, xAxisLabelPaint, xAxisLabels]);

  useCleanup(() => {
    initialPicture.dispose();
    xAxisLabelPaint.dispose();
    executeOnUIRuntimeSync(() => {
      chartManager.value?.dispose?.();
      chartManager.value = undefined;
    })();
  });

  return useMemo(
    () => ({
      activeCandle,
      chartManager,
      chartTransform,
      chartXOffset,
      config,
      isDecelerating,
      pictures: {
        chart: chartPicture,
        crosshair: crosshairPicture,
        indicator: indicatorPicture,
      },
      xAxisLabelPaint,
      xAxisLabels,
      xAxisWidth,
    }),
    [
      activeCandle,
      chartManager,
      chartPicture,
      chartTransform,
      chartXOffset,
      config,
      crosshairPicture,
      indicatorPicture,
      isDecelerating,
      xAxisLabelPaint,
      xAxisLabels,
      xAxisWidth,
    ]
  );
}

function handleThemeChange({
  backgroundColor,
  chartManager,
  isDarkMode,
  providedConfig,
  xAxisLabelPaint,
  xAxisLabels,
}: {
  backgroundColor: string;
  chartManager: SharedValue<CandlestickChartManager | undefined>;
  isDarkMode: boolean;
  providedConfig: CandlestickChartProps['config'];
  xAxisLabelPaint: SkPaint;
  xAxisLabels: SharedValue<string[]>;
}): void {
  runOnUI(() => {
    xAxisLabelPaint.setColor(Skia.Color(getColorForTheme('labelQuinary', isDarkMode ? 'dark' : 'light')));
    xAxisLabels.modify(labels => {
      labels[0] = `${labels[0]}\u200B`;
      labels[1] = `\u200B${labels[1]}`;
      return labels;
    });
    chartManager.value?.setColorMode?.(isDarkMode ? 'dark' : 'light', backgroundColor, providedConfig);
  })();
}

export const CandlestickChart = memo(function CandlestickChart({
  backgroundColor = DEFAULT_CANDLESTICK_CONFIG.chart.backgroundColor,
  candles = generateMockCandleData(),
  chartHeight = 480,
  chartWidth = DEVICE_WIDTH,
  config: providedConfig,
  showChartControls = true,
  isChartGestureActive,
}: CandlestickChartProps) {
  const { isDarkMode } = useColorMode();
  const separatorTertiary = useForegroundColor('separatorTertiary');
  const { currency } = getNativeCurrency();

  const { activeCandle, chartManager, chartXOffset, config, isDecelerating, pictures, xAxisLabelPaint, xAxisLabels, xAxisWidth } =
    useCandlestickChart({
      backgroundColor,
      candles,
      chartHeight,
      chartWidth,
      isChartGestureActive,
      isDarkMode,
      providedConfig,
    });

  const leftXAxisLabel = useDerivedValue(() => xAxisLabels.value[0]);
  const rightXAxisLabel = useDerivedValue(() => xAxisLabels.value[1]);

  const showLeftFade = useDerivedValue(() => chartXOffset.value < 0);
  const leftFadeStyle = useAnimatedStyle(() => ({ opacity: withSpring(showLeftFade.value ? 1 : 0, SPRING_CONFIGS.snappierSpringConfig) }));

  // -- TODO: Remove - for testing
  const indicatorStep = useSharedValue(0);
  function toggleIndicators() {
    'worklet';
    if (!chartManager.value) return;
    switch (indicatorStep.value) {
      case 0:
        chartManager.value.showIndicator('EMA9');
        break;
      case 1:
        chartManager.value.showIndicator('EMA20');
        break;
      case 2:
        chartManager.value.showIndicator('EMA50');
        break;
      case 3:
      default:
        chartManager.value.toggleIndicator('all');
        indicatorStep.value = 0;
        return;
    }
    indicatorStep.value += 1;
  }

  // -- TODO: Remove - for testing
  function snapToEnd() {
    'worklet';
    if (!chartManager.value) return;
    isDecelerating.value = false;
    const minOffset = chartManager.value.getMinOffset();
    chartXOffset.value = minOffset;
    chartManager.value.rebuildChart(false, true);
  }

  // -- TODO: Remove - for testing
  function shuffleData() {
    'worklet';
    if (!chartManager.value) return;
    const newCandles = generateMockCandleData();
    chartManager.value.setCandles(newCandles);
  }

  const chartGestures = useMemo(() => {
    const pinchGesture = Gesture.Pinch()
      .onStart(e => chartManager.value?.onPinchStart?.(e.focalX))
      .onUpdate(e => chartManager.value?.onPinchUpdate?.(e.scale));

    const panGesture = Gesture.Pan()
      .activeOffsetX([-4, 4])
      .failOffsetY([-12, 12])
      .maxPointers(1)
      .onStart(() => chartManager.value?.onPanStart?.())
      .onChange(e => chartManager.value?.onPanChange?.(e.changeX))
      .onEnd(e => chartManager.value?.onPanEnd?.(e.velocityX));

    const crosshairGesture = Gesture.LongPress()
      .maxDistance(10000)
      .minDuration(160)
      .numberOfPointers(1)
      .shouldCancelWhenOutside(true)
      .onStart(e => chartManager.value?.onLongPressStart?.(e.x, e.y))
      .onTouchesMove(e => chartManager.value?.onLongPressMove?.(e.allTouches[0].x, e.allTouches[0].y, e.state))
      .onFinalize(e => chartManager.value?.onLongPressEnd?.(e.x, e.y, e.state));

    return Gesture.Race(panGesture, pinchGesture, crosshairGesture);
  }, [chartManager]);

  const xAxisLabelsRow = useMemo(() => {
    return (
      <>
        <SkiaText
          foregroundPaint={xAxisLabelPaint}
          size="11pt"
          weight="bold"
          width={xAxisWidth / 2}
          x={config.chart.xAxisInset}
          y={chartHeight + config.chart.xAxisGap}
        >
          {leftXAxisLabel}
        </SkiaText>

        <SkiaText
          align="right"
          foregroundPaint={xAxisLabelPaint}
          size="11pt"
          weight="bold"
          width={xAxisWidth / 2}
          x={chartWidth - config.chart.xAxisInset - xAxisWidth / 2}
          y={chartHeight + config.chart.xAxisGap}
        >
          {rightXAxisLabel}
        </SkiaText>
      </>
    );
  }, [chartHeight, chartWidth, config, leftXAxisLabel, rightXAxisLabel, xAxisLabelPaint, xAxisWidth]);

  const chartCanvas = useMemo(
    () => (
      <GestureDetector gesture={chartGestures}>
        <Canvas style={styles.canvas}>
          <Picture picture={pictures.chart} />
          <Picture picture={pictures.indicator} />
          <Picture picture={pictures.crosshair} />
          {xAxisLabelsRow}
        </Canvas>
      </GestureDetector>
    ),
    [chartGestures, pictures, xAxisLabelsRow]
  );

  const chartBottomPadding = config.chart.xAxisHeight + config.chart.xAxisGap + (showChartControls ? 56 : 0);

  const activeCandleCardStyle = useAnimatedStyle(() => {
    return {
      opacity: isChartGestureActive.value ? 1 : 0,
    };
  });

  return (
    <View
      style={{
        height: chartHeight + config.activeCandleCard.height + config.chart.activeCandleCardGap + chartBottomPadding,
        width: chartWidth,
        marginTop: -config.activeCandleCard.height,
      }}
    >
      <Animated.View style={[activeCandleCardStyle, { marginBottom: config.chart.activeCandleCardGap }]}>
        <ActiveCandleCard activeCandle={activeCandle} config={config} currency={currency} />
      </Animated.View>
      <View style={{ height: chartHeight + chartBottomPadding, backgroundColor, width: chartWidth }}>
        {chartCanvas}

        {showChartControls && (
          <Inline alignHorizontal="center" alignVertical="center" horizontalSpace={{ custom: 13 }}>
            <GestureHandlerButton hapticType="soft" onPressWorklet={shuffleData} style={styles.button}>
              <Text align="center" color={{ custom: globalColors.grey100 }} size="17pt" weight="heavy">
                Shuffle
              </Text>
            </GestureHandlerButton>

            <GestureHandlerButton hapticType="soft" onPressWorklet={toggleIndicators} style={styles.button}>
              <Text align="center" color={{ custom: globalColors.grey100 }} size="17pt" weight="heavy">
                EMA
              </Text>
            </GestureHandlerButton>

            <GestureHandlerButton hapticType="soft" onPressWorklet={snapToEnd} style={styles.button}>
              <Text align="center" color={{ custom: globalColors.grey100 }} size="17pt" weight="heavy">
                Snap
              </Text>
            </GestureHandlerButton>
          </Inline>
        )}

        <EasingGradient
          easing={Easing.in(Easing.sin)}
          endColor={backgroundColor}
          startColor={backgroundColor}
          steps={8}
          style={[styles.bottomFade, { bottom: chartBottomPadding, height: Math.round(config.volume.heightFactor * chartHeight * 0.5) }]}
        />

        <Animated.View style={[styles.leftFadeContainer, { bottom: chartBottomPadding }, leftFadeStyle]}>
          <EasingGradient
            easing={Easing.in(Easing.sin)}
            endColor={backgroundColor}
            endPosition="left"
            startColor={backgroundColor}
            startPosition="right"
            steps={8}
            style={[styles.bottomFade, { height: Math.round(config.volume.heightFactor * chartHeight * 0.5) }]}
          />
        </Animated.View>

        <View
          style={[
            styles.bottomGridLine,
            {
              backgroundColor: (isDarkMode && providedConfig?.grid?.color) || opacity(separatorTertiary, isDarkMode ? 0.06 : 0.03),
              bottom: chartBottomPadding,
            },
          ]}
        />
      </View>
    </View>
  );
}, dequal);

const styles = StyleSheet.create({
  bottomFade: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    width: '100%',
  },
  bottomGridLine: {
    bottom: 0,
    height: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    width: '100%',
  },
  button: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderCurve: 'continuous',
    borderRadius: 22,
    borderWidth: 4 / 3,
    height: 36,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 13,
  },
  canvas: {
    flex: 1,
  },
  leftFade: {
    bottom: 0,
    position: 'absolute',
    top: 0,
    width: '100%',
  },
  leftFadeContainer: {
    bottom: 0,
    pointerEvents: 'none',
    position: 'absolute',
    top: 0,
    width: 24,
  },
});

function buildChartConfig({
  backgroundColor,
  chartHeight,
  chartWidth,
  providedConfig,
}: {
  backgroundColor: string;
  chartHeight: number;
  chartWidth: number;
  providedConfig: CandlestickChartProps['config'];
}): {
  config: CandlestickConfig;
  initialPicture: SkPicture;
  xAxisWidth: number;
} {
  let mergedConfig = cloneDeep(DEFAULT_CANDLESTICK_CONFIG);

  if (providedConfig) mergedConfig = merge(mergedConfig, providedConfig);
  mergedConfig.chart.backgroundColor = backgroundColor;

  const xAxisWidth = chartWidth - mergedConfig.chart.xAxisInset * 2;

  return {
    config: mergedConfig,
    initialPicture: createBlankPicture(chartWidth, chartHeight),
    xAxisWidth,
  };
}

/**
 * Clamps the chart offset so that we never pan beyond the first or last bar.
 */
function clampChartOffset({
  bars,
  candleSpacing,
  candleWidth,
  chartWidth,
  proposedOffset,
  yAxisWidth,
}: {
  bars: Bar[];
  candleSpacing: number;
  candleWidth: number;
  chartWidth: number;
  proposedOffset: number;
  yAxisWidth: number;
}): number {
  const stride = candleWidth + candleSpacing;
  const totalBarsWidth = bars.length * stride;
  const minOffset = chartWidth - totalBarsWidth - yAxisWidth;
  const maxOffset = 0;
  return Math.max(minOffset, Math.min(maxOffset, proposedOffset));
}

/**
 * Determines the initial chart offset so that it’s aligned to the right (most recent candle).
 */
function getInitialOffset(bars: Bar[], chartWidth: number, config: CandlestickConfig): number {
  const candleWidth = config.candles.initialWidth;
  const barStride = candleWidth + candleWidth * config.candles.spacingRatio;
  const totalBarsWidth = bars.length * barStride;
  const proposedRightOffset = chartWidth - totalBarsWidth;
  const yAxisWidth = config.chart.yAxisPaddingLeft + 52 + config.chart.yAxisPaddingRight;

  return clampChartOffset({
    bars,
    candleSpacing: candleWidth * config.candles.spacingRatio,
    candleWidth,
    chartWidth,
    proposedOffset: proposedRightOffset - yAxisWidth,
    yAxisWidth,
  });
}

function getNativeCurrency(): { currency: NativeCurrencyKey; decimals: number } {
  const currency = userAssetsStoreManager.getState().currency;
  return { currency, decimals: supportedNativeCurrencies[currency].decimals };
}
