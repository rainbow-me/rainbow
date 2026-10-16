import React, { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { useListen } from '@storesjs/stores';
import Animated, { runOnUI, useAnimatedReaction, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { SkiaPictureView, useSkiaRenderer } from '@/framework/ui/components/SkiaPictureView';
import { useOnChange } from '@/hooks/useOnChange';

import { COMPACT_LINE_CHART_HORIZONTAL_OVERDRAW, CompactLineChartRenderer } from '../compact/CompactLineChartRenderer';
import { type CompactLineChartData, type LineChartDataStore, type SparklineChartProps } from '../compact/types';
import { LiveSparklinePointer } from './LiveSparklinePointer';

// ============ Chart Component ================================================ //

/**
 * Compact line chart for dense card and list surfaces.
 *
 * Compatible with any store that implements {@link LineChartDataStore},
 * e.g. data stores created with `createLineChartDataStore(...)`.
 *
 * Pass `livePointer` to overlay a pulsing live-data dot at the line's end. A string
 * `color` paints once; a shared/derived `color` additionally recolors on the UI thread.
 */
export const SparklineChart = memo(function SparklineChart<S extends LineChartDataStore>({
  chartId,
  color,
  height,
  livePointer,
  store,
  width,
}: SparklineChartProps<S>) {
  const isColorString = typeof color === 'string';
  const renderWidth = width + COMPACT_LINE_CHART_HORIZONTAL_OVERDRAW * 2;
  const renderer = useSkiaRenderer<CompactLineChartRenderer>();
  const entranceProgress = useSharedValue(0);
  const hasRenderedData = useSharedValue(false);

  const animatedStyle = useAnimatedStyle(() => {
    const progress = entranceProgress.value;
    return { opacity: progress, transform: [{ translateY: 4 - progress * 4 }] };
  });

  const drawChart = useCallback(
    (nextData: CompactLineChartData | undefined) => {
      runOnUI((data: CompactLineChartData | undefined) => {
        const resolvedLineColor = isColorString ? color : color.value;
        const hasData = data !== undefined;
        const shouldAnimateIn = hasData && !hasRenderedData.value;

        renderer.manager?.setData(data, resolvedLineColor, width, height);
        hasRenderedData.value = hasData;

        if (shouldAnimateIn) entranceProgress.value = 0;
        entranceProgress.value = withSpring(hasData ? 1 : 0, SPRING_CONFIGS.softerSpringConfig);
      })(nextData);
    },
    [color, entranceProgress, hasRenderedData, height, isColorString, renderer, width]
  );

  useAnimatedReaction(
    () => (isColorString ? color : color.value),
    (nextColor, previousColor) => {
      if (previousColor === null || nextColor === previousColor) return;
      renderer.manager?.recolor(nextColor);
    },
    [color]
  );

  useListen(
    store,
    s => s.getChartData(chartId),
    data => drawChart(data),
    { fireImmediately: true }
  );

  useOnChange(() => {
    drawChart(store.getState().getChartData(chartId));
  }, [chartId, drawChart, store]);

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
        <SkiaPictureView
          initialize={output => {
            'worklet';
            return new CompactLineChartRenderer(output);
          }}
          renderer={renderer}
          style={[styles.canvas, { height, width: renderWidth }]}
        />
      </Animated.View>
      {livePointer ? <LiveSparklinePointer chartId={chartId} color={color} height={height} store={store} width={width} /> : null}
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
