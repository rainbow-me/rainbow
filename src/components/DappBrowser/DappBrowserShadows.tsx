/* eslint-disable no-nested-ternary */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { AnimatedStyle, useAnimatedStyle } from 'react-native-reanimated';
import { globalColors, useColorMode } from '@/design-system';
import { IS_IOS } from '@/env';
import { clamp } from '@/__swaps__/utils/swaps';
import { useBrowserContext } from './BrowserContext';
import { RAINBOW_HOME } from './constants';
import { TabViewGestureStates } from './types';
import { getTabInfo } from './utils/getTabInfo';

export const BrowserButtonShadows = ({
  backgroundColor,
  borderRadius,
  children,
  hideDarkModeShadows,
  lightShadows,
}: {
  backgroundColor?: string;
  borderRadius?: number;
  children: React.ReactNode;
  hideDarkModeShadows?: boolean;
  lightShadows?: boolean;
}) => {
  const { isDarkMode } = useColorMode();

  if (!IS_IOS || (isDarkMode && hideDarkModeShadows)) return <>{children}</>;

  return (
    <View
      style={[
        styles.outerButtonShadow,
        {
          backgroundColor,
          borderRadius,
          shadowOpacity: isDarkMode ? 0.3 : lightShadows ? 0.06 : 0.08,
        },
      ]}
    >
      <View
        style={[
          styles.innerButtonShadow,
          {
            backgroundColor,
            borderRadius,
            shadowOpacity: isDarkMode ? 0.2 : lightShadows ? 0.02 : 0.04,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const INNER_SHADOW_OPACITY = 0.04;
const OUTER_SHADOW_OPACITY = 0.1;

export const WebViewShadows = ({
  children,
  tabId,
  zIndexAnimatedStyle,
}: {
  children: React.ReactNode;
  tabId: string;
  zIndexAnimatedStyle: AnimatedStyle;
}) => {
  const {
    animatedActiveTabIndex,
    animatedTabUrls,
    currentlyOpenTabIds,
    pendingTabSwitchOffset,
    tabViewGestureState,
    tabViewGestureProgress,
    tabViewProgress,
  } = useBrowserContext();
  const { isDarkMode } = useColorMode();

  const innerShadowOpacityOverride = useAnimatedStyle(() => {
    const { isFullSizeTab } = getTabInfo({
      animatedActiveTabIndex: animatedActiveTabIndex.value,
      currentlyOpenTabIds: currentlyOpenTabIds.value,
      pendingTabSwitchOffset: pendingTabSwitchOffset.value,
      tabId,
      tabViewGestureState: tabViewGestureState.value,
      tabViewProgress: tabViewProgress.value,
    });

    const tabUrl = animatedTabUrls.value[tabId] || RAINBOW_HOME;
    const isOnHomepage = tabUrl === RAINBOW_HOME;
    const isSwitchingTabs = tabViewGestureState.value !== TabViewGestureStates.INACTIVE;
    const progress =
      !isDarkMode && isOnHomepage
        ? (isSwitchingTabs && isFullSizeTab ? clamp(tabViewGestureProgress.value * 2, 0, 100) : tabViewProgress.value) / 100
        : 1;

    return {
      shadowOpacity: isDarkMode ? 0 : progress * INNER_SHADOW_OPACITY,
    };
  });

  const outerShadowOpacityOverride = useAnimatedStyle(() => {
    const { isFullSizeTab } = getTabInfo({
      animatedActiveTabIndex: animatedActiveTabIndex.value,
      currentlyOpenTabIds: currentlyOpenTabIds.value,
      pendingTabSwitchOffset: pendingTabSwitchOffset.value,
      tabId,
      tabViewGestureState: tabViewGestureState.value,
      tabViewProgress: tabViewProgress.value,
    });

    const tabUrl = animatedTabUrls.value[tabId] || RAINBOW_HOME;
    const isOnHomepage = tabUrl === RAINBOW_HOME;
    const isSwitchingTabs = tabViewGestureState.value !== TabViewGestureStates.INACTIVE;
    const progress =
      !isDarkMode && isOnHomepage
        ? (isSwitchingTabs && isFullSizeTab ? clamp(tabViewGestureProgress.value * 2, 0, 100) : tabViewProgress.value) / 100
        : 1;

    return {
      shadowOpacity: isDarkMode ? 0 : progress * OUTER_SHADOW_OPACITY,
    };
  });

  if (!IS_IOS) return <>{children}</>;

  return (
    <Animated.View style={[styles.boxNone, isDarkMode ? {} : styles.outerWebViewShadow, outerShadowOpacityOverride, zIndexAnimatedStyle]}>
      <Animated.View style={[styles.boxNone, isDarkMode ? {} : styles.innerWebViewShadow, innerShadowOpacityOverride]}>
        {children}
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  boxNone: {
    pointerEvents: 'box-none',
  },
  innerButtonShadow: {
    shadowColor: globalColors.grey100,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  innerWebViewShadow: {
    shadowColor: globalColors.grey100,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: INNER_SHADOW_OPACITY,
    shadowRadius: 3,
  },
  outerButtonShadow: {
    shadowColor: globalColors.grey100,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
  },
  outerWebViewShadow: {
    shadowColor: globalColors.grey100,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: OUTER_SHADOW_OPACITY,
    shadowRadius: 12,
  },
});
