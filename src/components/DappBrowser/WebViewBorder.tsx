import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { SharedValue, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/utils/swaps';
import { Cover, globalColors } from '@/design-system';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { useBrowserContext } from './BrowserContext';
import { WEBVIEW_HEIGHT, ZOOMED_TAB_BORDER_RADIUS } from './Dimensions';
import { RAINBOW_HOME } from './constants';

export const WebViewBorder = ({
  animatedTabIndex,
  enabled,
  tabId,
}: {
  animatedTabIndex: SharedValue<number>;
  enabled?: boolean;
  tabId: string;
}) => {
  const { animatedActiveTabIndex, animatedTabUrls, tabViewProgress, tabViewVisible } = useBrowserContext();

  const webViewBorderStyle = useAnimatedStyle(() => {
    const url = animatedTabUrls.value[tabId] || RAINBOW_HOME;
    const isOnHomepage = url === RAINBOW_HOME;
    const opacity = isOnHomepage ? 0 : 1 - tabViewProgress.value / 100;

    const animatedIsActiveTab = animatedActiveTabIndex.value === animatedTabIndex.value;
    const borderRadius = interpolate(tabViewProgress.value, [0, 100], [animatedIsActiveTab ? ZOOMED_TAB_BORDER_RADIUS : 30, 30], 'clamp');

    return {
      borderRadius: enabled ? borderRadius : 0,
      opacity: enabled ? opacity : 0,
      pointerEvents: tabViewVisible.value ? 'auto' : 'none',
    };
  });

  return (
    <Cover pointerEvents="box-none" style={styles.zIndexStyle}>
      <Animated.View style={[enabled ? styles.webViewBorderStyle : {}, webViewBorderStyle]} />
    </Cover>
  );
};

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
