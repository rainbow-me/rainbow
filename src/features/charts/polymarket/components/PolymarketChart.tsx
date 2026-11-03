import React, { memo, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useListen } from '@storesjs/stores';
import { cloneDeep, merge } from 'lodash';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnUI,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';

import { AnimatedSpinner } from '@/components/animations/AnimatedSpinner';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { globalColors, useColorMode, useForegroundColor } from '@/design-system';
import { useSkiaText } from '@/design-system/components/SkiaText/useSkiaText';
import { opacity } from '@/design-system/utils/opacity';
import { SkiaPictureView, useSkiaRenderer } from '@/framework/ui/components/SkiaPictureView';
import { useOnChange } from '@/hooks/useOnChange';
import { useStableValue } from '@/hooks/useStableValue';
import { useListenerRouteGuard } from '@/state/internal/hooks/useListenerRouteGuard';
import { type DeepPartial } from '@/types/objects';
import { deepFreeze } from '@/utils/deepFreeze';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';

import { NoChartData } from '../../components/NoChartData';
import { type LineSmoothing } from '../../line/LineSmoothingAlgorithms';
import { PolymarketChartManager, type ActiveInteractionData, type PolymarketChartConfig } from '../classes/PolymarketChartManager';
import { usePolymarketChartStore, usePolymarketMarketChartStore } from '../stores/polymarketChartStore';
import { usePolymarketStore } from '../stores/polymarketStore';
import { EntranceAnimation, SERIES_PALETTES, SeriesPalette, type PolymarketChartData } from '../types';

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
  const chartHeight = providedChartHeight - xAxisAreaHeight;
  const initialStatus = useStableValue(() => {
    const data = (isMarketChart ? usePolymarketMarketChartStore : usePolymarketChartStore).getState().getData();
    return data ? (data.series.length ? ChartStatus.Loaded : ChartStatus.Empty) : ChartStatus.Loading;
  });

  const internalIsChartGestureActive = useSharedValue(false);
  const isChartGestureActive = providedIsChartGestureActive ?? internalIsChartGestureActive;

  const animationProgress = useSharedValue(100);
  const chartStatus = useSharedValue<ChartStatus>(initialStatus);
  const interactionProgress = useSharedValue(0);

  const renderer = useSkiaRenderer<PolymarketChartManager>({ deferred: true });

  const buildParagraph = useSkiaText({
    align: 'left',
    color: 'labelQuinary',
    halfLeading: true,
    size: '11pt',
    weight: 'bold',
  });

  const updateChart = useCallback(
    (newData: PolymarketChartData) => {
      runOnUI(() => {
        if (!renderer.manager) return;

        if (newData === null) {
          chartStatus.value = ChartStatus.Loading;
          return;
        }

        if (newData.series.length > 0) {
          renderer.manager.setSeriesData(newData.series, isDarkMode);
          chartStatus.value = ChartStatus.Loaded;
        } else {
          renderer.manager.clearData();
          chartStatus.value = ChartStatus.Empty;
        }
      })();
    },
    [renderer, chartStatus, isDarkMode]
  );

  const dataListener = useListen(
    isMarketChart ? usePolymarketMarketChartStore : usePolymarketChartStore,
    state => state.getData(),
    updateChart,
    { fireImmediately: true }
  );
  useListenerRouteGuard(dataListener);

  const updateHighlightedSeries = useCallback(
    (highlightedSeriesId: string | null) => {
      runOnUI(() => {
        renderer.manager?.setHighlightedSeries(highlightedSeriesId);
      })();
    },
    [renderer]
  );

  useListen(usePolymarketStore, state => state.highlightedSeriesId, updateHighlightedSeries, {
    fireImmediately: true,
  });

  useOnChange(() => {
    runOnUI(() => {
      renderer.manager?.setColorMode(isDarkMode);
    })();
  }, [renderer, isDarkMode]);

  const updateParagraphBuilder = useCallback(
    (manager: PolymarketChartManager) => {
      'worklet';
      manager.setBuildParagraph(buildParagraph);
    },
    [buildParagraph]
  );

  const chartGesture = useMemo(() => {
    return Gesture.LongPress()
      .maxDistance(10000)
      .minDuration(160)
      .numberOfPointers(1)
      .shouldCancelWhenOutside(true)
      .onStart(e => renderer.manager?.onLongPressStart(e.x))
      .onTouchesMove(e => {
        const touch = e.allTouches[0];
        if (touch) {
          renderer.manager?.onLongPressMove(touch.x, e.state);
        }
      })
      .onFinalize(e => renderer.manager?.onLongPressEnd(e.state));
  }, [renderer]);

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

  return (
    <View style={[styles.container, { height: providedChartHeight, width: chartWidth }]}>
      <GestureDetector gesture={chartGesture}>
        <Animated.View style={[styles.chartContainer, chartOpacity]}>
          <SkiaPictureView
            onUpdate={updateParagraphBuilder}
            prepare={() => {
              const config = buildChartConfig(backgroundColor, providedConfig);
              return output => {
                'worklet';
                return new PolymarketChartManager({
                  activeInteraction,
                  animationProgress,
                  buildParagraph,
                  chartHeight,
                  chartWidth,
                  config,
                  interactionProgress,
                  isChartGestureActive,
                  isDarkMode,
                  output,
                  smoothingMode,
                });
              };
            }}
            renderer={renderer}
            style={styles.canvas}
          />
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

function buildChartConfig(backgroundColor: string, providedConfig: PolymarketChartProps['config']): PolymarketChartConfig {
  let config = cloneDeep<PolymarketChartConfig>(DEFAULT_POLYMARKET_CHART_CONFIG);
  if (providedConfig) config = merge(config, providedConfig);
  config.chart.backgroundColor = backgroundColor;
  return config;
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
