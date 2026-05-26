import React, { memo, useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { Canvas, Picture } from '@shopify/react-native-skia';
import Animated, {
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { useWorkletClass } from '@/hooks/reanimated/useWorkletClass';
import { useCleanup } from '@/hooks/useCleanup';
import { useOnChange } from '@/hooks/useOnChange';
import { useStableValue } from '@/hooks/useStableValue';
import { useListen } from '@/state/internal/hooks/useListen';
import { type BaseRainbowStore } from '@/state/internal/types';
import { createBlankPicture } from '@/worklets/skia';

import {
  COMPACT_LINE_CHART_HORIZONTAL_OVERDRAW,
  CompactLineChartRenderer,
  getCompactLineChartEndPoint,
} from '../compact/CompactLineChartRenderer';
import { type CompactLineChartData, type LineChartDataStore } from '../compact/types';

// ============ Types ========================================================== //

type SparklineChartProps<S extends LineChartDataStore> = {
  chartId: string;
  color: string;
  height: number;
  maxPoints?: number;
  showLivePointer?: boolean;
  store: BaseRainbowStore<S>;
  width: number;
};

const LIVE_POINTER_SIZE = 6;
const LIVE_POINTER_PULSE_DELAY = 750;
const LIVE_POINTER_PULSE_DURATION = 1250;
const LIVE_POINTER_PULSE_END_SCALE = 4;
const LIVE_POINTER_PULSE_START_OPACITY = 0.5;

// ============ Chart Component ================================================ //

/**
 * Compact line chart for dense card and list surfaces.
 *
 * Compatible with any store that implements {@link LineChartDataStore},
 * e.g. data stores created with `createLineChartDataStore(...)`.
 */
export const SparklineChart = memo(function SparklineChart<S extends LineChartDataStore>({
  chartId,
  color,
  height,
  maxPoints,
  showLivePointer = false,
  store,
  width,
}: SparklineChartProps<S>) {
  const renderWidth = width + COMPACT_LINE_CHART_HORIZONTAL_OVERDRAW * 2;
  const initialPicture = useStableValue(() => createBlankPicture(renderWidth, height));

  const chartPicture = useSharedValue(initialPicture);
  const entranceProgress = useSharedValue(0);
  const hasRenderedData = useSharedValue(false);

  const renderer = useWorkletClass(
    () => ({ blankPicture: initialPicture, chartPicture, contentWidth: width, height }),
    config => {
      'worklet';
      return new CompactLineChartRenderer(config);
    }
  );

  const animatedStyle = useAnimatedStyle(() => {
    const progress = entranceProgress.value;
    return { opacity: progress, transform: [{ translateY: 4 - progress * 4 }] };
  });

  const drawChart = useCallback(
    (nextData: CompactLineChartData | undefined, nextColor: string) => {
      const chartData = maxPoints === undefined ? nextData : downsampleCompactLineChartData(nextData, maxPoints);

      runOnUI((data: CompactLineChartData | undefined, lineColor: string) => {
        const hasData = data !== undefined;
        const shouldAnimateIn = hasData && !hasRenderedData.value;

        renderer.value?.setData(data, lineColor);
        hasRenderedData.value = hasData;

        if (shouldAnimateIn) entranceProgress.value = 0;
        entranceProgress.value = withSpring(hasData ? 1 : 0, SPRING_CONFIGS.softerSpringConfig);
      })(chartData, nextColor);
    },
    [entranceProgress, hasRenderedData, maxPoints, renderer]
  );

  useListen(
    store,
    s => s.getChartData(chartId),
    data => drawChart(data, color),
    { fireImmediately: true }
  );

  useOnChange(() => {
    drawChart(store.getState().getChartData(chartId), color);
  }, [chartId, color, drawChart, store]);

  useCleanup(() => {
    initialPicture.dispose();
    runOnUI(() => {
      renderer.value?.dispose?.();
      renderer.value = undefined;
    })();
  });

  return (
    <View style={[styles.frame, { height, width }]}>
      <Animated.View
        style={[
          styles.canvasContainer,
          {
            height,
            left: -COMPACT_LINE_CHART_HORIZONTAL_OVERDRAW,
            width: renderWidth,
          },
          animatedStyle,
        ]}
      >
        <Canvas style={[styles.canvas, { height, width: renderWidth }]}>
          <Picture picture={chartPicture} />
        </Canvas>
        {showLivePointer && (
          <SparklineLivePointer chartId={chartId} color={color} height={height} maxPoints={maxPoints} store={store} width={width} />
        )}
      </Animated.View>
    </View>
  );
});

type SparklineLivePointerProps<S extends LineChartDataStore> = {
  chartId: string;
  color: string;
  height: number;
  maxPoints?: number;
  store: BaseRainbowStore<S>;
  width: number;
};

const SparklineLivePointer = memo(function SparklineLivePointer<S extends LineChartDataStore>({
  chartId,
  color,
  height,
  maxPoints,
  store,
  width,
}: SparklineLivePointerProps<S>) {
  const opacity = useSharedValue(0);
  const pulseOpacity = useSharedValue(LIVE_POINTER_PULSE_START_OPACITY);
  const pulseScale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);

  const pointerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: x.value }, { translateY: y.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));

  const startPulse = useCallback(() => {
    'worklet';
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: LIVE_POINTER_PULSE_DURATION }),
        withDelay(LIVE_POINTER_PULSE_DELAY, withTiming(LIVE_POINTER_PULSE_START_OPACITY, { duration: 0 }))
      ),
      -1,
      true
    );
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(LIVE_POINTER_PULSE_END_SCALE, { duration: LIVE_POINTER_PULSE_DURATION }),
        withDelay(LIVE_POINTER_PULSE_DELAY, withTiming(1, { duration: 0 }))
      ),
      -1,
      true
    );
  }, [pulseOpacity, pulseScale]);

  const setPointerPoint = useCallback(
    (nextData: CompactLineChartData | undefined) => {
      const chartData = maxPoints === undefined ? nextData : downsampleCompactLineChartData(nextData, maxPoints);
      const pointerPoint = getCompactLineChartEndPoint(chartData, width, height);

      runOnUI((point: { x: number; y: number } | undefined) => {
        opacity.value = point ? 1 : 0;
        if (!point) return;

        x.value = point.x;
        y.value = point.y;
      })(pointerPoint);
    },
    [height, maxPoints, opacity, width, x, y]
  );

  useEffect(() => {
    runOnUI(startPulse)();
  }, [startPulse]);

  useListen(
    store,
    s => s.getChartData(chartId),
    data => setPointerPoint(data),
    { fireImmediately: true }
  );

  useOnChange(() => {
    setPointerPoint(store.getState().getChartData(chartId));
  }, [chartId, height, maxPoints, setPointerPoint, store, width]);

  return (
    <Animated.View pointerEvents="none" style={[styles.livePointerContainer, pointerStyle]}>
      <Animated.View style={[styles.livePointerPulse, { backgroundColor: color }, pulseStyle]} />
      <View style={[styles.livePointerDot, { backgroundColor: color }]} />
    </Animated.View>
  );
});

function downsampleCompactLineChartData(data: CompactLineChartData | undefined, maxPoints: number): CompactLineChartData | undefined {
  if (!data || maxPoints <= 0) return data;

  const pointCount = Math.min(data.prices.length, data.timestamps.length);
  if (pointCount <= maxPoints) return data;

  if (maxPoints === 1) {
    return {
      prices: data.prices.slice(pointCount - 1),
      timestamps: data.timestamps.slice(pointCount - 1),
    };
  }

  const prices = new Float32Array(maxPoints);
  const timestamps = new Uint32Array(maxPoints);
  const sourceLastIndex = pointCount - 1;
  const targetLastIndex = maxPoints - 1;

  prices[0] = data.prices[0];
  timestamps[0] = data.timestamps[0];
  prices[targetLastIndex] = data.prices[sourceLastIndex];
  timestamps[targetLastIndex] = data.timestamps[sourceLastIndex];

  for (let targetIndex = 1; targetIndex < targetLastIndex; targetIndex++) {
    const bucketStart = Math.floor((targetIndex * sourceLastIndex) / targetLastIndex);
    const bucketEnd = Math.max(bucketStart + 1, Math.floor(((targetIndex + 1) * sourceLastIndex) / targetLastIndex));
    let priceTotal = 0;
    let timestampTotal = 0;
    let bucketSize = 0;

    for (let sourceIndex = bucketStart; sourceIndex <= bucketEnd && sourceIndex < sourceLastIndex; sourceIndex++) {
      priceTotal += data.prices[sourceIndex];
      timestampTotal += data.timestamps[sourceIndex];
      bucketSize += 1;
    }

    if (bucketSize === 0) {
      const fallbackIndex = Math.round((targetIndex * sourceLastIndex) / targetLastIndex);
      prices[targetIndex] = data.prices[fallbackIndex];
      timestamps[targetIndex] = data.timestamps[fallbackIndex];
    } else {
      prices[targetIndex] = priceTotal / bucketSize;
      timestamps[targetIndex] = Math.round(timestampTotal / bucketSize);
    }
  }

  return { prices, timestamps };
}

// ============ Styles ========================================================= //

const styles = StyleSheet.create({
  frame: {
    overflow: 'visible',
  },
  canvas: {
    overflow: 'visible',
  },
  canvasContainer: {
    overflow: 'visible',
    position: 'absolute',
    top: 0,
  },
  livePointerContainer: {
    height: LIVE_POINTER_SIZE,
    left: -LIVE_POINTER_SIZE / 2,
    position: 'absolute',
    top: -LIVE_POINTER_SIZE / 2,
    width: LIVE_POINTER_SIZE,
  },
  livePointerDot: {
    borderRadius: LIVE_POINTER_SIZE / 2,
    height: LIVE_POINTER_SIZE,
    width: LIVE_POINTER_SIZE,
  },
  livePointerPulse: {
    borderRadius: LIVE_POINTER_SIZE / 2,
    height: LIVE_POINTER_SIZE,
    position: 'absolute',
    width: LIVE_POINTER_SIZE,
  },
});
