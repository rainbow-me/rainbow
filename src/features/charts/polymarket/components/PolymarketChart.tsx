import { Canvas, Picture, SkPicture } from '@shopify/react-native-skia';
import { cloneDeep, merge } from 'lodash';
import React, { memo, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { SharedValue, runOnUI, useAnimatedStyle, useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { AnimatedSpinner } from '@/components/animations/AnimatedSpinner';
import { globalColors } from '@/design-system/color/palettes';
import { useColorMode } from '@/design-system/color/ColorMode';
import { useForegroundColor } from '@/design-system/color/useForegroundColor';
import { useSkiaText } from '@/design-system/components/SkiaText/useSkiaText';
import { IS_IOS } from '@/env';
import { useWorkletClass } from '@/hooks/reanimated/useWorkletClass';
import { useCleanup } from '@/hooks/useCleanup';
import { useOnChange } from '@/hooks/useOnChange';
import { useStableValue } from '@/hooks/useStableValue';
import { useListen } from '@/state/internal/hooks/useListen';
import { DeepPartial } from '@/types/objects';
import { deepFreeze } from '@/utils/deepFreeze';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { opacity } from '@/framework/ui/utils/opacity';
import { createBlankPicture } from '@/worklets/skia';
import { NoChartData } from '../../components/NoChartData';
import { LineSmoothing } from '../../line/LineSmoothingAlgorithms';
import { ActiveInteractionData, PolymarketChartConfig, PolymarketChartManager } from '../classes/PolymarketChartManager';
import { usePolymarketChartStore, usePolymarketMarketChartStore } from '../stores/polymarketChartStore';
import { usePolymarketStore } from '../stores/polymarketStore';
import { EntranceAnimation, PolymarketChartData, SERIES_PALETTES, SeriesPalette } from '../types';
import { useListenerRouteGuard } from '@/state/internal/hooks/useListenerRouteGuard';

export type PartialPolymarketChartConfig = DeepPartial<
  Omit<PolymarketChartConfig, 'chart'> & { chart: Omit<PolymarketChartConfig['chart'], 'backgroundColor'> }
>;

type PolymarketChartProps = {
  activeInteraction?: SharedValue<ActiveInteractionData | undefined>;
  backgroundColor?: string;
  chartHeight?: number;
  chartWidth?: number;
  config?: PartialPolymarketChartConfig;
  isChartGestureActive?: SharedValue<boolean>;
  isMarketChart?: boolean;
  smoothingMode?: LineSmoothing;
};

enum ChartStatus {
  Empty = 'empty',
  Loaded = 'loaded',
  Loading = 'loading',
}

const DEFAULT_CHART_HEIGHT = 272;
const SPINNER_SIZE = 28;

type PreparedChartConfig = {
  chartHeight: number;
  chartWidth: number;
  config: PolymarketChartConfig;
  initialPicture: SkPicture;
  initialStatus: ChartStatus;
};

export const DEFAULT_POLYMARKET_CHART_CONFIG = deepFreeze({
  animation: {
    entranceAnimation: EntranceAnimation.Draw,
    entranceAnimationConfig: SPRING_CONFIGS.slowSpring,
    springConfig: { damping: 50, mass: 0.1, stiffness: 50 },
  },
  chart: {
    backgroundColor: '#141619',
    paddingRatioVertical: 0.1,
    xAxisGap: 10,
    xAxisHeight: 13,
    xAxisInset: 16,
    yAxisPaddingLeft: 12,
    yAxisPaddingRight: 8,
  },
  crosshair: {
    dotColor: globalColors.white100,
    dotSize: 3,
    dotStrokeWidth: 5 / 3,
    lineColor: globalColors.white100,
    strokeWidth: 2,
    yOffset: -68,
  },
  endCircle: {
    enabled: true,
    radius: 4,
    shadow: { alpha: 0.5, blur: 8, spread: 2 },
  },
  grid: {
    color: '#222528',
    strokeWidth: 1,
  },
  line: {
    colors: SERIES_PALETTES[SeriesPalette.Default],
    overrideSeriesColors: false,
    strokeWidth: 3.25,
  },
  lineShadow: {
    alpha: 0.24,
    blur: 20,
    enabled: true,
    y: 8,
  },
  tooltip: {
    bubbleHeight: 18,
    bubblePaddingHorizontal: 10,
    strokeWidth: 1,
  },
} as const satisfies PolymarketChartConfig);

export const PolymarketChart = memo(function PolymarketChart({
  activeInteraction,
  backgroundColor: providedBackgroundColor,
  chartHeight: providedChartHeight = DEFAULT_CHART_HEIGHT,
  chartWidth = DEVICE_WIDTH,
  config: providedConfig,
  isChartGestureActive: providedIsChartGestureActive,
  isMarketChart = false,
  smoothingMode,
}: PolymarketChartProps) {
  const { isDarkMode } = useColorMode();
  const separatorTertiary = useForegroundColor('separatorTertiary');
  const backgroundColor = providedBackgroundColor ?? (isDarkMode ? '#141619' : '#FFFFFF');

  const xAxisAreaHeight = DEFAULT_POLYMARKET_CHART_CONFIG.chart.xAxisHeight + DEFAULT_POLYMARKET_CHART_CONFIG.chart.xAxisGap * 2;
  const baseChartHeight = providedChartHeight - xAxisAreaHeight;

  const {
    chartHeight,
    chartWidth: preparedChartWidth,
    config,
    initialPicture,
    initialStatus,
  } = useStableValue<PreparedChartConfig>(() =>
    prepareChartConfig({
      backgroundColor,
      baseChartHeight,
      chartWidth,
      isMarketChart,
      providedChartHeight,
      providedConfig,
    })
  );

  const internalIsChartGestureActive = useSharedValue(false);
  const isChartGestureActive = providedIsChartGestureActive ?? internalIsChartGestureActive;

  const animationProgress = useSharedValue(100);
  const chartMaxY = useSharedValue(1);
  const chartMinY = useSharedValue(0);
  const chartStatus = useSharedValue<ChartStatus>(initialStatus);
  const interactionProgress = useSharedValue(0);

  const chartPicture = useSharedValue(initialPicture);
  const crosshairPicture = useSharedValue(initialPicture);

  const buildParagraph = useSkiaText({
    align: 'left',
    color: 'labelQuinary',
    halfLeading: true,
    size: '11pt',
    weight: 'bold',
  });

  const chartManager = useWorkletClass(() => {
    'worklet';
    return new PolymarketChartManager({
      activeInteraction,
      animationProgress,
      buildParagraph,
      chartHeight,
      chartMaxY,
      chartMinY,
      chartPicture,
      chartWidth: preparedChartWidth,
      config,
      crosshairPicture,
      interactionProgress,
      isChartGestureActive,
      isDarkMode,
      smoothingMode,
    });
  }, true);

  const updateChart = useCallback(
    (newData: PolymarketChartData) => {
      runOnUI(() => {
        if (!chartManager.value) return;

        if (newData === null) {
          chartStatus.value = ChartStatus.Loading;
          return;
        }

        if (newData.series.length > 0) {
          chartManager.value.setSeriesData(newData.series, isDarkMode);
          chartStatus.value = ChartStatus.Loaded;
        } else {
          chartManager.value.clearData();
          chartStatus.value = ChartStatus.Empty;
        }
      })();
    },
    [chartManager, chartStatus, isDarkMode]
  );

  useListenerRouteGuard(
    useListen(isMarketChart ? usePolymarketMarketChartStore : usePolymarketChartStore, state => state.getData(), updateChart, {
      fireImmediately: true,
    })
  );

  const updateHighlightedSeries = useCallback(
    (highlightedSeriesId: string | null) => {
      runOnUI(() => {
        chartManager.value?.setHighlightedSeries?.(highlightedSeriesId);
      })();
    },
    [chartManager]
  );

  useListen(usePolymarketStore, state => state.highlightedSeriesId, updateHighlightedSeries, { fireImmediately: true });

  useOnChange(() => {
    runOnUI(() => {
      chartManager.value?.setColorMode?.(isDarkMode, backgroundColor);
    })();
  }, [backgroundColor, chartManager, isDarkMode]);

  useOnChange(() => {
    if (IS_IOS) return;
    runOnUI(() => chartManager.value?.setBuildParagraph?.(buildParagraph))();
  }, [buildParagraph, chartManager]);

  const chartGesture = useMemo(() => {
    return Gesture.LongPress()
      .maxDistance(10000)
      .minDuration(160)
      .numberOfPointers(1)
      .shouldCancelWhenOutside(true)
      .onStart(e => chartManager.value?.onLongPressStart?.(e.x))
      .onTouchesMove(e => {
        const touch = e.allTouches[0];
        if (touch) {
          chartManager.value?.onLongPressMove?.(touch.x, e.state);
        }
      })
      .onFinalize(e => chartManager.value?.onLongPressEnd?.(e.state));
  }, [chartManager]);

  const isLoading = useDerivedValue(() => chartStatus.value === ChartStatus.Loading);
  const isEmpty = useDerivedValue(() => chartStatus.value === ChartStatus.Empty);
  const isLoaded = useDerivedValue(() => chartStatus.value === ChartStatus.Loaded);

  const chartOpacity = useAnimatedStyle(() => {
    const targetOpacity = isLoaded.value ? 1 : isEmpty.value ? 0.5 : 0.2;
    return { opacity: withSpring(targetOpacity, SPRING_CONFIGS.snappyMediumSpringConfig) };
  });

  const spinnerOpacity = useAnimatedStyle(() => ({
    opacity: withSpring(isLoading.value ? 1 : 0, SPRING_CONFIGS.snappierSpringConfig),
  }));

  const emptyStateOpacity = useAnimatedStyle(() => ({
    opacity: withSpring(isEmpty.value ? 1 : 0, SPRING_CONFIGS.snappierSpringConfig),
  }));

  useCleanup(() => {
    initialPicture.dispose();
    runOnUI(() => {
      chartManager.value?.dispose?.();
      chartManager.value = undefined;
    })();
  });

  return (
    <View style={[styles.container, { height: providedChartHeight, width: chartWidth }]}>
      <GestureDetector gesture={chartGesture}>
        <Animated.View style={[styles.chartContainer, chartOpacity]}>
          <Canvas style={styles.canvas}>
            <Picture picture={chartPicture} />
            <Picture picture={crosshairPicture} />
          </Canvas>
        </Animated.View>
      </GestureDetector>

      <Animated.View pointerEvents="none" style={[styles.overlay, { height: chartHeight }, spinnerOpacity]}>
        <AnimatedSpinner color={isDarkMode ? globalColors.white100 : globalColors.grey100} isLoading={isLoading} size={SPINNER_SIZE} />
      </Animated.View>

      <Animated.View pointerEvents="none" style={[styles.overlay, { height: chartHeight }, emptyStateOpacity]}>
        <NoChartData height={{ custom: providedChartHeight }} />
      </Animated.View>

      <View
        style={[
          styles.bottomGridLine,
          {
            backgroundColor: opacity(separatorTertiary, isDarkMode ? 0.06 : 0.03),
            bottom: xAxisAreaHeight,
          },
        ]}
      />
    </View>
  );
});

function prepareChartConfig({
  backgroundColor,
  baseChartHeight,
  chartWidth,
  isMarketChart,
  providedChartHeight,
  providedConfig,
}: {
  backgroundColor: string;
  baseChartHeight: number;
  chartWidth: number;
  isMarketChart: boolean;
  providedChartHeight: number;
  providedConfig: PolymarketChartProps['config'];
}): PreparedChartConfig {
  const store = (isMarketChart ? usePolymarketMarketChartStore : usePolymarketChartStore).getState();
  const cachedData = store.getData();

  let mergedConfig = cloneDeep<PolymarketChartConfig>(DEFAULT_POLYMARKET_CHART_CONFIG);
  if (providedConfig) mergedConfig = merge(mergedConfig, providedConfig);
  mergedConfig.chart.backgroundColor = backgroundColor;

  const height = baseChartHeight;
  const width = chartWidth;
  const status = cachedData ? (cachedData.series.length ? ChartStatus.Loaded : ChartStatus.Empty) : ChartStatus.Loading;

  return {
    chartHeight: height,
    chartWidth: width,
    config: mergedConfig,
    initialPicture: createBlankPicture(width, providedChartHeight),
    initialStatus: status,
  };
}

const styles = StyleSheet.create({
  bottomGridLine: {
    height: 1,
    left: 0,
    pointerEvents: 'none',
    position: 'absolute',
    right: 0,
  },
  canvas: {
    flex: 1,
  },
  chartContainer: {
    flex: 1,
  },
  container: {
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
