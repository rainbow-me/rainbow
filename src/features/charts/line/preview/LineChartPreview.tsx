import React, { useCallback } from 'react';
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

import { CompactLineChartRenderer, LINE_CHART_PREVIEW_HORIZONTAL_OVERDRAW } from './CompactLineChartRenderer';
import { type LineChartPreviewData, type LineChartPreviewSource } from './types';

// ============ Types ========================================================== //

type LineChartPreviewProps<S extends LineChartPreviewSource> = {
  chartId: string;
  color: string;
  height: number;
  store: BaseRainbowStore<S>;
  width: number;
};

// ============ Component ====================================================== //

/**
 * Compact line chart preview for dense card and list surfaces.
 */
export function LineChartPreview<S extends LineChartPreviewSource>({ chartId, color, height, store, width }: LineChartPreviewProps<S>) {
  const renderWidth = width + LINE_CHART_PREVIEW_HORIZONTAL_OVERDRAW * 2;
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
    (nextData: LineChartPreviewData | undefined, nextColor: string) => {
      runOnUI((data: LineChartPreviewData | undefined, lineColor: string) => {
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
    nextData => drawChart(nextData, color),
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
  }, [initialPicture, renderer]);

  return (
    <View style={[styles.frame, { height, width }]}>
      <Animated.View
        style={[
          styles.canvasContainer,
          {
            height,
            left: -LINE_CHART_PREVIEW_HORIZONTAL_OVERDRAW,
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
});
