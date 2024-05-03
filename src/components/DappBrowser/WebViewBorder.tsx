import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { SharedValue, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/utils/swaps';
import { Cover, globalColors } from '@/design-system';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { WEBVIEW_HEIGHT, ZOOMED_TAB_BORDER_RADIUS } from './Dimensions';
import { useBrowserContext } from './BrowserContext';

export const WebViewBorder = React.memo(function WebViewBorder({
  animatedTabIndex,
  enabled,
}: {
  animatedTabIndex: SharedValue<number>;
  enabled?: boolean;
}) {
  const { animatedActiveTabIndex, tabViewProgress, tabViewVisible } = useBrowserContext();

  const webViewBorderStyle = useAnimatedStyle(() => {
    if (!enabled) {
      return {
        pointerEvents: tabViewVisible.value ? 'auto' : 'none',
      };
    }

    const animatedIsActiveTab = animatedActiveTabIndex.value === animatedTabIndex.value;

    const borderRadius = interpolate(tabViewProgress.value, [0, 100], [animatedIsActiveTab ? ZOOMED_TAB_BORDER_RADIUS : 30, 30], 'clamp');
    const opacity = 1 - tabViewProgress.value / 100;

    return {
      borderRadius,
      opacity,
      pointerEvents: tabViewVisible.value ? 'auto' : 'none',
    };
  });

  return (
    <Cover pointerEvents="box-none" style={styles.zIndexStyle}>
      <Animated.View style={[enabled ? styles.webViewBorderStyle : {}, webViewBorderStyle]} />
    </Cover>
  );
});

const styles = StyleSheet.create({
  webViewBorderStyle: {
    backgroundColor: 'transparent',
    borderColor: opacity(globalColors.white100, 0.08),
    borderCurve: 'continuous',
    borderRadius: 16,
    borderWidth: THICK_BORDER_WIDTH,
    height: WEBVIEW_HEIGHT,
    overflow: 'hidden',
    width: DEVICE_WIDTH,
  },
  zIndexStyle: {
    zIndex: 30000,
  },
});
