import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { Box, Cover, globalColors } from '@/design-system';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/screens/Swap/utils/swaps';
import { useBrowserContext } from './BrowserContext';
import { WEBVIEW_HEIGHT } from './Dimensions';

export const WebViewBorder = ({ enabled, tabIndex }: { enabled?: boolean; tabIndex: number }) => {
  const { animatedActiveTabIndex, tabViewProgress } = useBrowserContext();

  const webViewBorderStyle = useAnimatedStyle(() => {
    const progress = tabViewProgress?.value || 0;
    const borderRadius = interpolate(progress, [0, 100], [animatedActiveTabIndex?.value === tabIndex ? 16 : 30, 30], 'clamp');
    const opacity = 1 - progress / 100;

    return {
      borderRadius,
      opacity,
    };
  });

  return enabled ? (
    <Cover pointerEvents="box-none">
      <Box as={Animated.View} height={{ custom: WEBVIEW_HEIGHT }} style={[styles.webViewBorderStyle, webViewBorderStyle]} width="full" />
    </Cover>
  ) : null;
};

const styles = StyleSheet.create({
  webViewBorderStyle: {
    backgroundColor: 'transparent',
    borderColor: opacity(globalColors.white100, 0.08),
    borderCurve: 'continuous',
    borderRadius: 16,
    borderWidth: THICK_BORDER_WIDTH,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
});
