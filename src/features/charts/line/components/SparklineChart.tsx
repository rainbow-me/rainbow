import React, { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { Canvas, Picture } from '@shopify/react-native-skia';
import Animated, { runOnUI, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { useWorkletClass } from '@/hooks/reanimated/useWorkletClass';
import { useCleanup } from '@/hooks/useCleanup';
import { useOnChange } from '@/hooks/useOnChange';
import { useStableValue } from '@/hooks/useStableValue';
import { useListen } from '@/state/internal/hooks/useListen';
import { type BaseRainbowStore } from '@/state/internal/types';
import { createBlankPicture } from '@/worklets/skia';

import { COMPACT_LINE_CHART_HORIZONTAL_OVERDRAW, CompactLineChartRenderer } from '../compact/CompactLineChartRenderer';
import { type CompactLineChartData, type LineChartDataStore } from '../compact/types';

// ============ Types ========================================================== //

type SparklineChartProps<S extends LineChartDataStore> = {
  chartId: string;
  color: string;
  height: number;
  store: BaseRainbowStore<S>;
  width: number;
};

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
      runOnUI((data: CompactLineChartData | undefined, lineColor: string) => {
        const hasData = data !== undefined;
        const shouldAnimateIn = hasData && !hasRenderedData.value;

        renderer.value?.setData(data, lineColor);
        hasRenderedData.value = hasData;

        if (shouldAnimateIn) entranceProgress.value = 0;
        entranceProgress.value = withSpring(hasData ? 1 : 0, SPRING_CONFIGS.softerSpringConfig);
      })(nextData, nextColor);
    },
    [entranceProgress, hasRenderedData, renderer]
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
      </Animated.View>
    </View>
  );
});

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
});
