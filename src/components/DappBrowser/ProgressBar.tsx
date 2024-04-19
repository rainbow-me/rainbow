import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { SPRING_CONFIGS, TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { Box } from '@/design-system';
import { useAccountAccentColor } from '@/hooks';
import { deviceUtils } from '@/utils';
import { useBrowserContext } from './BrowserContext';
import { TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';

const ProgressBarTopPosition = TAB_BAR_HEIGHT;
export const ProgressBar = ({ tabViewVisible }: { tabViewVisible: SharedValue<boolean> }) => {
  const { accentColor } = useAccountAccentColor();
  const { loadProgress } = useBrowserContext();

  const progressBarStyle = useAnimatedStyle(() => ({
    // eslint-disable-next-line no-nested-ternary
    opacity: tabViewVisible?.value
      ? withSpring(0, SPRING_CONFIGS.snappierSpringConfig)
      : loadProgress?.value === 1
        ? withTiming(0, TIMING_CONFIGS.slowestFadeConfig)
        : withSpring(1, SPRING_CONFIGS.snappierSpringConfig),
    width: (loadProgress?.value || 0) * deviceUtils.dimensions.width,
  }));

  return (
    <Box as={Animated.View} style={[styles.progressBar, styles.centerAlign, { bottom: ProgressBarTopPosition }]}>
      <Box
        as={Animated.View}
        style={[progressBarStyle, { backgroundColor: accentColor }, styles.progressBar, { position: 'relative', top: 0 }]}
      />
    </Box>
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
    left: 0,
    width: deviceUtils.dimensions.width,
    pointerEvents: 'none',
    position: 'absolute',
    zIndex: 10000,
  },
});
