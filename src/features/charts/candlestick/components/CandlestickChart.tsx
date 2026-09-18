import React, { memo, useCallback, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  BlendMode,
  ClipOp,
  PaintStyle,
  Skia,
  StrokeCap,
  type SkCanvas,
  type SkColor,
  type SkPaint,
  type SkParagraph,
  type SkPicture,
} from '@shopify/react-native-skia';
import { useListen } from '@storesjs/stores';
import { dequal } from 'dequal';
import { cloneDeep, merge } from 'lodash';
import { Gesture, GestureDetector, State as GestureState } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  runOnUI,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { triggerHaptics } from 'react-native-turbo-haptics';

import { clamp } from '@/__swaps__/utils/swaps';
import { AnimatedSpinner } from '@/components/animations/AnimatedSpinner';
import { SPRING_CONFIGS, TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { DelayedMount } from '@/components/utilities/DelayedMount';
import { MountWhenFocused } from '@/components/utilities/MountWhenFocused';
import { globalColors, Text, TextIcon, useColorMode, useForegroundColor } from '@/design-system';
import { getColorForTheme } from '@/design-system/color/useForegroundColor';
import { useSkiaText, type TextSegment } from '@/design-system/components/SkiaText/useSkiaText';
import { opacity } from '@/design-system/utils/opacity';
import { IS_DEV } from '@/env';
import { areCandlesEqual, firstIndexAtOrAfterTimestamp, formatCandlestickPrice } from '@/features/charts/candlestick/utils';
import { candlestickActions, fetchHistoricalCandles, useCandlestickStore } from '@/features/charts/stores/candlestickStore';
import { useChartsStore } from '@/features/charts/stores/chartsStore';
import { isHyperliquidToken } from '@/features/charts/utils';
import { CANDLESTICK_DATA_MONITOR } from '@/features/config/constants/experimental';
import { useExperimentalFlag } from '@/features/config/hooks/experimentalHooks';
import { supportedCurrencies as supportedNativeCurrencies } from '@/features/currency/supportedCurrencies';
import { NativeCurrencyKeys, type NativeCurrencyKey } from '@/features/currency/types';
import { type ChainId } from '@/features/network/types/backendNetworks';
import {
  PerpsIndicatorBuilder,
  type IndicatorPosition,
  type PerpsIndicatorData,
} from '@/features/perps/charts-plugin/PerpsIndicatorBuilder';
import { usePerpsIndicatorData } from '@/features/perps/charts-plugin/usePerpsIndicatorData';
import { time } from '@/framework/core/utils/time';
import { setSkiaPicture, SkiaPictureView, useSkiaRenderer, type SkiaPictureOutput } from '@/framework/ui/components/SkiaPictureView';
import { useOnChange } from '@/hooks/useOnChange';
import { useStableValue } from '@/hooks/useStableValue';
import Routes from '@/navigation/routesNames';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useListenerRouteGuard } from '@/state/internal/hooks/useListenerRouteGuard';
import { type DeepPartial } from '@/types/objects';
import { deepFreeze } from '@/utils/deepFreeze';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { normalizeSpringConfig, type DampingMassStiffnessConfig } from '@/worklets/animations';

import { NoChartData } from '../../components/NoChartData';
import { type HyperliquidSymbol, type Token } from '../../types';
import { Animator } from '../classes/Animator';
import { EmaIndicator, IndicatorBuilder, type IndicatorKey } from '../classes/IndicatorBuilder';
import { TimeFormatter } from '../classes/TimeFormatter';
import { GREEN_CANDLE_COLOR, RED_CANDLE_COLOR } from '../constants';
import { type Bar, type CandlestickResponse } from '../types';
import { ActiveCandleCard } from './ActiveCandleCard';

export type PartialCandlestickConfig = DeepPartial<
  Omit<CandlestickConfig, 'chart'> & { chart: Omit<CandlestickConfig['chart'], 'backgroundColor'> }
>;

export type CandlestickChartProps = TokenProps & {
  accentColor: string;
  backgroundColor: string;
  candles?: Bar[];
  chartHeight?: number;
  chartWidth?: number;
  config?: PartialCandlestickConfig;
  isChartGestureActive: SharedValue<boolean>;
  showChartControls?: boolean;
};

type TokenProps =
  | {
      address: string;
      chainId: ChainId;
      symbol?: undefined;
    }
  | {
      address?: undefined;
      chainId?: undefined;
      symbol: HyperliquidSymbol;
    };

type CandlestickConfig = {
  activeCandleCard: {
    height: number;
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
    enablePerpsIndicators: boolean;
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

type YAxisLayout = { width: number; decimals: number };

const Y_AXIS_LABEL_SLOTS = ['yAxis0', 'yAxis1', 'yAxis2', 'yAxis3'] as const;

type LabelSlot = 'startDate' | 'endDate' | 'currentPrice' | (typeof Y_AXIS_LABEL_SLOTS)[number];

type LabelPicture = {
  color: SkColor;
  decimals: number;
  height: number;
  picture: SkPicture;
  text: string;
  value: string | number;
  width: number;
};

export const DEFAULT_CANDLESTICK_CONFIG = deepFreeze({
  activeCandleCard: {
    height: 75,
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
    enablePerpsIndicators: true,
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
} as const satisfies CandlestickConfig);

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

const AVERAGE_CHARACTER_WIDTH = 52 / 6;
const DECIMAL_WIDTH = AVERAGE_CHARACTER_WIDTH / 3;

function getYAxisLabelWidth(maxCharacters: number): number {
  'worklet';
  return Math.ceil(maxCharacters * AVERAGE_CHARACTER_WIDTH);
}

const EMA_INDICATORS: IndicatorKey[] = ['EMA9', 'EMA20', 'EMA50'];
const EMPTY_CANDLES: Bar[] = [];
const LOAD_THRESHOLD_PX = DEVICE_WIDTH * 4;
const LOADING_SPINNER_SIZE = 28;
const MAX_CANDLES_TO_LOAD = 5000;

class CandlestickChartManager {
  private __workletClass = true;

  private backgroundColor: SkColor;
  private buildParagraph: (segments: TextSegment | TextSegment[]) => SkParagraph | null;
  private candleStrokeColor: SkColor;
  private candleWidth: number;
  private candles: Bar[] = EMPTY_CANDLES;
  private chartHeight: number;
  private chartWidth: number;
  private config: CandlestickConfig;
  private currentPriceAxis: YAxisLayout | undefined;
  private fetchAdditionalCandles: () => void;
  private firstCandleIndex = 0;
  private hasPreviousCandles = false;
  private isDarkMode: boolean;
  private isHyperliquidToken: boolean;
  private nativeCurrency: { currency: NativeCurrencyKey; decimals: number };
  private output: SkiaPictureOutput;
  private volumeBarColor: SkColor;
  private yAxis: YAxisLayout;

  private activeCandle: SharedValue<Bar | undefined>;
  private candleOrigin: SharedValue<number>;
  private chartMaxY: SharedValue<number>;
  private chartMinY: SharedValue<number>;
  private chartScale: SharedValue<number>;
  private isChartGestureActive: SharedValue<boolean>;
  private isDecelerating: SharedValue<boolean>;
  private isLoadingHistoricalCandles: SharedValue<boolean>;
  private maxDisplayedVolume: SharedValue<number>;
  private offset: SharedValue<number>;

  private chartPicture: SkPicture | undefined;
  private compositePicture: SkPicture | undefined;
  private crosshairPicture: SkPicture | undefined;
  private indicatorPicture: SkPicture | undefined;
  private lastCrosshairPosition = { x: 0, y: 0 };
  private lastVisibleRange = { startIndex: -1, endIndex: -1 };
  private panStartOffset = 0;
  private pictureRecorder = Skia.PictureRecorder();
  private labels = new Map<LabelSlot, LabelPicture>();
  private pinchAnchor: { index: number | null; width: number; x: number } | undefined;

  private animator = new Animator(() => this.rebuildChart());
  private indicatorBuilder = new IndicatorBuilder<IndicatorKey>();
  private perpsIndicatorBuilder: PerpsIndicatorBuilder | null = null;
  private timeFormatter = new TimeFormatter();

  private colors = {
    EMA9: Skia.Color('white'),
    EMA20: Skia.Color('#42A5F5'),
    EMA50: Skia.Color('#AB47BC'),
    crosshairDot: Skia.Color('#FFFFFF'),
    crosshairLine: Skia.Color('#FFFFFF'),
    crosshairPriceBubble: Skia.Color(getColorForTheme('fill', 'light')),
    labelSecondary: Skia.Color(getColorForTheme('labelSecondary', 'light')),
    labelQuinary: Skia.Color(getColorForTheme('labelQuinary', 'light')),
    green: Skia.Color(GREEN_CANDLE_COLOR),
    red: Skia.Color(RED_CANDLE_COLOR),
  };

  private paints = {
    bottomShadow: Skia.Paint(),
    candleBody: Skia.Paint(),
    candleWick: Skia.Paint(),
    candleStroke: Skia.Paint(),
    crosshairDot: Skia.Paint(),
    crosshairHalo: Skia.Paint(),
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
    candleOrigin,
    chartHeight,
    chartMaxY,
    chartMinY,
    chartScale,
    chartWidth,
    chartXOffset,
    config,
    fetchAdditionalCandles,
    isChartGestureActive,
    isDarkMode,
    isDecelerating,
    isLoadingHistoricalCandles,
    maxDisplayedVolume,
    nativeCurrency,
    output,
    perpsIndicatorData,
    token,
  }: {
    activeCandle: SharedValue<Bar | undefined>;
    buildParagraph: (segments: TextSegment | TextSegment[]) => SkParagraph | null;
    candleOrigin: SharedValue<number>;
    chartHeight: number;
    chartMaxY: SharedValue<number>;
    chartMinY: SharedValue<number>;
    chartScale: SharedValue<number>;
    chartWidth: number;
    chartXOffset: SharedValue<number>;
    config: CandlestickConfig;
    fetchAdditionalCandles: (enableFailureHaptics?: boolean) => void;
    isChartGestureActive: SharedValue<boolean>;
    isDarkMode: boolean;
    isDecelerating: SharedValue<boolean>;
    isLoadingHistoricalCandles: SharedValue<boolean>;
    maxDisplayedVolume: SharedValue<number>;
    nativeCurrency: { currency: NativeCurrencyKey; decimals: number };
    output: SkiaPictureOutput;
    perpsIndicatorData: PerpsIndicatorData | null;
    token: Token;
  }) {
    // ========== Core State ==========
    this.backgroundColor = Skia.Color(config.chart.backgroundColor);
    this.buildParagraph = buildParagraph;
    this.candleStrokeColor = Skia.Color(config.candles.strokeColor);
    this.candleWidth = config.candles.initialWidth;
    this.chartHeight = chartHeight;
    this.chartWidth = chartWidth;
    this.config = config;
    this.fetchAdditionalCandles = fetchAdditionalCandles;
    this.isDarkMode = isDarkMode;
    this.isHyperliquidToken = isHyperliquidToken(token);
    this.nativeCurrency = nativeCurrency;
    this.output = output;
    this.volumeBarColor = Skia.Color(config.volume.color);

    // ========== Shared Values ==========
    this.activeCandle = activeCandle;
    this.candleOrigin = candleOrigin;
    this.chartMaxY = chartMaxY;
    this.chartMinY = chartMinY;
    this.chartScale = chartScale;
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
    this.paints.crosshairHalo.setAntiAlias(true);
    this.setCrosshairPaintColors();

    if (!isDarkMode) {
      const color = opacity(this.config.crosshair.dotColor, 0.64);
      const shadowColor = Skia.Color(color);
      const shadow = Skia.ImageFilter.MakeDropShadow(0, 1, 2, 2, shadowColor, null);

      this.paints.crosshairDot.setImageFilter(shadow);
      this.paints.crosshairHalo.setImageFilter(shadow);
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

    this.yAxis = this.measureYAxis(0, 1);

    // ========== Perps Indicators ==========
    if (perpsIndicatorData && this.isHyperliquidToken && this.config.indicators.enablePerpsIndicators) {
      this.perpsIndicatorBuilder = new PerpsIndicatorBuilder({
        backgroundColor: this.backgroundColor,
        buildParagraph,
        chartWidth,
        isDarkMode,
        perpsIndicatorData,
        yAxisWidth: this.yAxis.width,
      });
      this.perpsIndicatorBuilder.updateData(perpsIndicatorData);
    }
  }

  // ============ Chart Layout Utilities ======================================= //

  private getVisibleIndices(): { startIndex: number; endIndex: number } {
    const chartWidth = this.chartWidth;
    const currentOffset = this.offset.value;
    const hasCandles = this.candles.length > 0;
    const stride = this.getStride(this.candleWidth);
    const rawStart = Math.floor((-currentOffset - this.candleWidth) / stride) + 1;
    const rawEnd = Math.ceil((chartWidth - currentOffset) / stride) - 1;
    const startIndex = Math.max(0, rawStart - this.firstCandleIndex);
    const endIndex = Math.min(this.candles.length - 1, rawEnd - this.firstCandleIndex);

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

    const perpsIndicatorRange = this.perpsIndicatorBuilder?.getMinMaxForRange();
    if (perpsIndicatorRange) {
      if (perpsIndicatorRange.min < min) min = perpsIndicatorRange.min;
      if (perpsIndicatorRange.max > max) max = perpsIndicatorRange.max;
    }

    if (min === Infinity || max === -Infinity) {
      return { min: 0, max: 1, startIndex, endIndex };
    }

    const range = max - min || 1;
    const verticalPadding = range * this.config.chart.candlesPaddingRatioVertical;
    const newBounds = { min: min - verticalPadding, max: max + verticalPadding, startIndex, endIndex };
    const lastPrice = this.candles[this.candles.length - 1]?.c;
    const buffer = (newBounds.max - newBounds.min) * 0.02;
    this.yAxis =
      this.currentPriceAxis && lastPrice >= newBounds.min - buffer && lastPrice <= newBounds.max + buffer
        ? this.currentPriceAxis
        : this.measureYAxis(newBounds.min, newBounds.max);
    return newBounds;
  }

  private getMaxDisplayedVolume(startIndex: number, endIndex: number): number {
    const candles = this.candles;
    let maxVolume = startIndex <= endIndex ? candles[startIndex].v : 0;
    for (let i = startIndex + 1; i <= endIndex; i++) {
      const volume = candles[i].v;
      if (volume > maxVolume) maxVolume = volume;
    }
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

  private getMinOffset(): number {
    const axisWidth = this.currentPriceAxis?.width ?? this.yAxis.width;
    const rightEdge = this.pinchAnchor?.index === null ? this.pinchAnchor.x : this.chartWidth - axisWidth;
    return rightEdge - (this.firstCandleIndex + this.candles.length) * this.getStride(this.candleWidth);
  }

  private getOffsetX(): number {
    return this.offset.value + this.candleOrigin.value;
  }

  private clampOffset(value: number): number {
    const minOffset = this.getMinOffset();
    const maxOffset = -this.candleOrigin.value;
    return minOffset > maxOffset ? minOffset : clamp(value, minOffset, maxOffset);
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

  private measureYAxis(minPrice: number, maxPrice?: number): YAxisLayout {
    const chartHeight = this.chartHeight;
    const candleRegionHeight = chartHeight - chartHeight * this.config.volume.heightFactor;
    const nativeCurrency = this.nativeCurrency.currency;
    const sampleCount = maxPrice === undefined ? 1 : 4;
    let maxDecimals = 0;
    let maxCharacters = 0;

    for (let i = 0; i < sampleCount; i++) {
      const y = chartHeight * (i / 4);
      const price = maxPrice === undefined ? minPrice : minPrice + ((maxPrice - minPrice) * (candleRegionHeight - y)) / candleRegionHeight;
      const numeric = formatCandlestickPrice(price, nativeCurrency, this.isHyperliquidToken).replace(/[^\d.]/g, '');
      const decimalIndex = numeric.indexOf('.');
      const decimals = decimalIndex === -1 ? 0 : numeric.length - decimalIndex - 1;
      maxDecimals = Math.max(maxDecimals, decimals);
      maxCharacters = Math.max(maxCharacters, numeric.length);
    }

    if (maxPrice === undefined && minPrice < 1.5 && nativeCurrency !== 'ETH' && maxDecimals === 2) {
      maxDecimals += 1;
      maxCharacters += 1;
    }

    const padding = this.config.chart.yAxisPaddingLeft + this.config.chart.yAxisPaddingRight;
    return { width: padding + getYAxisLabelWidth(maxCharacters) + (maxDecimals === 0 ? DECIMAL_WIDTH : 0), decimals: maxDecimals };
  }

  private formatPriceLabel(price: number): string {
    const [integer, fraction = ''] = formatCandlestickPrice(price, this.nativeCurrency.currency, this.isHyperliquidToken).split('.');
    const decimals = this.yAxis.decimals;
    return decimals ? `${integer}.${fraction.slice(0, decimals).padEnd(decimals, '0')}` : integer;
  }

  // ============ Chart Drawing Methods ======================================== //

  private buildBaseCandlesPicture(): void {
    const candleWidth = this.candleWidth;
    const chartHeight = this.chartHeight;
    const chartWidth = this.chartWidth;
    const currentOffset = this.getOffsetX();
    const hasCandles = this.candles.length > 0;
    const { startIndex, endIndex } = this.getVisibleIndices();

    // Prepare label pictures before starting the chart recording.
    const xAxisWidth = chartWidth - this.config.chart.xAxisInset * 2;
    const xAxisY = chartHeight + this.config.chart.xAxisGap;
    const startCandle = this.candles[startIndex];
    const endCandle = this.candles[endIndex];

    const startLabel = startCandle
      ? this.getLabelPicture(
          'startDate',
          this.timeFormatter.format(startCandle.t),
          this.colors.labelQuinary,
          xAxisWidth / 2,
          this.paints.text
        )
      : undefined;

    const endLabel = endCandle
      ? this.getLabelPicture('endDate', this.timeFormatter.format(endCandle.t), this.colors.labelQuinary, xAxisWidth / 2, this.paints.text)
      : undefined;

    const priceLabels: (LabelPicture | undefined)[] = [];

    if (hasCandles) {
      for (let i = 0; i < Y_AXIS_LABEL_SLOTS.length; i++) {
        const y = chartHeight * (i / 4) + 0.5;
        priceLabels.push(
          this.getLabelPicture(Y_AXIS_LABEL_SLOTS[i], this.getPriceAtYPosition(y), this.colors.labelQuinary, chartWidth, this.paints.text)
        );
      }
    }

    const minPrice = this.chartMinY.value;
    const maxPrice = this.chartMaxY.value;
    const volumeRegionHeight = chartHeight * this.config.volume.heightFactor;
    const candleRegionHeight = chartHeight - volumeRegionHeight;
    const priceRange = maxPrice - minPrice;

    function convertPriceToY(price: number): number {
      return candleRegionHeight - ((price - minPrice) / priceRange) * candleRegionHeight;
    }

    // ========== Current Price Calculation ==========
    const lastCandle = this.candles[this.candles.length - 1];
    const inRangeBuffer = (maxPrice - minPrice) * 0.02;
    const minVisiblePrice = minPrice - priceRange * (volumeRegionHeight / candleRegionHeight);
    const isCurrentPriceInRange = lastCandle && minVisiblePrice - inRangeBuffer <= lastCandle.c && lastCandle.c <= maxPrice + inRangeBuffer;

    let currentPriceY: number | undefined;
    if (isCurrentPriceInRange) currentPriceY = convertPriceToY(lastCandle.c);

    const lastCandleColor = currentPriceY ? (lastCandle.c >= lastCandle.o ? this.colors.green : this.colors.red) : undefined;
    const currentPriceLabel = lastCandleColor ? this.getLabelPicture('currentPrice', lastCandle.c, lastCandleColor, chartWidth) : undefined;

    const heightWithXAxis = this.chartHeight + this.config.chart.xAxisHeight + this.config.chart.xAxisGap * 2;
    const canvas = this.pictureRecorder.beginRecording({
      height: heightWithXAxis,
      width: this.chartWidth,
      x: 0,
      y: 0,
    });

    if (startLabel) this.drawLabel(canvas, startLabel, this.config.chart.xAxisInset, xAxisY);
    if (endLabel) this.drawLabel(canvas, endLabel, chartWidth - this.config.chart.xAxisInset - endLabel.width, xAxisY);

    canvas.clipRect({ x: 0, y: 0, width: chartWidth, height: chartHeight }, ClipOp.Intersect, true);

    // ========== Grid Lines and Price Labels ==========
    const stride = this.getStride(candleWidth);
    const visibleCandles = chartWidth / stride;
    const rawInterval = visibleCandles / 6;
    const candleInterval = Math.max(1, Math.round(this.getNiceInterval(rawInterval)));
    const firstGridIndex = Math.ceil((this.firstCandleIndex + startIndex) / candleInterval) * candleInterval - this.firstCandleIndex;

    for (let i = firstGridIndex; i <= endIndex; i += candleInterval) {
      const gx = i * stride + currentOffset + candleWidth / 2;
      canvas.drawLine(gx, 0, gx, chartHeight, this.paints.grid);
    }

    const labelX = chartWidth - this.yAxis.width + this.config.chart.yAxisPaddingLeft;
    let labelHeight: number | undefined = undefined;

    for (let i = 0; i <= 3; i++) {
      const y = chartHeight * (i / 4) + 0.5;
      canvas.drawLine(0, y, chartWidth, y, this.paints.grid);
      if (!hasCandles) continue;

      const label = priceLabels[i];

      if (label) {
        if (!labelHeight) labelHeight = label.height;
        this.drawLabel(canvas, label, labelX, y + getYOffsetForPriceLabel(i, labelHeight));
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
    if (currentPriceY && lastCandleColor) {
      this.paints.candleWick.setStrokeWidth(1);
      this.paints.candleWick.setColor(lastCandleColor);
      this.paints.candleWick.setAlphaf(0.4);
      canvas.drawLine(0, currentPriceY, chartWidth - this.yAxis.width / 2, currentPriceY, this.paints.candleWick);
    }

    // ========== Perps Indicator Lines ==========
    let perpsIndicatorPositions: IndicatorPosition[] = [];
    if (this.perpsIndicatorBuilder) {
      perpsIndicatorPositions = this.perpsIndicatorBuilder.drawLines(canvas, {
        candleRegionHeight,
        candleWidth,
        endIndex,
        maxPrice,
        minPrice,
        offsetX: currentOffset,
        startIndex,
        stride,
      });
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
    if (currentPriceLabel && currentPriceY && lastCandleColor) {
      const bubbleY = this.drawBubbleBackground({
        canvas,
        centerY: currentPriceY,
        color: lastCandleColor,
        labelWidth: currentPriceLabel.width,
        leftX: labelX,
        strokeOpacity: 0.15,
      });

      this.drawLabel(canvas, currentPriceLabel, labelX, bubbleY + (this.config.priceBubble.height - currentPriceLabel.height) / 2);
    }

    // ========== Perps Indicator Bubbles ==========
    if (this.perpsIndicatorBuilder) {
      this.perpsIndicatorBuilder.drawBubbles(canvas, perpsIndicatorPositions);
    }

    const oldPicture = this.chartPicture;
    this.chartPicture = this.pictureRecorder.finishRecordingAsPicture();
    oldPicture?.dispose();
  }

  // ============ Indicator Picture ============================================ //

  private buildIndicatorPicture(): void {
    if (!this.indicatorBuilder.activeIndicators.size) {
      this.indicatorPicture?.dispose();
      this.indicatorPicture = undefined;
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

    const oldPicture = this.indicatorPicture;
    this.indicatorPicture = this.pictureRecorder.finishRecordingAsPicture();
    oldPicture?.dispose();
  }

  // ============ Crosshair Picture ============================================ //

  private buildCrosshairPicture(cx: number, cy: number, active: boolean): boolean {
    const activeCandle = this.activeCandle;

    if (!active) {
      this.isChartGestureActive.value = false;
      if (!this.crosshairPicture) return false;
      this.crosshairPicture.dispose();
      this.crosshairPicture = undefined;
      return true;
    }

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

    const newActiveCandle = this.candles[nearestCandleIndex];

    const canvas = this.pictureRecorder.beginRecording({
      height: this.chartHeight,
      width: this.chartWidth,
      x: 0,
      y: 0,
    });

    canvas.drawLine(0, yWithOffset, this.chartWidth, yWithOffset, this.paints.crosshairLine);
    canvas.drawLine(snappedX, 0 + verticalInset, snappedX, this.chartHeight - verticalInset, this.paints.crosshairLine);

    canvas.drawCircle(
      snappedX,
      yWithOffset,
      config.crosshair.dotSize + config.crosshair.dotStrokeWidth / (isDarkMode ? 1 : 0.2),
      this.paints.crosshairHalo
    );

    canvas.drawCircle(snappedX, yWithOffset, config.crosshair.dotSize, this.paints.crosshairDot);

    if (newActiveCandle && !config.priceBubble.hidden) this.drawCrosshairPriceBubble(canvas, yWithOffset);

    const previousActiveCandle = activeCandle.value;
    const didCandleChange = previousActiveCandle?.t !== newActiveCandle?.t || previousActiveCandle?.c !== newActiveCandle?.c;

    if (didCandleChange) {
      activeCandle.value = newActiveCandle;
      if (previousActiveCandle) triggerHaptics('selection');
    }

    const oldPicture = this.crosshairPicture;
    this.crosshairPicture = this.pictureRecorder.finishRecordingAsPicture();
    oldPicture?.dispose();
    return true;
  }

  // ============ Picture Updates ============================================= //

  private updateChartPictures(animate: boolean, forceRebuildBounds: boolean): void {
    if (this.isDecelerating.value) {
      const currentOffset = this.offset.value;
      const clampedOffset = this.clampOffset(currentOffset);

      if (clampedOffset !== currentOffset) {
        triggerHaptics('soft');
        this.isDecelerating.value = false;
        this.offset.value = clampedOffset;
      }
    }

    this.handleAnimations(animate, forceRebuildBounds);
    this.buildBaseCandlesPicture();
    this.buildIndicatorPicture();
  }

  private publishPicture(): void {
    const previousComposite = this.compositePicture;
    if (this.indicatorPicture || this.crosshairPicture) {
      const canvas = this.pictureRecorder.beginRecording();
      if (this.chartPicture) canvas.drawPicture(this.chartPicture);
      if (this.indicatorPicture) canvas.drawPicture(this.indicatorPicture);
      if (this.crosshairPicture) canvas.drawPicture(this.crosshairPicture);
      this.compositePicture = this.pictureRecorder.finishRecordingAsPicture();
    } else {
      this.compositePicture = undefined;
    }
    setSkiaPicture(this.output, this.compositePicture ?? this.chartPicture);
    previousComposite?.dispose();
  }

  // ============ Animation Handler ============================================ //

  private handleAnimations(animate: boolean, forceRebuildBounds: boolean): void {
    const { startIndex: lastStartIndex, endIndex: lastEndIndex } = this.lastVisibleRange;
    const { min, max, startIndex, endIndex } = this.getPriceBounds();

    if (animate) {
      if (forceRebuildBounds || startIndex !== lastStartIndex || endIndex !== lastEndIndex) {
        const currentMin = this.chartMinY.value;
        const currentMax = this.chartMaxY.value;

        if (currentMin === min && currentMax === max) {
          this.chartMinY.value = min;
          this.chartMaxY.value = max;
        } else {
          this.animator.spring(
            [this.chartMinY, this.chartMaxY],
            [min, max],
            normalizeSpringConfig(Math.abs(currentMin - min), Math.abs(currentMax - max), this.config.animation.springConfig)
          );
        }

        const maxDisplayedVolume = this.getMaxDisplayedVolume(startIndex, endIndex);

        if (forceRebuildBounds || maxDisplayedVolume !== this.maxDisplayedVolume.value) {
          if (this.maxDisplayedVolume.value === -1 || this.maxDisplayedVolume.value === maxDisplayedVolume) {
            this.maxDisplayedVolume.value = maxDisplayedVolume;
          } else this.animator.spring(this.maxDisplayedVolume, maxDisplayedVolume, this.config.animation.springConfig);
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

  private getLabelPicture(
    key: LabelSlot,
    value: string | number,
    color: SkColor,
    layoutWidth: number,
    foregroundPaint?: SkPaint
  ): LabelPicture | undefined {
    const previous = this.labels.get(key);
    const decimals = typeof value === 'number' ? this.yAxis.decimals : 0;

    if (previous?.value === value && previous.decimals === decimals && previous.color === color) return previous;

    const text = typeof value === 'number' ? this.formatPriceLabel(value) : value;

    if (previous?.text === text && previous.color === color) {
      previous.value = value;
      previous.decimals = decimals;

      return previous;
    }

    const paragraph = this.buildParagraph({ color, foregroundPaint, text });
    if (!paragraph) return undefined;

    paragraph.layout(layoutWidth);
    const { width, height } = paragraph.getLineMetrics()[0];

    const canvas = this.pictureRecorder.beginRecording();
    paragraph.paint(canvas, 0, 0);
    const picture = this.pictureRecorder.finishRecordingAsPicture();
    paragraph.dispose();

    const label = { color, decimals, height, picture, text, value, width };
    this.labels.set(key, label);
    previous?.picture.dispose();

    return label;
  }

  private drawLabel(canvas: SkCanvas, label: LabelPicture, x: number, y: number): void {
    canvas.save();
    canvas.translate(x, y);
    canvas.drawPicture(label.picture);
    canvas.restore();
  }

  private clearLabels(): void {
    for (const label of this.labels.values()) label.picture.dispose();

    this.labels.clear();
  }

  private setCrosshairPaintColors(): void {
    const isDarkMode = this.isDarkMode;

    this.paints.crosshairHalo.setBlendMode(isDarkMode ? BlendMode.Overlay : BlendMode.SrcOver);
    this.paints.crosshairHalo.setColor(isDarkMode ? Skia.Color('#000000') : this.colors.crosshairDot);
    if (!isDarkMode) this.paints.crosshairHalo.setAlphaf(0.08);

    this.paints.crosshairDot.setBlendMode(BlendMode.SrcOver);
    this.paints.crosshairDot.setColor(isDarkMode ? this.colors.crosshairDot : Skia.Color('#FFFFFF'));
  }

  private drawCrosshairPriceBubble(canvas: SkCanvas, centerY: number): void {
    const text = this.formatPriceLabel(this.getPriceAtYPosition(centerY));
    const paragraph = this.buildParagraph({ color: this.colors.labelSecondary, text });
    if (!paragraph) return;

    paragraph.layout(this.chartWidth);
    const { height } = paragraph.getLineMetrics()[0];

    const symbol = supportedNativeCurrencies[this.nativeCurrency.currency].symbol;
    const numeric = text
      .replace(symbol, '')
      .replace(/,/g, '')
      .replace(/[KMB]$/, '');

    const leftX = this.chartWidth - this.yAxis.width + this.config.chart.yAxisPaddingLeft;
    const bubbleY = this.drawBubbleBackground({
      canvas,
      centerY,
      color: this.colors.crosshairPriceBubble,
      labelWidth: getYAxisLabelWidth(numeric.length) - 2,
      leftX,
      strokeOpacity: 0.12,
    });

    paragraph.paint(canvas, leftX, bubbleY + (this.config.priceBubble.height - height) / 2);
    paragraph.dispose();
  }

  private drawBubbleBackground({
    canvas,
    centerY,
    color,
    labelWidth,
    leftX,
    strokeOpacity,
  }: {
    canvas: SkCanvas;
    centerY: number;
    color: SkColor;
    labelWidth: number;
    leftX: number;
    strokeOpacity: number;
  }): number {
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

    return bubbleY;
  }

  // ============ Public Methods =============================================== //

  public rebuildChart(animate = true, forceRebuildBounds = false): void {
    this.updateChartPictures(animate, forceRebuildBounds);
    this.publishPicture();
  }

  public requestAdditionalCandles(): boolean {
    const shouldReject = !this.hasPreviousCandles || this.isLoadingHistoricalCandles.value || this.candles.length >= MAX_CANDLES_TO_LOAD;
    if (shouldReject) return false;
    runOnJS(this.fetchAdditionalCandles)();
    return true;
  }

  public setBuildParagraph(buildParagraph: (segments: TextSegment | TextSegment[]) => SkParagraph | null): void {
    this.buildParagraph = buildParagraph;
    this.clearLabels();
    this.perpsIndicatorBuilder?.setBuildParagraph(buildParagraph);

    this.buildBaseCandlesPicture();
    if (this.isChartGestureActive.value) {
      this.buildCrosshairPicture(this.lastCrosshairPosition.x, this.lastCrosshairPosition.y, true);
    }

    this.publishPicture();
  }

  public setCandles(
    newCandles: Bar[] | null,
    { hasPreviousCandles, shouldResetOffset = false }: { hasPreviousCandles: boolean; shouldResetOffset?: boolean }
  ): void {
    if (newCandles === null) {
      if (!this.chartPicture) this.rebuildChart(false, true);
      return;
    }

    if (!newCandles.length) this.clearLabels();

    const oldCandleCount = this.candles.length;
    const wasDataAdded = oldCandleCount > 0 && newCandles.length > oldCandleCount;
    const wasDataAppended = wasDataAdded && newCandles[newCandles.length - 1].t > this.candles[oldCandleCount - 1].t;
    const wasDataPrepended = oldCandleCount > 0 && newCandles.length > 0 && newCandles[0].t < this.candles[0].t;
    const currentOffset = this.offset.value;
    const currentMinOffset = this.getMinOffset();
    const isDecelerating = this.isDecelerating.value;
    const wasPinnedToRight =
      shouldResetOffset || !oldCandleCount || (wasDataAppended && Math.abs(currentOffset - currentMinOffset) < 1 && !isDecelerating);

    if (shouldResetOffset || !oldCandleCount || !newCandles.length) {
      this.firstCandleIndex = 0;
      this.pinchAnchor = undefined;
    } else if (wasDataPrepended) {
      this.firstCandleIndex -= firstIndexAtOrAfterTimestamp(newCandles, this.candles[0].t);
    }

    const lastCandle = newCandles[newCandles.length - 1];
    if (lastCandle?.c !== this.candles[oldCandleCount - 1]?.c) {
      this.currentPriceAxis = lastCandle ? this.measureYAxis(lastCandle.c) : undefined;
    }
    this.candleOrigin.value = this.firstCandleIndex * this.getStride(this.candleWidth);
    this.candles = newCandles;
    this.hasPreviousCandles = hasPreviousCandles;
    this.indicatorBuilder.computeAll(newCandles);

    if (wasPinnedToRight) this.offset.value = this.getMinOffset();
    if (!wasDataPrepended || shouldResetOffset) this.maxDisplayedVolume.value = -1;
    this.updateChartPictures(!wasPinnedToRight, true);
    if (this.isChartGestureActive.value) this.buildCrosshairPicture(this.lastCrosshairPosition.x, this.lastCrosshairPosition.y, true);
    this.publishPicture();
  }

  public snapToCurrentCandle(): void {
    const currentOffset = this.offset.value;
    const minOffset = this.getMinOffset();
    if (currentOffset === minOffset) return;

    this.offset.value = minOffset;
    this.rebuildChart(false, true);
  }

  public setColorMode(colorMode: 'dark' | 'light', backgroundColor: string, providedConfig: CandlestickChartProps['config']): void {
    this.clearLabels();

    const isDarkMode = colorMode === 'dark';
    this.isDarkMode = isDarkMode;
    this.colors.crosshairPriceBubble = Skia.Color(getColorForTheme('fill', colorMode));
    this.colors.labelSecondary = Skia.Color(getColorForTheme('labelSecondary', colorMode));
    this.colors.labelQuinary = Skia.Color(getColorForTheme('labelQuinary', colorMode));

    this.backgroundColor = Skia.Color(backgroundColor);
    this.paints.bottomShadow.setColor(this.backgroundColor);
    this.paints.bottomShadow.setAlphaf(0.48);
    this.paints.bottomShadow.setImageFilter(Skia.ImageFilter.MakeDropShadow(0, 4, 5, 5, this.backgroundColor, null));
    this.paints.topShadow.setColor(this.backgroundColor);
    this.paints.topShadow.setAlphaf(0.48);
    this.paints.topShadow.setImageFilter(Skia.ImageFilter.MakeDropShadow(0, -4, 5, 5, this.backgroundColor, null));

    if (this.perpsIndicatorBuilder) {
      this.perpsIndicatorBuilder.setColorMode(isDarkMode, this.backgroundColor);
    }

    if (providedConfig?.crosshair?.dotColor) {
      this.colors.crosshairDot = Skia.Color(providedConfig.crosshair.dotColor);
      if (!isDarkMode) {
        const color = opacity(providedConfig.crosshair.dotColor, 0.64);
        const shadowColor = Skia.Color(color);
        const shadow = Skia.ImageFilter.MakeDropShadow(0, 1, 2, 2, shadowColor, null);

        this.paints.crosshairDot.setImageFilter(shadow);
        this.paints.crosshairHalo.setImageFilter(shadow);
      }
    } else {
      this.colors.crosshairDot = Skia.Color(DEFAULT_CANDLESTICK_CONFIG.crosshair.dotColor);
    }

    this.setCrosshairPaintColors();

    if (isDarkMode) {
      this.paints.crosshairDot.setImageFilter(null);
      this.paints.crosshairHalo.setImageFilter(null);
    }

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
    this.animator.dispose();
    cancelAnimation(this.chartScale);
    this.isChartGestureActive.value = false;
    this.candles = [];
    this.compositePicture?.dispose();
    this.crosshairPicture?.dispose();
    this.chartPicture?.dispose();
    this.indicatorPicture?.dispose();
    this.pictureRecorder.dispose();
    this.clearLabels();

    this.indicatorBuilder.dispose();
    this.perpsIndicatorBuilder?.dispose();

    for (const paint of Object.values(this.paints)) paint.dispose();
  }

  // ============ Perps Indicators ============================================= //

  public updatePerpsIndicatorData(data: PerpsIndicatorData | null): void {
    if (!this.perpsIndicatorBuilder) return;
    this.perpsIndicatorBuilder.updateData(data);
    if (!this.candles.length) return;
    this.rebuildChart(true, true);
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
    if (!this.candles.length) return;
    this.isChartGestureActive.value = true;
    triggerHaptics('soft');

    if (this.config.animation.enableCrosshairPulse) {
      const chartScale = this.chartScale;
      chartScale.value = withTiming(0.9925, TIMING_CONFIGS.buttonPressConfig, isFinished => {
        if (!isFinished) return;
        triggerHaptics('soft');
        chartScale.value = withTiming(1, TIMING_CONFIGS.tabPressConfig);
      });
    }

    this.buildCrosshairPicture(x, y, true);
    this.publishPicture();
    this.lastCrosshairPosition.x = x;
    this.lastCrosshairPosition.y = y;
  }

  public onLongPressMove(x: number, y: number, state: GestureState): void {
    if (!this.isChartGestureActive.value) return;
    const isActive = state === GestureState.ACTIVE;
    if (this.buildCrosshairPicture(x, y, isActive)) this.publishPicture();
    this.lastCrosshairPosition.x = x;
    this.lastCrosshairPosition.y = y;
  }

  public onLongPressEnd(x: number, y: number, state: GestureState): void {
    if (state === GestureState.END) triggerHaptics('rigid');
    if (this.buildCrosshairPicture(x, y, false)) this.publishPicture();
  }

  public onPanStart(): void {
    cancelAnimation(this.offset);
    this.panStartOffset = this.offset.value;
    if (this.isDecelerating.value) this.isDecelerating.value = false;
  }

  public onPanChange(changeX: number): void {
    const currentOffset = this.offset.value;
    const proposed = currentOffset + changeX;
    const clamped = this.clampOffset(proposed);
    if (clamped === currentOffset) return;

    this.animator.direct(this.offset, clamped);

    if ((clamped === -this.candleOrigin.value || clamped === this.getMinOffset()) && currentOffset !== this.panStartOffset) {
      triggerHaptics('soft');
    } else {
      const distanceFromLeftEdge = Math.abs(clamped + this.candleOrigin.value);
      if (distanceFromLeftEdge < LOAD_THRESHOLD_PX) this.requestAdditionalCandles();
    }
  }

  public onPanEnd(velocityX: number): void {
    if (Math.abs(velocityX) > 100) {
      const currentOffset = this.offset.value;
      const clampedOffset = this.clampOffset(currentOffset);

      if (currentOffset === clampedOffset) {
        const minOffset = this.getMinOffset();
        const maxOffset = -this.candleOrigin.value;
        if (minOffset > maxOffset) return;

        const atLeftBoundary = currentOffset === maxOffset;
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

          if (didComplete && this.isChartGestureActive.value) {
            this.buildCrosshairPicture(this.lastCrosshairPosition.x, this.lastCrosshairPosition.y, true);
            this.publishPicture();
          }
        }
      );
    }
  }

  public onPinchStart(focalX: number): void {
    cancelAnimation(this.offset);
    const pinnedToRight = this.offset.value === this.getMinOffset();
    const stride = this.getStride(this.candleWidth);
    this.pinchAnchor = {
      index: pinnedToRight ? null : (focalX - this.offset.value) / stride,
      width: this.candleWidth,
      x: pinnedToRight ? this.offset.value + (this.firstCandleIndex + this.candles.length) * stride : focalX,
    };
    if (this.isDecelerating.value) this.isDecelerating.value = false;
  }

  public onPinchUpdate(scale: number): void {
    const anchor = this.pinchAnchor;
    if (!anchor) return;
    const newWidth = this.clampCandleWidth(anchor.width * scale);
    if (newWidth === this.candleWidth) return;

    this.candleWidth = newWidth;
    const stride = this.getStride(newWidth);
    this.candleOrigin.value = this.firstCandleIndex * stride;

    const endIndex = this.firstCandleIndex + this.candles.length;
    const index = anchor.index === null ? endIndex : clamp(anchor.index, this.firstCandleIndex, endIndex - 1);
    const proposedOffset = anchor.x - index * stride;
    const offset = anchor.index === null ? proposedOffset : this.clampOffset(proposedOffset);
    this.animator.direct(this.offset, offset);

    const distanceFromLeftEdge = Math.abs(offset + this.candleOrigin.value);
    if (distanceFromLeftEdge < LOAD_THRESHOLD_PX) this.requestAdditionalCandles();
  }

  public onPinchEnd(): void {
    this.pinchAnchor = undefined;
  }
}

enum ChartStatus {
  Empty = 'empty',
  Loaded = 'loaded',
  Loading = 'loading',
}

function useCandlestickChart({
  backgroundColor,
  chartHeight,
  chartWidth,
  isChartGestureActive,
  isDarkMode,
  isLoadingHistoricalCandles,
  providedConfig,
  providedToken,
}: {
  backgroundColor: string;
  chartHeight: number;
  chartWidth: number;
  isChartGestureActive: SharedValue<boolean>;
  isDarkMode: boolean;
  isLoadingHistoricalCandles: SharedValue<boolean>;
  providedConfig: CandlestickChartProps['config'];
  providedToken: Token;
}) {
  const { candles, isFetchingInitialData } = useStableValue(prepareCandlestickData);
  const config = useStableValue(() => buildChartConfig(backgroundColor, providedConfig));
  const token = useStableValue(() => providedToken);

  const buildParagraph = useSkiaText({
    align: 'left',
    color: 'labelQuinary',
    size: '11pt',
    weight: 'bold',
  });

  const activeCandle = useSharedValue<Bar | undefined>(undefined);
  const candleOrigin = useSharedValue(0);
  const chartMaxY = useSharedValue(0);
  const chartMinY = useSharedValue(0);
  const chartScale = useSharedValue(1);
  const chartXOffset = useSharedValue(0);
  const isDecelerating = useSharedValue(false);
  const maxDisplayedVolume = useSharedValue(0);

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
        token,
      })
        .then(data => {
          if (!fetchPromise.current) return;
          fetchPromise.current = !data || data?.hasPreviousCandles === true ? undefined : null;
        })
        .finally(() => {
          isLoadingHistoricalCandles.value = false;
        });
    },
    [isLoadingHistoricalCandles, token]
  );

  const renderer = useSkiaRenderer<CandlestickChartManager>({ deferred: true });

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
      if (data !== null) resetHistoricalFetchState(data, previousData);
      const shouldResetOffset = previousData === null || data?.candleResolution !== previousData?.candleResolution;

      runOnUI(() => {
        chartStatus.value = data === null ? ChartStatus.Loading : data.candles.length ? ChartStatus.Loaded : ChartStatus.Empty;
        const newCandles = data?.candles ?? null;
        renderer.manager?.setCandles(newCandles, {
          hasPreviousCandles: data?.hasPreviousCandles === true && (newCandles?.length ?? 0) < MAX_CANDLES_TO_LOAD,
          shouldResetOffset,
        });
      })();
    },
    [renderer, chartStatus, resetHistoricalFetchState]
  );

  const dataListener = useListen(useCandlestickStore, state => state.getData(), updateCandles, {
    equalityFn: isCandlestickDataEqual,
    fireImmediately: true,
  });
  useListenerRouteGuard(dataListener, { additionalRoutes: Routes.CLOSE_POSITION_BOTTOM_SHEET });

  useListen(
    useChartsStore,
    state => state.snapSignal,
    () => runOnUI(() => renderer.manager?.snapToCurrentCandle())()
  );

  useListen(
    usePerpsIndicatorData,
    state => state,
    perpsData => runOnUI(() => renderer.manager?.updatePerpsIndicatorData(perpsData))()
  );

  const chartTransform = useDerivedValue(() => [{ scale: !_WORKLET ? 1 : chartScale.value }]);
  const isChartLoading = useDerivedValue(() => (!_WORKLET ? isFetchingInitialData : chartStatus.value === ChartStatus.Loading));

  const isInHistoricalLoadRegion = useDerivedValue(() => {
    if (!_WORKLET || !isDecelerating.value || chartStatus.value !== ChartStatus.Loaded) return false;
    const currentOffset = chartXOffset.value + candleOrigin.value;
    const distanceFromLeftEdge = Math.abs(currentOffset);
    return distanceFromLeftEdge < LOAD_THRESHOLD_PX;
  });

  useAnimatedReaction(
    () => isInHistoricalLoadRegion.value,
    (current, previous) => {
      if (current && previous === false && !isLoadingHistoricalCandles.value) {
        renderer.manager?.requestAdditionalCandles();
      }
    },
    []
  );

  useOnChange(() => {
    runOnUI(() => {
      renderer.manager?.setColorMode(isDarkMode ? 'dark' : 'light', backgroundColor, providedConfig);
    })();
  }, [backgroundColor, renderer, isDarkMode, providedConfig]);

  const updateParagraphBuilder = useCallback(
    (manager: CandlestickChartManager) => {
      'worklet';
      manager.setBuildParagraph(buildParagraph);
    },
    [buildParagraph]
  );

  const pictureView = useMemo(
    () => (
      <SkiaPictureView
        onUpdate={updateParagraphBuilder}
        prepare={() => {
          const nativeCurrency = getNativeCurrency();
          const perpsIndicatorData = usePerpsIndicatorData.getState();
          return output => {
            'worklet';
            return new CandlestickChartManager({
              activeCandle,
              buildParagraph,
              candleOrigin,
              chartHeight,
              chartMaxY,
              chartMinY,
              chartScale,
              chartWidth,
              chartXOffset,
              config,
              fetchAdditionalCandles,
              isChartGestureActive,
              isDarkMode,
              isDecelerating,
              isLoadingHistoricalCandles,
              maxDisplayedVolume,
              nativeCurrency,
              output,
              perpsIndicatorData,
              token,
            });
          };
        }}
        renderer={renderer}
        style={styles.canvas}
      />
    ),
    [
      activeCandle,
      buildParagraph,
      candleOrigin,
      chartHeight,
      chartMaxY,
      chartMinY,
      chartScale,
      chartWidth,
      chartXOffset,
      config,
      fetchAdditionalCandles,
      isChartGestureActive,
      isDarkMode,
      isDecelerating,
      isLoadingHistoricalCandles,
      maxDisplayedVolume,
      renderer,
      token,
      updateParagraphBuilder,
    ]
  );

  return useMemo(
    () => ({
      activeCandle,
      candleOrigin,
      renderer,
      chartStatus,
      chartTransform,
      chartXOffset,
      config,
      fetchAdditionalCandles,
      isChartLoading,
      isDecelerating,
      pictureView,
    }),
    [
      activeCandle,
      candleOrigin,
      renderer,
      chartStatus,
      chartTransform,
      chartXOffset,
      config,
      fetchAdditionalCandles,
      isChartLoading,
      isDecelerating,
      pictureView,
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
  isChartGestureActive,
  showChartControls = false,
  symbol,
}: CandlestickChartProps) {
  const { isDarkMode } = useColorMode();
  const showDataMonitor = useExperimentalFlag(CANDLESTICK_DATA_MONITOR) && IS_DEV;
  const separatorTertiary = useForegroundColor('separatorTertiary');
  const { currency } = getNativeCurrency();

  const isLoadingHistoricalCandles = useSharedValue(false);
  const chartHeight = providedChartHeight - 13 - 10 - 16;

  const { activeCandle, candleOrigin, renderer, chartStatus, chartXOffset, config, fetchAdditionalCandles, isChartLoading, pictureView } =
    useCandlestickChart({
      backgroundColor,
      chartHeight,
      chartWidth,
      isChartGestureActive,
      isDarkMode,
      isLoadingHistoricalCandles,
      providedConfig,
      providedToken: symbol ?? { address, chainId },
    });

  const showLeftFade = useDerivedValue(() => !_WORKLET || chartXOffset.value + candleOrigin.value !== 0);
  const leftFadeStyle = useAnimatedStyle(() => ({
    opacity: withSpring(!_WORKLET || showLeftFade.value ? 1 : 0, SPRING_CONFIGS.snappierSpringConfig),
  }));

  const chartGestures = useMemo(() => {
    const pinchGesture = Gesture.Pinch()
      .onStart(e => renderer.manager?.onPinchStart(e.focalX))
      .onUpdate(e => renderer.manager?.onPinchUpdate(e.scale))
      .onFinalize(() => renderer.manager?.onPinchEnd());

    const panGesture = Gesture.Pan()
      .activeOffsetX([-4, 4])
      .failOffsetY([-12, 12])
      .maxPointers(1)
      .onStart(() => renderer.manager?.onPanStart())
      .onChange(e => renderer.manager?.onPanChange(e.changeX))
      .onEnd(e => renderer.manager?.onPanEnd(e.velocityX));

    const crosshairGesture = Gesture.LongPress()
      .maxDistance(10000)
      .minDuration(160)
      .numberOfPointers(1)
      .shouldCancelWhenOutside(true)
      .onStart(e => renderer.manager?.onLongPressStart(e.x, e.y))
      .onTouchesMove(e => renderer.manager?.onLongPressMove(e.allTouches[0].x, e.allTouches[0].y, e.state))
      .onFinalize(e => renderer.manager?.onLongPressEnd(e.x, e.y, e.state));

    return Gesture.Race(panGesture, pinchGesture, crosshairGesture);
  }, [renderer]);

  const chartCanvas = useMemo(() => <GestureDetector gesture={chartGestures}>{pictureView}</GestureDetector>, [chartGestures, pictureView]);

  const activeCardHeight = config.activeCandleCard.height + config.chart.activeCandleCardGap;
  const chartBottomPadding = config.chart.xAxisHeight + config.chart.xAxisGap * 2 + (showChartControls ? 56 : 0);
  const fullChartHeight = chartHeight + chartBottomPadding;
  const fullHeight = fullChartHeight + activeCardHeight;

  const activeCandleCardStyle = useAnimatedStyle(() => {
    const shouldDisplay = _WORKLET && isChartGestureActive.value;
    const timingConfig = TIMING_CONFIGS[shouldDisplay ? 'buttonPressConfig' : 'buttonPressConfig'];
    return {
      opacity: withTiming(shouldDisplay ? 1 : 0, timingConfig),
      transform: [{ scale: withTiming(shouldDisplay ? 1 : 1.02, timingConfig) }],
      zIndex: shouldDisplay ? 0 : -1,
    };
  });

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
        <DelayedMount delay="idle" maxWait={time.ms(300)}>
          <ActiveCandleCard accentColor={accentColor} activeCandle={activeCandle} backgroundColor={backgroundColor} currency={currency} />
        </DelayedMount>
      </Animated.View>

      {showDataMonitor && (
        <Animated.View style={[styles.spinnerContainer, dataMonitorStyle]}>
          <MountWhenFocused>
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

function buildChartConfig(backgroundColor: string, providedConfig: CandlestickChartProps['config']): CandlestickConfig {
  let config = cloneDeep<CandlestickConfig>(DEFAULT_CANDLESTICK_CONFIG);
  if (providedConfig) config = merge(config, providedConfig);
  config.chart.backgroundColor = backgroundColor;
  return config;
}

function prepareCandlestickData(): {
  candles: Bar[];
  isFetchingInitialData: boolean;
} {
  const existingData = candlestickActions.getData();
  return {
    candles: existingData?.candles || EMPTY_CANDLES,
    isFetchingInitialData: existingData === null,
  };
}

function getNativeCurrency(): { currency: NativeCurrencyKey; decimals: number } {
  const isHyperliquidChart = isHyperliquidToken(useChartsStore.getState().token);
  const currency = isHyperliquidChart ? NativeCurrencyKeys.USD : userAssetsStoreManager.getState().currency;
  return {
    currency,
    decimals: supportedNativeCurrencies[currency].decimals,
  };
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
