import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { Box, Cover, globalColors } from '@/design-system';
import { IS_ANDROID } from '@/env';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/screens/Swap/utils';
import { useBrowserContext } from './BrowserContext';

export const WebViewBorder = ({ enabled, isActiveTab }: { enabled?: boolean; isActiveTab: boolean }) => {
  const { tabViewProgress } = useBrowserContext();

  const webViewBorderStyle = useAnimatedStyle(() => {
    const progress = tabViewProgress?.value ?? 0;

    // eslint-disable-next-line no-nested-ternary
    const borderRadius = interpolate(progress, [0, 1], [isActiveTab ? (IS_ANDROID ? 0 : 16) : 30, 30]);
    const opacity = interpolate(progress, [0, 1], [1, 0]);

    return {
      borderRadius,
      opacity,
    };
  });

  return enabled ? (
    <Cover pointerEvents="box-none">
      <Box as={Animated.View} height="full" style={[styles.webViewBorderStyle, webViewBorderStyle]} width="full" />
    </Cover>
  ) : null;
};

const styles = StyleSheet.create({
  webViewBorderStyle: {
    borderColor: opacity(globalColors.white100, 0.08),
    borderWidth: THICK_BORDER_WIDTH,
    pointerEvents: 'none',
  },
});
