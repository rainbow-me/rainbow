import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { SPRING_CONFIGS, TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { useAccountAccentColor } from '@/hooks';
import { TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { useBrowserContext } from './BrowserContext';
import { EXTRA_WEBVIEW_HEIGHT } from './Dimensions';

export const ProgressBar = () => {
  const { accentColor } = useAccountAccentColor();
  const { activeTabInfo, extraWebViewHeight, loadProgress, tabViewVisible } = useBrowserContext();

  const progressBarStyle = useAnimatedStyle(() => {
    const isOnHomepage = activeTabInfo.value.isOnHomepage;
    if (isOnHomepage) return { opacity: 0, width: 0 };

    return {
      // eslint-disable-next-line no-nested-ternary
      opacity: tabViewVisible.value
        ? withSpring(0, SPRING_CONFIGS.snappierSpringConfig)
        : loadProgress.value === 0 || loadProgress.value === 1
          ? withTiming(0, TIMING_CONFIGS.slowestFadeConfig)
          : withSpring(1, SPRING_CONFIGS.snappierSpringConfig),
      transform: [{ translateY: (extraWebViewHeight.value / EXTRA_WEBVIEW_HEIGHT) * -20 }],
      width: loadProgress.value * DEVICE_WIDTH - extraWebViewHeight.value / 2,
    };
  });

  return (
    <View style={[styles.progressBarContainer, styles.centerAlign]}>
      <Animated.View style={[progressBarStyle, { backgroundColor: accentColor }, styles.progressBar]} />
    </View>
  );
};

const styles = StyleSheet.create({
  centerAlign: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    borderRadius: 1,
    height: 2,
    pointerEvents: 'none',
  },
  progressBarContainer: {
    height: 2,
    bottom: TAB_BAR_HEIGHT,
    left: 0,
    width: DEVICE_WIDTH,
    pointerEvents: 'none',
    position: 'absolute',
    zIndex: 10000,
  },
});
