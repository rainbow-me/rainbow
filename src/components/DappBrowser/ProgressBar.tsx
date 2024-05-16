import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedReaction, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { SPRING_CONFIGS, TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { useAccountAccentColor } from '@/hooks';
import { deviceUtils } from '@/utils';
import { useBrowserContext } from './BrowserContext';
import { TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';

export const ProgressBar = () => {
  const { accentColor } = useAccountAccentColor();
  const { animatedActiveTabIndex, loadProgress, tabViewVisible } = useBrowserContext();

  const progressBarStyle = useAnimatedStyle(() => ({
    // eslint-disable-next-line no-nested-ternary
    opacity: tabViewVisible.value
      ? withSpring(0, SPRING_CONFIGS.snappierSpringConfig)
      : loadProgress.value === 1
        ? withTiming(0, TIMING_CONFIGS.slowestFadeConfig)
        : withSpring(1, SPRING_CONFIGS.snappierSpringConfig),
    width: loadProgress.value * deviceUtils.dimensions.width,
  }));

  useAnimatedReaction(
    () => animatedActiveTabIndex.value,
    (current, previous) => {
      if (current !== previous) {
        loadProgress.value = 1;
      }
    }
  );

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
    width: deviceUtils.dimensions.width,
    pointerEvents: 'none',
  },
  progressBarContainer: {
    height: 2,
    bottom: TAB_BAR_HEIGHT,
    left: 0,
    width: deviceUtils.dimensions.width,
    pointerEvents: 'none',
    position: 'absolute',
    zIndex: 10000,
  },
});
