import {
  BlendMode,
  Canvas2 as Canvas,
  ClipOp,
  PaintStyle,
  Picture,
  SkCanvas,
  SkColor,
  SkParagraph,
  SkPicture,
  Skia,
  StrokeCap,
  StrokeJoin,
  createPicture,
} from '@shopify/react-native-skia';
import { dequal } from 'dequal';
import { cloneDeep, merge } from 'lodash';
import React, { memo, useCallback, useMemo, useRef } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector, State as GestureState } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  SharedValue,
  executeOnUIRuntimeSync,
  runOnJS,
  runOnUI,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { triggerHaptics } from 'react-native-turbo-haptics';
import { ButtonPressAnimation } from '@/components/animations';
import { AnimatedSpinner } from '@/components/animations/AnimatedSpinner';
import { SPRING_CONFIGS, TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { areCandlesEqual } from '@/components/charts/candlestick/utils';
import { CandlestickResponse, fetchHistoricalCandles, useCandlestickStore } from '@/components/charts/state/candlestickStore';
import { chartsActions, useChartsStore } from '@/components/charts/state/chartsStore';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { MountWhenFocused } from '@/components/utilities/MountWhenFocused';
import { CANDLESTICK_DATA_MONITOR, useExperimentalFlag } from '@/config';
import { Inline, Text, TextIcon, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import { getColorForTheme } from '@/design-system/color/useForegroundColor';
import { TextSegment, useSkiaText } from '@/design-system/components/SkiaText/useSkiaText';
import { NativeCurrencyKey } from '@/entities';
import { IS_IOS } from '@/env';
import { convertAmountToNativeDisplayWorklet as formatPrice } from '@/helpers/utilities';
import { useWorkletClass } from '@/hooks/reanimated/useWorkletClass';
import { useCleanup } from '@/hooks/useCleanup';
import { useOnChange } from '@/hooks/useOnChange';
import { useStableValue } from '@/hooks/useStableValue';
import Routes from '@/navigation/routesNames';
import { supportedNativeCurrencies } from '@/references';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { ChainId } from '@/state/backendNetworks/types';
import { useListen } from '@/state/internal/hooks/useListen';
import { useListenerRouteGuard } from '@/state/internal/hooks/useListenerRouteGuard';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { clamp, opacity, opacityWorklet } from '@/__swaps__/utils/swaps';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { DampingMassStiffnessConfig, normalizeSpringConfig } from '@/worklets/animations';
import { NoChartData } from '../../components/NoChartData';
import { CandleResolution } from '../../types';
import { Animator } from '../classes/Animator';
import { EmaIndicator, IndicatorBuilder, IndicatorKey } from '../classes/IndicatorBuilder';
import { TimeFormatter } from '../classes/TimeFormatter';
import { GREEN_CANDLE_COLOR, RED_CANDLE_COLOR } from '../constants';
import { generateMockCandleData } from '../mock/mockData';
import { Bar } from '../types';
import { ActiveCandleCard } from './ActiveCandleCard';

type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type PartialCandlestickConfig = DeepPartial<
  Omit<CandlestickConfig, 'chart'> & { chart: Omit<CandlestickConfig['chart'], 'backgroundColor'> }
>;

export type CandlestickChartProps = {
  accentColor: string;
  address: string;
  chainId: ChainId;
  backgroundColor: string;
  candles?: Bar[];
  chartHeight?: number;
  chartWidth?: number;
  config?: PartialCandlestickConfig;
  isChartGestureActive: SharedValue<boolean>;
  showChartControls?: boolean;
};

type CandlestickConfig = {
  activeCandleCard: {
    height: number;
    style: StyleProp<ViewStyle>;
  };

  animation: {
    enableCrosshairPulse: boolean;
    springConfig: DampingMassStiffnessConfig;
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

export const DEFAULT_CANDLESTICK_CONFIG: Readonly<CandlestickConfig> = Object.freeze({
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
    activeCandleCardGap: 20,
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
    yOffset: -68,
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
});

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
  if (!array.length) return 0;

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
const LOAD_THRESHOLD_PX = DEVICE_WIDTH * 4;
const LOADING_SPINNER_SIZE = 28;
const MAX_CANDLES_TO_LOAD = 5000;

class CandlestickChartManager {
  private __workletClass = true;

  private backgroundColor: SkColor;
  private blankPicture: SkPicture;
  private buildParagraph: (segments: TextSegment | TextSegment[]) => SkParagraph | null;
  private candleResolution: CandleResolution;
  private candleStrokeColor: SkColor;
  private candleWidth: number;
  private candles: Bar[];
  private chartHeight: number;
  private chartWidth: number;
  private config: CandlestickConfig;
  private fetchAdditionalCandles: () => void;
  private hasPreviousCandles: boolean;
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
  private isChartGestureActive: SharedValue<boolean>;
  private isDecelerating: SharedValue<boolean>;
  private isLoadingHistoricalCandles: SharedValue<boolean>;
  private maxDisplayedVolume: SharedValue<number>;
  private offset: SharedValue<number>;

  private lastCrosshairPosition = { x: 0, y: 0 };
  private lastVisibleRange = { startIndex: -1, endIndex: -1 };
  private panStartOffset = 0;
  private pendingOffsetAdjustment = 0;
  private pictureRecorder = Skia.PictureRecorder();
  private pinchInfo = { isActive: false, startCandleCount: 0, startFocalX: 0, startOffset: 0, startWidth: 0 };

  private animator = new Animator(() => this.rebuildChart());
  private indicatorBuilder = new IndicatorBuilder<IndicatorKey>();
  private timeFormatter = new TimeFormatter();

  private colors = {
    EMA9: Skia.Color('white'),
    EMA20: Skia.Color('#42A5F5'),
    EMA50: Skia.Color('#AB47BC'),
    black: Skia.Color('#000000'),
    crosshairDot: Skia.Color('#FFFFFF'),
    crosshairLine: Skia.Color('#FFFFFF'),
    crosshairPriceBubble: Skia.Color(getColorForTheme('fill', 'light')),
    labelSecondary: Skia.Color(getColorForTheme('labelSecondary', 'light')),
    labelQuinary: Skia.Color(getColorForTheme('labelQuinary', 'light')),
    green: Skia.Color(GREEN_CANDLE_COLOR),
    red: Skia.Color(RED_CANDLE_COLOR),
    transparent: Skia.Color('transparent'),
    white: Skia.Color('#FFFFFF'),
  };

  private paints = {
    EMA9: Skia.Paint(),
    EMA20: Skia.Paint(),
    EMA50: Skia.Paint(),
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
  };

  // ============ Constructor ================================================== //

  constructor({
    activeCandle,
    buildParagraph,
    candleResolution,
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
    fetchAdditionalCandles,
    hasPreviousCandles,
    indicatorPicture,
    isChartGestureActive,
    isDarkMode,
    isDecelerating,
    isLoadingHistoricalCandles,
    maxDisplayedVolume,
    nativeCurrency,
  }: {
    activeCandle: SharedValue<Bar | undefined>;
    buildParagraph: (segments: TextSegment | TextSegment[]) => SkParagraph | null;
    candleResolution: CandleResolution;
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
    fetchAdditionalCandles: (enableFailureHaptics?: boolean) => void;
    hasPreviousCandles: boolean;
    indicatorPicture: SharedValue<SkPicture>;
    isChartGestureActive: SharedValue<boolean>;
    isDarkMode: boolean;
    isDecelerating: SharedValue<boolean>;
    isLoadingHistoricalCandles: SharedValue<boolean>;
    maxDisplayedVolume: SharedValue<number>;
    nativeCurrency: { currency: NativeCurrencyKey; decimals: number };
  }) {
    // ========== Core State ==========
    this.backgroundColor = Skia.Color(config.chart.backgroundColor);
    this.blankPicture = createBlankPicture(chartWidth, chartHeight);
    this.buildParagraph = buildParagraph;
    this.candleResolution = candleResolution;
    this.candleStrokeColor = Skia.Color(config.candles.strokeColor);
    this.candleWidth = config.candles.initialWidth;
    this.candles = candles;
    this.chartHeight = chartHeight;
    this.chartWidth = chartWidth;
    this.config = config;
    this.fetchAdditionalCandles = fetchAdditionalCandles;
    this.hasPreviousCandles = hasPreviousCandles;
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
    this.isChartGestureActive = isChartGestureActive;
    this.isDecelerating = isDecelerating;
    this.isLoadingHistoricalCandles = isLoadingHistoricalCandles;
    this.maxDisplayedVolume = maxDisplayedVolume;
    this.offset = chartXOffset;

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
    if (this.candles) this.offset.value = this.getMinOffset();

    this.buildBaseCandlesPicture();
  }

  // ============ Chart Layout Utilities ======================================= //

  private getVisibleIndices(): { startIndex: number; endIndex: number } {
    const chartWidth = this.chartWidth;
    const currentOffset = this.getOffsetX();
    const hasCandles = this.candles.length > 0;
    const stride = this.getStride(this.candleWidth);
    const rawStart = Math.floor((-currentOffset - this.candleWidth) / stride) + 1;
    const rawEnd = Math.ceil((chartWidth - currentOffset) / stride) - 1;
    const startIndex = Math.max(0, rawStart);
    const endIndex = Math.min(this.candles.length - 1, rawEnd);

    if (hasCandles && (startIndex !== this.lastVisibleRange.startIndex || endIndex !== this.lastVisibleRange.endIndex)) {
      this.lastVisibleRange.startIndex = startIndex;
      this.lastVisibleRange.endIndex = endIndex;
    }

    return { startIndex, endIndex };
  }

  private getPriceBounds(): { min: number; max: number; startIndex: number; endIndex: number } {
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

    if (min === Infinity || max === -Infinity) {
      return { min: 0, max: 1, startIndex, endIndex };
    }

    const range = max - min || 1;
    const verticalPadding = range * this.config.chart.candlesPaddingRatioVertical;
    const newBounds = { min: min - verticalPadding, max: max + verticalPadding, startIndex, endIndex };
    this.yAxisWidth = this.getYAxisWidth(newBounds.min, newBounds.max);
    return newBounds;
  }

  private getMaxDisplayedVolume(startIndex: number, endIndex: number): number {
    const volumes: number[] = [];
    const candles = this.candles;
    for (let i = startIndex; i <= endIndex; i++) volumes.push(candles[i].v);
    const p100 = findPercentile(volumes, volumes.length - 1);
    return p100;
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
    return minOffset > 0 ? minOffset : clamp(value, minOffset, 0);
  }

  private getPriceAtYPosition(y: number): number {
    const chartHeight = this.chartHeight;
    const minPrice = this.chartMinY.value;
    const maxPrice = this.chartMaxY.value;
    const candleRegionHeight = chartHeight - chartHeight * this.config.volume.heightFactor;
    const priceRange = maxPrice - minPrice;
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
    const heightWithXAxis = this.chartHeight + this.config.chart.xAxisHeight + this.config.chart.xAxisGap * 2;
    const canvas = this.pictureRecorder.beginRecording({
      height: heightWithXAxis,
      width: this.chartWidth,
      x: 0,
      y: 0,
    });

    const buildParagraph = this.buildParagraph;
    const candleWidth = this.candleWidth;
    const chartHeight = this.chartHeight;
    const chartWidth = this.chartWidth;
    const currentOffset = this.getOffsetX();
    const hasCandles = this.candles.length > 0;
    const { startIndex, endIndex } = this.getVisibleIndices();

    // ========== X-Axis Labels ==========
    if (hasCandles) {
      const xAxisWidth = chartWidth - this.config.chart.xAxisInset * 2;
      const xAxisY = chartHeight + this.config.chart.xAxisGap;
      const color = this.colors.labelQuinary;
      const foregroundPaint = this.paints.text;
      const startCandle = this.candles[startIndex];
      const startDate = startCandle ? this.timeFormatter.format(startCandle.t) : undefined;
      const endCandle = this.candles[endIndex];
      const endDate = endCandle ? this.timeFormatter.format(endCandle.t) : undefined;

      if (startDate) {
        const leftParagraph = buildParagraph({ color, foregroundPaint, text: startDate });
        if (leftParagraph) {
          leftParagraph.layout(xAxisWidth / 2);
          leftParagraph.paint(canvas, this.config.chart.xAxisInset, xAxisY);
        }
      }
      if (endDate) {
        const rightParagraph = buildParagraph({ color, foregroundPaint, text: endDate });
        if (rightParagraph) {
          rightParagraph.layout(xAxisWidth / 2);
          const textWidth = rightParagraph.getLineMetrics()[0].width;
          rightParagraph.paint(canvas, chartWidth - this.config.chart.xAxisInset - textWidth, xAxisY);
        }
      }
    }

    canvas.clipRect({ x: 0, y: 0, width: chartWidth, height: chartHeight }, ClipOp.Intersect, true);

    const minPrice = this.chartMinY.value;
    const maxPrice = this.chartMaxY.value;
    const volumeRegionHeight = chartHeight * this.config.volume.heightFactor;
    const candleRegionHeight = chartHeight - volumeRegionHeight;
    const priceRange = maxPrice - minPrice;

    function convertPriceToY(price: number): number {
      return candleRegionHeight - ((price - minPrice) / priceRange) * candleRegionHeight;
    }

    // ========== Grid Lines and Price Labels ==========
    const stride = this.getStride(candleWidth);
    const visibleCandles = chartWidth / stride;
    const rawInterval = visibleCandles / 6;
    const candleInterval = Math.max(1, Math.round(this.getNiceInterval(rawInterval)));
    const firstGridIndex = Math.ceil(startIndex / candleInterval) * candleInterval;

    for (let i = firstGridIndex; i <= endIndex; i += candleInterval) {
      const gx = i * stride + currentOffset + candleWidth / 2;
      canvas.drawLine(gx, 0, gx, chartHeight, this.paints.grid);
    }

    const labelX = chartWidth - this.yAxisWidth + this.config.chart.yAxisPaddingLeft;
    let labelHeight: number | undefined = undefined;

    for (let i = 0; i <= 3; i++) {
      const y = chartHeight * (i / 4) + 0.5;
      canvas.drawLine(0, y, chartWidth, y, this.paints.grid);
      if (!hasCandles) continue;

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
    const maxBorderRadius = this.config.candles.maxBorderRadius;
    const maxVolume = this.maxDisplayedVolume.value;
    for (let i = startIndex; i <= endIndex; i++) {
      const candle = this.candles[i];
      const cornerRadius = Math.min(maxBorderRadius, candleWidth / 3);
      const rawFraction = candle.v / maxVolume;
      const easedFraction = rawFraction <= 0 ? 0 : Math.pow(rawFraction, 0.7);
      const height = easedFraction * volumeRegionHeight;
      const x = i * stride + currentOffset;
      const y = chartHeight - height;
      canvas.drawRRect({ rect: { height, width: candleWidth, x, y }, rx: cornerRadius, ry: cornerRadius }, this.paints.volume);
    }

    // ========== Current Price Line ==========
    const lastCandle = this.candles[this.candles.length - 1];
    const buffer = (maxPrice - minPrice) * 0.02;
    const minVisiblePrice = minPrice - priceRange * (volumeRegionHeight / candleRegionHeight);
    const isCurrentPriceInRange = lastCandle && minVisiblePrice - buffer <= lastCandle.c && lastCandle.c <= maxPrice + buffer;

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
      const x = i * stride + currentOffset + candleWidth / 2;
      canvas.drawLine(x, convertPriceToY(candle.h), x, convertPriceToY(candle.l), this.paints.candleWick);
    }

    this.paints.candleWick.setColor(this.colors.red);
    this.paints.candleWick.setAlphaf(0.7);
    for (let i = startIndex; i <= endIndex; i++) {
      const candle = this.candles[i];
      if (candle.c >= candle.o) continue;
      const x = i * stride + currentOffset + candleWidth / 2;
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
      drawBody(candle, i * stride + currentOffset);
    }

    bodyPaint.setColor(this.colors.red);
    for (let i = startIndex; i <= endIndex; i++) {
      const candle = this.candles[i];
      if (candle.c >= candle.o) continue;
      drawBody(candle, i * stride + currentOffset);
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

  // ============ Indicator Picture ============================================ //

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
    const currentOffset = this.getOffsetX();
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
      offsetX: currentOffset,
      startIndex,
      stride,
    });

    const oldPicture = this.indicatorPicture.value;
    indicatorPicture.value = this.pictureRecorder.finishRecordingAsPicture();
    oldPicture.dispose();
  }

  // ============ Crosshair Picture ============================================ //

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
    const currentOffset = this.getOffsetX();
    const isDarkMode = this.isDarkMode;
    const stride = this.getStride(candleWidth);

    const unclampedIndex = Math.round((cx - currentOffset - candleWidth / 2) / stride);
    const nearestCandleIndex = clamp(unclampedIndex, 0, this.candles.length - 1);
    const snappedX = nearestCandleIndex * stride + currentOffset + candleWidth / 2;
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
      const labelX = this.chartWidth - this.yAxisWidth + this.config.chart.yAxisPaddingLeft;
      this.drawTextBubble({
        canvas,
        centerY: yWithOffset,
        color: this.colors.crosshairPriceBubble,
        leftX: labelX,
        priceOrLabel: priceAtYPosition,
        stabilizePriceWidth: true,
        strokeOpacity: 0.12,
        textColor: this.colors.labelSecondary,
      });
    }

    const previousActiveCandle = activeCandle.value;

    if (previousActiveCandle?.t !== newActiveCandle?.t) {
      activeCandle.value = newActiveCandle;
      if (previousActiveCandle) triggerHaptics('selection');
    }

    this.isChartGestureActive.value = true;

    const oldPicture = this.crosshairPicture.value;
    crosshairPicture.value = this.pictureRecorder.finishRecordingAsPicture();
    oldPicture.dispose();
  }

  // ============ Animation Handler ============================================ //

  private handleAnimations(animate: boolean, forceRebuildBounds: boolean): void {
    const { startIndex: lastStartIndex, endIndex: lastEndIndex } = this.lastVisibleRange;
    const { min, max, startIndex, endIndex } = this.getPriceBounds();

    if (animate) {
      if (forceRebuildBounds || startIndex !== lastStartIndex || endIndex !== lastEndIndex) {
        this.animator.spring(
          [this.chartMinY, this.chartMaxY],
          [min, max],
          normalizeSpringConfig(
            Math.abs(this.chartMinY.value - min),
            Math.abs(this.chartMaxY.value - max),
            this.config.animation.springConfig
          )
        );
        const maxDisplayedVolume = this.getMaxDisplayedVolume(startIndex, endIndex);
        if (forceRebuildBounds || maxDisplayedVolume !== this.maxDisplayedVolume.value) {
          if (this.maxDisplayedVolume.value === -1) this.maxDisplayedVolume.value = maxDisplayedVolume;
          else this.animator.spring(this.maxDisplayedVolume, maxDisplayedVolume, this.config.animation.springConfig);
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

  // ============ Drawing Helpers ============================================== //

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

  // ============ Offset Utilities ============================================= //

  private commitPendingOffset(): void {
    if (this.pendingOffsetAdjustment === 0) return;
    const pendingOffset = this.pendingOffsetAdjustment;
    this.pendingOffsetAdjustment = 0;
    this.offset.value += pendingOffset;
  }

  private registerOffsetAdjustment({ newCandleCount, oldCandleCount }: { newCandleCount: number; oldCandleCount: number }): void {
    const addedCandleCount = newCandleCount - oldCandleCount;
    if (addedCandleCount <= 0) return;

    const stride = this.getStride(this.candleWidth);
    const currentOffset = this.getOffsetX();
    const desired = currentOffset - addedCandleCount * stride;
    const clamped = this.clampOffset(desired);
    const adjustment = clamped - currentOffset;

    this.pendingOffsetAdjustment += adjustment;
  }

  // ============ Public Methods =============================================== //

  public getMinOffset(): number {
    return this.chartWidth - this.yAxisWidth - this.candles.length * this.getStride(this.candleWidth);
  }

  public getOffsetX(): number {
    return this.offset.value + this.pendingOffsetAdjustment;
  }

  public toAdjustedOffset(rawOffset: number): number {
    return rawOffset + this.pendingOffsetAdjustment;
  }

  public toRawOffset(adjustedOffset: number): number {
    return adjustedOffset - this.pendingOffsetAdjustment;
  }

  public rebuildChart(animate = true, forceRebuildBounds = false): void {
    if (this.isDecelerating.value) {
      const currentOffset = this.getOffsetX();
      const clampedOffset = this.clampOffset(currentOffset);

      if (clampedOffset !== currentOffset) {
        triggerHaptics('soft');
        this.isDecelerating.value = false;
        this.offset.value = this.toRawOffset(clampedOffset);
      }
    }

    this.handleAnimations(animate, forceRebuildBounds);
    this.buildBaseCandlesPicture();
    this.buildIndicatorPicture();
  }

  public requestAdditionalCandles(): boolean {
    const shouldReject = !this.hasPreviousCandles || this.isLoadingHistoricalCandles.value || this.candles.length >= MAX_CANDLES_TO_LOAD;
    if (shouldReject) return false;
    runOnJS(this.fetchAdditionalCandles)();
    return true;
  }

  public setBuildParagraph(buildParagraph: (segments: TextSegment | TextSegment[]) => SkParagraph | null): void {
    this.buildParagraph = buildParagraph;
    this.buildBaseCandlesPicture();
  }

  public setCandles(
    newCandles: Bar[],
    { hasPreviousCandles, shouldResetOffset = false }: { hasPreviousCandles: boolean; shouldResetOffset?: boolean }
  ): void {
    if (newCandles === this.candles) {
      this.hasPreviousCandles = hasPreviousCandles;
      return;
    }

    const oldCandleCount = this.candles.length;
    const wasDataPrepended =
      !shouldResetOffset && !!oldCandleCount && newCandles.length > oldCandleCount && newCandles[0].t < this.candles[0].t;
    const wasPinnedToRight = shouldResetOffset || !oldCandleCount || this.getOffsetX() === this.getMinOffset();

    this.candles = newCandles;
    this.hasPreviousCandles = hasPreviousCandles;
    this.indicatorBuilder.computeAll(newCandles);

    if (wasDataPrepended) {
      this.registerOffsetAdjustment({ newCandleCount: newCandles.length, oldCandleCount });
      this.getPriceBounds();
      this.animator.runAfterAnimations(() => {
        this.commitPendingOffset();
      });
    } else {
      this.commitPendingOffset();
      this.lastVisibleRange.startIndex = -1;
      this.lastVisibleRange.endIndex = -1;
      this.maxDisplayedVolume.value = -1;
      this.getPriceBounds();

      if (wasPinnedToRight) this.offset.value = this.getMinOffset();
      this.rebuildChart(false, true);
    }

    if (!wasDataPrepended && this.activeCandle.value) {
      this.buildCrosshairPicture(this.lastCrosshairPosition.x, this.lastCrosshairPosition.y, true);
    }
  }

  public snapToCurrentCandle(): void {
    const currentOffset = this.getOffsetX();
    const minOffset = this.getMinOffset();
    if (currentOffset === minOffset) return;

    this.commitPendingOffset();
    this.lastVisibleRange.startIndex = -1;
    this.lastVisibleRange.endIndex = -1;
    this.maxDisplayedVolume.value = -1;
    this.getPriceBounds();

    this.offset.value = minOffset;
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

    this.rebuildChart(false, false);
  }

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
    this.lastCrosshairPosition.x = x;
    this.lastCrosshairPosition.y = y;
  }

  public onLongPressMove(x: number, y: number, state: GestureState): void {
    const isActive = state === GestureState.ACTIVE;
    this.buildCrosshairPicture(x, y, isActive);
    this.lastCrosshairPosition.x = x;
    this.lastCrosshairPosition.y = y;
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
    const currentOffset = this.getOffsetX();
    const proposed = currentOffset + changeX;
    const clamped = this.clampOffset(proposed);

    if (clamped !== currentOffset) {
      const newRawOffset = this.toRawOffset(clamped);
      this.animator.direct(this.offset, newRawOffset);

      if ((clamped === 0 || clamped === this.getMinOffset()) && currentOffset !== this.toAdjustedOffset(this.panStartOffset)) {
        triggerHaptics('soft');
      } else {
        const distanceFromLeftEdge = Math.abs(clamped);
        if (distanceFromLeftEdge < LOAD_THRESHOLD_PX) this.requestAdditionalCandles();
      }
    }
  }

  public onPanEnd(velocityX: number): void {
    this.commitPendingOffset();

    if (Math.abs(velocityX) > 100) {
      const currentOffset = this.getOffsetX();
      const clampedOffset = this.clampOffset(currentOffset);

      if (currentOffset === clampedOffset) {
        const minOffset = this.getMinOffset();
        if (minOffset > 0) return;
        const atLeftBoundary = currentOffset === 0;
        const atRightBoundary = currentOffset === minOffset;
        const isBlockedByBoundary = (atLeftBoundary && velocityX > 0) || (atRightBoundary && velocityX < 0);
        if (isBlockedByBoundary) return;
      }

      this.isDecelerating.value = true;

      this.animator.decay(
        this.offset,
        {
          deceleration: this.config.chart.panGestureDeceleration,
          velocity: velocityX,
        },
        didComplete => {
          if (this.isDecelerating.value) this.isDecelerating.value = false;
          this.commitPendingOffset();

          if (didComplete && this.activeCandle.value) {
            this.buildCrosshairPicture(this.lastCrosshairPosition.x, this.lastCrosshairPosition.y, true);
          }
        }
      );
    }
  }

  public onPinchStart(focalX: number): void {
    this.commitPendingOffset();
    this.pinchInfo.isActive = true;
    this.pinchInfo.startCandleCount = this.candles.length;
    this.pinchInfo.startFocalX = focalX;
    this.pinchInfo.startOffset = this.offset.value;
    this.pinchInfo.startWidth = this.candleWidth;
    if (this.isDecelerating.value) this.isDecelerating.value = false;
  }

  public onPinchUpdate(scale: number): void {
    this.commitPendingOffset();
    const { startFocalX, startOffset: rawStartOffset, startWidth, startCandleCount } = this.pinchInfo;

    const newWidth = this.clampCandleWidth(startWidth * scale);
    const didWidthChange = newWidth !== this.candleWidth;
    if (!didWidthChange) return;
    this.candleWidth = newWidth;

    const startOffset = this.toAdjustedOffset(rawStartOffset);
    const prependedCount = this.candles.length - startCandleCount;
    const newStride = this.getStride(newWidth);
    const oldStride = this.getStride(startWidth);

    const originalIndex = (startFocalX - startOffset) / oldStride;
    const currentIndex = clamp(originalIndex + prependedCount, 0, this.candles.length - 1);

    const startMinOffset = this.toAdjustedOffset(this.chartWidth - this.yAxisWidth - startCandleCount * oldStride);
    const wasPinnedToRight = Math.abs(startOffset - startMinOffset) < 2;

    let newOffset: number;
    if (wasPinnedToRight) {
      newOffset = this.getMinOffset();
    } else {
      newOffset = this.clampOffset(startFocalX - currentIndex * newStride);
    }

    const newRawOffset = this.toRawOffset(newOffset);
    if (!didWidthChange && newRawOffset === this.offset.value) return;

    this.animator.direct(this.offset, newRawOffset);

    const distanceFromLeftEdge = Math.abs(newOffset);
    if (distanceFromLeftEdge < LOAD_THRESHOLD_PX) this.requestAdditionalCandles();
  }

  public onPinchEnd(): void {
    this.pinchInfo.isActive = false;
  }
}

enum ChartStatus {
  Empty = 'empty',
  Loaded = 'loaded',
  Loading = 'loading',
}

function useCandlestickChart({
  address,
  backgroundColor,
  chainId,
  chartHeight,
  chartWidth,
  isChartGestureActive,
  isDarkMode,
  isLoadingHistoricalCandles,
  providedConfig,
}: {
  address: string;
  backgroundColor: string;
  chainId: ChainId;
  chartHeight: number;
  chartWidth: number;
  isChartGestureActive: SharedValue<boolean>;
  isDarkMode: boolean;
  isLoadingHistoricalCandles: SharedValue<boolean>;
  providedConfig: CandlestickChartProps['config'];
}) {
  const { candleResolution, candles, config, hasPreviousCandles, initialPicture, isFetchingInitialData, nativeCurrency } = useStableValue(
    () =>
      buildChartConfig({
        address,
        backgroundColor,
        chainId,
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

  const activeCandle = useSharedValue<Bar | undefined>(undefined);
  const chartMaxY = useSharedValue(0);
  const chartMinY = useSharedValue(0);
  const chartScale = useSharedValue(1);
  const chartXOffset = useSharedValue(getInitialOffset(candles, chartWidth, config));
  const isDecelerating = useSharedValue(false);
  const maxDisplayedVolume = useSharedValue(0);

  const chartPicture = useSharedValue(initialPicture);
  const crosshairPicture = useSharedValue(initialPicture);
  const indicatorPicture = useSharedValue(initialPicture);

  const chartStatus = useSharedValue(isFetchingInitialData ? ChartStatus.Loading : candles.length ? ChartStatus.Loaded : ChartStatus.Empty);
  const fetchPromise = useRef<Promise<void> | null | undefined>(undefined);

  const fetchAdditionalCandles = useCallback(
    (enableFailureHaptics = false) => {
      const currentFetchPromise = fetchPromise.current;
      if (currentFetchPromise) return;

      if (currentFetchPromise === null) {
        if (enableFailureHaptics) triggerHaptics('notificationError');
        return;
      }

      isLoadingHistoricalCandles.value = true;

      fetchPromise.current = fetchHistoricalCandles({
        candleResolution: useChartsStore.getState().candleResolution,
        candlesToFetch: 500,
        token: { address, chainId },
      })
        .then(data => {
          if (!fetchPromise.current) return;
          fetchPromise.current = !data || data?.hasPreviousCandles === true ? undefined : null;
        })
        .finally(() => {
          isLoadingHistoricalCandles.value = false;
        });
    },
    [address, chainId, isLoadingHistoricalCandles]
  );

  const chartManager = useWorkletClass(() => {
    'worklet';
    return new CandlestickChartManager({
      activeCandle,
      buildParagraph,
      candleResolution,
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
      fetchAdditionalCandles,
      hasPreviousCandles,
      indicatorPicture,
      isChartGestureActive,
      isDarkMode,
      isDecelerating,
      isLoadingHistoricalCandles,
      maxDisplayedVolume,
      nativeCurrency,
    });
  });

  const resetHistoricalFetchState = useCallback(
    (data: CandlestickResponse, previousData: CandlestickResponse) => {
      const didResolutionChange = data?.candleResolution !== previousData?.candleResolution;
      const hasExceededMaxCandles = (data?.candles.length ?? 0) >= MAX_CANDLES_TO_LOAD;

      if (!didResolutionChange && !hasExceededMaxCandles) return;

      const shouldEnableFetching = data?.hasPreviousCandles !== false && !hasExceededMaxCandles;
      fetchPromise.current = shouldEnableFetching ? undefined : null;
      isLoadingHistoricalCandles.value = false;
    },
    [isLoadingHistoricalCandles]
  );

  const updateCandles = useCallback(
    (data: CandlestickResponse, previousData: CandlestickResponse) => {
      if (data === null) {
        chartStatus.value = ChartStatus.Loading;
        return;
      }

      resetHistoricalFetchState(data, previousData);
      const hasData = data !== null;
      const hasPreviousData = previousData !== null;
      const didResolutionChange = hasData && hasPreviousData && data.candleResolution !== previousData.candleResolution;

      runOnUI(() => {
        chartStatus.value = data.candles.length ? ChartStatus.Loaded : ChartStatus.Empty;
        const newCandles = data.candles ?? EMPTY_CANDLES;
        const hasPreviousCandles = data.hasPreviousCandles === true && newCandles.length < MAX_CANDLES_TO_LOAD;
        const wasEmptyDataReplaced = hasData && !hasPreviousData;
        const shouldResetOffset = didResolutionChange || wasEmptyDataReplaced;

        chartManager.value?.setCandles?.(newCandles, {
          hasPreviousCandles,
          shouldResetOffset,
        });
      })();
    },
    [chartManager, chartStatus, resetHistoricalFetchState]
  );

  useListenerRouteGuard(
    useListen(useCandlestickStore, state => state.getData(), updateCandles, {
      equalityFn: isCandlestickDataEqual,
      fireImmediately: true,
    }),
    Routes.EXPANDED_ASSET_SHEET_V2
  );

  useListen(
    useChartsStore,
    state => state.snapSignal,
    () => {
      runOnUI(() => chartManager.value?.snapToCurrentCandle?.())();
    }
  );

  const chartTransform = useDerivedValue(() => [{ scale: !_WORKLET ? 1 : chartScale.value }]);
  const isChartLoading = useDerivedValue(() => (!_WORKLET ? isFetchingInitialData : chartStatus.value === ChartStatus.Loading));

  const isInHistoricalLoadRegion = useDerivedValue(() => {
    if (!_WORKLET || !isDecelerating.value || chartStatus.value !== ChartStatus.Loaded) return false;
    const currentOffset = chartManager.value?.toAdjustedOffset?.(chartXOffset.value);
    if (currentOffset === undefined) return false;
    const distanceFromLeftEdge = Math.abs(currentOffset);
    return distanceFromLeftEdge < LOAD_THRESHOLD_PX;
  });

  useAnimatedReaction(
    () => isInHistoricalLoadRegion.value,
    (current, previous) => {
      if (current && previous === false && !isLoadingHistoricalCandles.value) {
        chartManager.value?.requestAdditionalCandles?.();
      }
    },
    []
  );

  useOnChange(() => {
    runOnUI(() => {
      chartManager.value?.setColorMode?.(isDarkMode ? 'dark' : 'light', backgroundColor, providedConfig);
    })();
  }, [backgroundColor, chartManager, isDarkMode, providedConfig]);

  useOnChange(() => {
    if (IS_IOS) return;
    // Android loads Skia fonts asynchronously, so we need to
    // propagate buildParagraph updates to the chart class.
    runOnUI(() => chartManager.value?.setBuildParagraph?.(buildParagraph))();
  }, [buildParagraph, chartManager]);

  useCleanup(() => {
    chartStatus.value = ChartStatus.Loaded;
    initialPicture.dispose();
    executeOnUIRuntimeSync(() => {
      chartManager.value?.dispose?.();
      chartManager.value = undefined;
    })();
  });

  return useMemo(
    () => ({
      activeCandle,
      chartManager,
      chartStatus,
      chartTransform,
      chartXOffset,
      config,
      fetchAdditionalCandles,
      isChartLoading,
      isDecelerating,
      pictures: {
        chart: chartPicture,
        crosshair: crosshairPicture,
        indicator: indicatorPicture,
      },
    }),
    [
      activeCandle,
      chartManager,
      chartPicture,
      chartStatus,
      chartTransform,
      chartXOffset,
      config,
      crosshairPicture,
      fetchAdditionalCandles,
      indicatorPicture,
      isChartLoading,
      isDecelerating,
    ]
  );
}

const SPINNER_SIZE = 24;
const SPINNER_HIT_AREA_PADDING = 12;
const SPINNER_HIT_AREA_SIZE = SPINNER_SIZE + SPINNER_HIT_AREA_PADDING * 2;

export const CandlestickChart = memo(function CandlestickChart({
  accentColor,
  address,
  backgroundColor,
  chainId,
  chartHeight: providedChartHeight = 480,
  chartWidth = DEVICE_WIDTH,
  config: providedConfig,
  showChartControls = false,
  isChartGestureActive,
}: CandlestickChartProps) {
  const { isDarkMode } = useColorMode();
  const showDataMonitor = useExperimentalFlag(CANDLESTICK_DATA_MONITOR);
  const separatorTertiary = useForegroundColor('separatorTertiary');
  const { currency } = getNativeCurrency();

  const isLoadingHistoricalCandles = useSharedValue(false);
  const chartHeight = providedChartHeight - 13 - 10 - 16;

  const {
    activeCandle,
    chartManager,
    chartStatus,
    chartXOffset,
    config,
    fetchAdditionalCandles,
    isChartLoading,
    isDecelerating,
    pictures,
  } = useCandlestickChart({
    address,
    backgroundColor,
    chainId,
    chartHeight,
    chartWidth,
    isChartGestureActive,
    isDarkMode,
    isLoadingHistoricalCandles,
    providedConfig,
  });

  const showLeftFade = useDerivedValue(() => !_WORKLET || chartManager.value?.toAdjustedOffset?.(chartXOffset.value) !== 0);
  const leftFadeStyle = useAnimatedStyle(() => ({
    opacity: withSpring(!_WORKLET || showLeftFade.value ? 1 : 0, SPRING_CONFIGS.snappierSpringConfig),
  }));

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
    chartManager.value.setCandles(newCandles, { hasPreviousCandles: false, shouldResetOffset: true });
  }

  const chartGestures = useMemo(() => {
    const pinchGesture = Gesture.Pinch()
      .onStart(e => chartManager.value?.onPinchStart?.(e.focalX))
      .onUpdate(e => chartManager.value?.onPinchUpdate?.(e.scale))
      .onFinalize(() => chartManager.value?.onPinchEnd?.());

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

  const chartCanvas = useMemo(
    () => (
      <GestureDetector gesture={chartGestures}>
        <Canvas style={styles.canvas}>
          <Picture picture={pictures.chart} />
          <Picture picture={pictures.indicator} />
          <Picture picture={pictures.crosshair} />
        </Canvas>
      </GestureDetector>
    ),
    [chartGestures, pictures]
  );

  const activeCardHeight = config.activeCandleCard.height + config.chart.activeCandleCardGap;
  const chartBottomPadding = config.chart.xAxisHeight + config.chart.xAxisGap * 2 + (showChartControls ? 56 : 0);
  const fullChartHeight = chartHeight + chartBottomPadding;
  const fullHeight = fullChartHeight + activeCardHeight;

  const activeCandleCardStyle = useAnimatedStyle(() => ({
    opacity: _WORKLET && isChartGestureActive.value ? 1 : 0,
  }));

  const chartOpacity = useAnimatedStyle(() => ({
    opacity: withSpring(getOpacityForStatus(chartStatus.value), SPRING_CONFIGS.snappyMediumSpringConfig),
  }));

  const dataMonitorStyle = useAnimatedStyle(() => {
    const shouldDisplay = showDataMonitor && !isChartGestureActive.value;
    return {
      opacity: shouldDisplay ? 1 : 0,
      transform: [{ scale: shouldDisplay ? 1 : 0 }],
    };
  });

  const emptyStateStyle = useAnimatedStyle(() => {
    const isEmpty = chartStatus.value === ChartStatus.Empty;
    return {
      opacity: withSpring(isEmpty ? 1 : 0, SPRING_CONFIGS.snappyMediumSpringConfig),
      pointerEvents: isEmpty ? 'auto' : 'none',
    };
  });

  return (
    <View
      style={{
        height: fullHeight,
        marginTop: -activeCardHeight,
        paddingTop: activeCardHeight,
        width: chartWidth,
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          activeCandleCardStyle,
          {
            alignSelf: 'center',
            marginBottom: config.chart.activeCandleCardGap,
            position: 'absolute',
            top: 0,
          },
        ]}
      >
        <ActiveCandleCard activeCandle={activeCandle} activeCandleCardConfig={config.activeCandleCard} currency={currency} />
      </Animated.View>

      {showDataMonitor && (
        <Animated.View style={[styles.spinnerContainer, dataMonitorStyle]}>
          <MountWhenFocused route={Routes.EXPANDED_ASSET_SHEET_V2}>
            <AnimatedSpinner
              color={accentColor}
              idleComponent={
                <ButtonPressAnimation
                  hapticType="soft"
                  onPress={() => fetchAdditionalCandles(true)}
                  style={{ height: SPINNER_HIT_AREA_SIZE + 16, marginTop: 16, width: SPINNER_HIT_AREA_SIZE }}
                >
                  <TextIcon color={{ custom: accentColor }} containerSize={SPINNER_HIT_AREA_SIZE} size="icon 20px" weight="bold">
                    􀣔
                  </TextIcon>
                </ButtonPressAnimation>
              }
              isLoading={isLoadingHistoricalCandles}
              size={SPINNER_SIZE}
            />
            <NumberOfCandles color={accentColor} />
          </MountWhenFocused>
        </Animated.View>
      )}

      <Animated.View style={[{ backgroundColor, height: fullChartHeight, width: chartWidth }, chartOpacity]}>
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
            style={styles.leftFade}
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
      </Animated.View>

      <Animated.View style={[styles.emptyState, { height: fullChartHeight, top: activeCardHeight }, emptyStateStyle]}>
        <NoChartData height={chartHeight} />
      </Animated.View>

      <AnimatedSpinner
        color={accentColor}
        containerStyle={{
          alignSelf: 'center',
          left: (chartWidth - LOADING_SPINNER_SIZE) / 2,
          position: 'absolute',
          top: (chartHeight - LOADING_SPINNER_SIZE) / 2 + activeCardHeight,
        }}
        isLoading={isChartLoading}
        scaleInFrom={0.5}
        size={LOADING_SPINNER_SIZE}
      />
    </View>
  );
}, dequal);

const NumberOfCandles = memo(function NumberOfCandles({ color }: { color: string }) {
  const numberOfCandles = useCandlestickStore(state => state.getData()?.candles.length);
  const isLoading = typeof numberOfCandles !== 'number';
  return (
    <Text
      align="center"
      color={{ custom: color }}
      size="10pt"
      style={{
        alignSelf: 'center',
        opacity: isLoading ? 0.3 : 0.6,
        pointerEvents: 'none',
        position: 'absolute',
        top: SPINNER_SIZE + 8,
        width: SPINNER_HIT_AREA_SIZE + 12,
      }}
      weight="heavy"
    >
      {isLoading ? '···' : numberOfCandles?.toLocaleString()}
    </Text>
  );
});

const styles = StyleSheet.create({
  bottomFade: {
    bottom: 0,
    left: 0,
    pointerEvents: 'none',
    position: 'absolute',
    right: 0,
    width: '100%',
  },
  bottomGridLine: {
    bottom: 0,
    height: 1,
    left: 0,
    pointerEvents: 'none',
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
  emptyState: StyleSheet.absoluteFillObject,
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
  spinnerContainer: {
    alignItems: 'center',
    height: SPINNER_SIZE,
    justifyContent: 'center',
    position: 'absolute',
    right: 24,
    top: 0,
    width: SPINNER_SIZE,
  },
});

function buildChartConfig({
  address,
  chainId,
  backgroundColor,
  chartHeight,
  chartWidth,
  providedConfig,
}: {
  address: string;
  chainId: ChainId;
  backgroundColor: string;
  chartHeight: number;
  chartWidth: number;
  providedConfig: CandlestickChartProps['config'];
}): {
  candleResolution: CandleResolution;
  candles: Bar[];
  config: CandlestickConfig;
  hasPreviousCandles: boolean;
  initialPicture: SkPicture;
  isFetchingInitialData: boolean;
  nativeCurrency: { currency: NativeCurrencyKey; decimals: number };
} {
  const { candleResolution, candles, hasPreviousCandles, isFetchingInitialData, nativeCurrency } = prepareCandlestickData({
    address,
    chainId,
  });

  let mergedConfig = cloneDeep(DEFAULT_CANDLESTICK_CONFIG);
  if (providedConfig) mergedConfig = merge(mergedConfig, providedConfig);
  mergedConfig.chart.backgroundColor = backgroundColor;

  return {
    candleResolution,
    candles,
    config: mergedConfig,
    hasPreviousCandles,
    initialPicture: createBlankPicture(chartWidth, chartHeight),
    isFetchingInitialData,
    nativeCurrency,
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
 * Determines the initial chart offset so that it's aligned to the right (most recent candle).
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

const EMPTY_CANDLES: Bar[] = [];

function prepareCandlestickData({ address, chainId }: { address: string; chainId: ChainId }): {
  candleResolution: CandleResolution;
  candles: Bar[];
  hasPreviousCandles: boolean;
  isFetchingInitialData: boolean;
  nativeCurrency: { currency: NativeCurrencyKey; decimals: number };
} {
  chartsActions.setToken({ address, chainId });

  const existingData = useCandlestickStore.getState().getData();
  const nativeCurrency = getNativeCurrency();

  return {
    candleResolution: existingData?.candleResolution ?? useChartsStore.getState().candleResolution,
    candles: existingData?.candles || EMPTY_CANDLES,
    isFetchingInitialData: existingData === null,
    hasPreviousCandles: existingData?.hasPreviousCandles ?? false,
    nativeCurrency,
  };
}

function getNativeCurrency(): { currency: NativeCurrencyKey; decimals: number } {
  const currency = userAssetsStoreManager.getState().currency;
  return { currency, decimals: supportedNativeCurrencies[currency].decimals };
}

function getOpacityForStatus(status: ChartStatus): number {
  'worklet';
  switch (status) {
    case ChartStatus.Empty:
      return 0;
    case ChartStatus.Loading:
      return 0.3;
    case ChartStatus.Loaded:
      return 1;
  }
}

function isCandlestickDataEqual(previousData: CandlestickResponse, currentData: CandlestickResponse): boolean {
  if (Object.is(previousData, currentData)) return true;

  const candles = currentData?.candles;
  if (!candles) return false;

  const previousCandles = previousData?.candles;
  if (!previousCandles) return false;

  if (
    currentData.candleResolution !== previousData.candleResolution ||
    currentData.hasPreviousCandles !== previousData.hasPreviousCandles ||
    candles.length !== previousCandles.length
  ) {
    return false;
  }

  if (Object.is(candles, previousCandles)) return true;

  const didFirstTimestampChange = candles[0]?.t !== previousCandles[0]?.t;
  if (didFirstTimestampChange) return false;

  const lastCandle = candles[candles.length - 1];
  const previousLastCandle = previousCandles[previousCandles.length - 1];

  const secondToLastCandle = candles[candles.length - 2];
  const previousSecondToLastCandle = previousCandles[previousCandles.length - 2];

  return areCandlesEqual(lastCandle, previousLastCandle) && areCandlesEqual(secondToLastCandle, previousSecondToLastCandle);
}
