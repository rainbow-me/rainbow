import React, { memo, useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import Animated, {
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import {
  COMPACT_LINE_CHART_HORIZONTAL_OVERDRAW,
  getCompactLineChartEndPoint,
} from '@/features/charts/line/compact/CompactLineChartRenderer';
import { type CompactLineChartData, type LineChartDataStore } from '@/features/charts/line/compact/types';
import { downsampleCompactLineChartData, SparklineChart } from '@/features/charts/line/components/SparklineChart';
import { useOnChange } from '@/hooks/useOnChange';
import { useListen } from '@/state/internal/hooks/useListen';
import { type BaseRainbowStore } from '@/state/internal/types';

type SparklineChartWithLivePointerProps<S extends LineChartDataStore> = {
  chartId: string;
  color: string;
  colorSharedValue?: SharedValue<string>;
  height: number;
  maxPoints?: number;
  store: BaseRainbowStore<S>;
  width: number;
};

const LIVE_POINTER_SIZE = 6;
const LIVE_POINTER_PULSE_DELAY = 750;
const LIVE_POINTER_PULSE_DURATION = 1250;
const LIVE_POINTER_PULSE_END_SCALE = 4;
const LIVE_POINTER_PULSE_START_OPACITY = 0.5;

export const SparklineChartWithLivePointer = memo(function SparklineChartWithLivePointer<S extends LineChartDataStore>({
  chartId,
  color,
  colorSharedValue,
  height,
  maxPoints,
  store,
  width,
}: SparklineChartWithLivePointerProps<S>) {
  const renderWidth = width + COMPACT_LINE_CHART_HORIZONTAL_OVERDRAW * 2;

  return (
    <View style={[styles.frame, { height, width }]}>
      <SparklineChart
        chartId={chartId}
        color={color}
        colorSharedValue={colorSharedValue}
        height={height}
        maxPoints={maxPoints}
        store={store}
        width={width}
      />
      <View
        pointerEvents="none"
        style={[
          styles.pointerLayer,
          {
            height,
            left: -COMPACT_LINE_CHART_HORIZONTAL_OVERDRAW,
            width: renderWidth,
          },
        ]}
      >
        <SparklineLivePointer
          chartId={chartId}
          color={color}
          colorSharedValue={colorSharedValue}
          height={height}
          maxPoints={maxPoints}
          store={store}
          width={width}
        />
      </View>
    </View>
  );
});

type SparklineLivePointerProps<S extends LineChartDataStore> = {
  chartId: string;
  color: string;
  colorSharedValue?: SharedValue<string>;
  height: number;
  maxPoints?: number;
  store: BaseRainbowStore<S>;
  width: number;
};

const SparklineLivePointer = memo(function SparklineLivePointer<S extends LineChartDataStore>({
  chartId,
  color,
  colorSharedValue,
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

  const colorStyle = useAnimatedStyle(() => ({
    backgroundColor: colorSharedValue?.value ?? color,
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
      <Animated.View style={[styles.livePointerPulse, { backgroundColor: color }, colorStyle, pulseStyle]} />
      <Animated.View style={[styles.livePointerDot, { backgroundColor: color }, colorStyle]} />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  frame: {
    overflow: 'visible',
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
  pointerLayer: {
    overflow: 'visible',
    position: 'absolute',
    top: 0,
  },
});
