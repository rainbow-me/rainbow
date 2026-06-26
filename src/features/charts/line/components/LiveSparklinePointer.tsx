import React, { memo, useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { useListen } from '@storesjs/stores';
import Animated, {
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import {
  COMPACT_LINE_CHART_HORIZONTAL_OVERDRAW,
  getCompactLineChartEndPoint,
} from '@/features/charts/line/compact/CompactLineChartRenderer';
import { type CompactLineChartData, type LineChartDataStore, type SparklineChartProps } from '@/features/charts/line/compact/types';
import { useOnChange } from '@/hooks/useOnChange';

const LIVE_POINTER_SIZE = 6;
const LIVE_POINTER_PULSE_DELAY = 750;
const LIVE_POINTER_PULSE_DURATION = 1250;
const LIVE_POINTER_PULSE_END_SCALE = 4;
const LIVE_POINTER_PULSE_START_OPACITY = 0.5;

type LiveSparklinePointerProps<S extends LineChartDataStore> = Omit<SparklineChartProps<S>, 'livePointer'>;

/**
 * Pulsing "live" dot pinned to the right end of a {@link SparklineChart}. Rendered by
 * `SparklineChart` when `livePointer` is set; owns its own overdraw layer so the dot
 * isn't clipped at the line's end.
 */
export const LiveSparklinePointer = memo(function LiveSparklinePointer<S extends LineChartDataStore>({
  chartId,
  color,
  height,
  store,
  width,
}: LiveSparklinePointerProps<S>) {
  const isColorString = typeof color === 'string';
  const renderWidth = width + COMPACT_LINE_CHART_HORIZONTAL_OVERDRAW * 2;

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
    backgroundColor: isColorString ? color : color.value,
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
      const pointerPoint = getCompactLineChartEndPoint(nextData, width, height);

      runOnUI((point: { x: number; y: number } | undefined) => {
        opacity.value = point ? 1 : 0;
        if (!point) return;

        x.value = point.x;
        y.value = point.y;
      })(pointerPoint);
    },
    [height, opacity, width, x, y]
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
  }, [chartId, height, setPointerPoint, store, width]);

  return (
    <View pointerEvents="none" style={[styles.pointerLayer, { height, left: -COMPACT_LINE_CHART_HORIZONTAL_OVERDRAW, width: renderWidth }]}>
      <Animated.View pointerEvents="none" style={[styles.livePointerContainer, pointerStyle]}>
        <Animated.View style={[styles.livePointerPulse, colorStyle, pulseStyle]} />
        <Animated.View style={[styles.livePointerDot, colorStyle]} />
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
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
