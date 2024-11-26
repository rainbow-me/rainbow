import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { globalColors, useColorMode } from '@/design-system';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/utils/swaps';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { useBrowserContext } from './BrowserContext';
import { useBrowserWorkletsContext } from './BrowserWorkletsContext';
import { ZOOMED_TAB_BORDER_RADIUS } from './Dimensions';
import { RAINBOW_HOME } from './constants';

export const WebViewBorder = ({ tabId }: { tabId: string }) => {
  const { animatedTabUrls, isSwitchingTabs, tabViewBorderRadius, tabViewGestureProgress, tabViewProgress } = useBrowserContext();
  const { getTabInfo } = useBrowserWorkletsContext();
  const { isDarkMode } = useColorMode();

  const enabled = isDarkMode;

  const webViewBorderStyle = useAnimatedStyle(() => {
    if (!enabled) return { borderRadius: ZOOMED_TAB_BORDER_RADIUS, opacity: 0 };

    const { isFullSizeTab } = getTabInfo(tabId);

    const url = animatedTabUrls.value[tabId] || RAINBOW_HOME;
    const isOnHomepage = url === RAINBOW_HOME;
    const opacity = isOnHomepage ? 0 : 1 - tabViewProgress.value / 100;

    const borderRadius = interpolate(
      isSwitchingTabs.value && isFullSizeTab ? tabViewGestureProgress.value : tabViewProgress.value,
      [0, 0, 100],
      [ZOOMED_TAB_BORDER_RADIUS, isFullSizeTab ? ZOOMED_TAB_BORDER_RADIUS : tabViewBorderRadius.value, tabViewBorderRadius.value],
      'clamp'
    );

    return {
      borderRadius: enabled ? borderRadius : 0,
      opacity: enabled ? opacity : 0,
    };
  });

  return <Animated.View style={[enabled ? styles.webViewBorder : {}, webViewBorderStyle]} />;
};

const styles = StyleSheet.create({
  webViewBorder: {
    backgroundColor: 'transparent',
    borderColor: opacity(globalColors.white100, 0.08),
    borderCurve: 'continuous',
    borderRadius: 16,
    borderWidth: THICK_BORDER_WIDTH,
    bottom: 0,
    height: '100%',
    left: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
    position: 'absolute',
    right: 0,
    top: 0,
    width: DEVICE_WIDTH,
    zIndex: 30000,
  },
});
