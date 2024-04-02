import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { Box, Cover, globalColors } from '@/design-system';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/screens/Swap/utils/swaps';
import { useBrowserContext } from './BrowserContext';
import { WEBVIEW_HEIGHT } from './Dimensions';

export const WebViewBorder = ({ enabled, tabId, tabIndex }: { enabled?: boolean; tabId: string; tabIndex: number }) => {
  const { animatedActiveTabIndex, currentlyOpenTabIds, tabViewProgress } = useBrowserContext();

  const webViewBorderStyle = useAnimatedStyle(() => {
    const progress = tabViewProgress?.value || 0;
    const rawAnimatedTabIndex = currentlyOpenTabIds?.value.indexOf(tabId);
    const animatedTabIndex = rawAnimatedTabIndex === -1 ? tabIndex : rawAnimatedTabIndex ?? tabIndex;
    const animatedIsActiveTab = animatedActiveTabIndex?.value === animatedTabIndex;

    const borderRadius = interpolate(progress, [0, 100], [animatedIsActiveTab ? 16 : 30, 30], 'clamp');
    const opacity = 1 - progress / 100;

    return {
      borderRadius,
      opacity,
    };
  });

  return enabled ? (
    <Cover pointerEvents="box-none" style={styles.zIndexStyle}>
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
  zIndexStyle: {
    zIndex: 30000,
  },
});
