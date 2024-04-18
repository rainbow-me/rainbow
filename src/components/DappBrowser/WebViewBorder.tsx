import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { SharedValue, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { Box, Cover, globalColors } from '@/design-system';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/utils/swaps';
import { WEBVIEW_HEIGHT } from './Dimensions';

export const WebViewBorder = ({
  animatedTabIndex,
  enabled,
  animatedActiveTabIndex,
  tabViewProgress,
  tabViewVisible,
}: {
  animatedTabIndex: SharedValue<number>;
  enabled?: boolean;
  animatedActiveTabIndex: SharedValue<number> | undefined;
  tabViewProgress: SharedValue<number> | undefined;
  tabViewVisible: SharedValue<boolean> | undefined;
}) => {
  const webViewBorderStyle = useAnimatedStyle(() => {
    if (!enabled) {
      return {
        pointerEvents: tabViewVisible?.value ? 'auto' : 'none',
      };
    }

    const progress = tabViewProgress?.value || 0;
    const animatedIsActiveTab = animatedActiveTabIndex?.value === animatedTabIndex.value;

    const borderRadius = interpolate(progress, [0, 100], [animatedIsActiveTab ? 16 : 30, 30], 'clamp');
    const opacity = 1 - progress / 100;

    return {
      borderRadius,
      opacity,
      pointerEvents: tabViewVisible?.value ? 'auto' : 'none',
    };
  });

  return (
    <Cover pointerEvents="box-none" style={styles.zIndexStyle}>
      <Box
        as={Animated.View}
        height={{ custom: WEBVIEW_HEIGHT }}
        style={[enabled ? styles.webViewBorderStyle : {}, webViewBorderStyle]}
        width="full"
      />
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
    overflow: 'hidden',
  },
  zIndexStyle: {
    zIndex: 30000,
  },
});
