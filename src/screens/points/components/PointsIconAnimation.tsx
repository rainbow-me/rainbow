import React, { useEffect } from 'react';
import { Box } from '@/design-system';
import { useAccountAccentColor } from '@/hooks';
import { TabBarIcon } from '@/components/icons/TabBarIcon';
import { useTheme } from '@/theme';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { IS_TEST } from '@/env';

const fallConfig = {
  duration: 2000,
  easing: Easing.bezier(0.2, 0, 0, 1),
};
const jumpConfig = {
  duration: 500,
  easing: Easing.bezier(0.2, 0, 0, 1),
};
const flyUpConfig = {
  duration: 2500,
  easing: Easing.bezier(0.05, 0.7, 0.1, 1.0),
};

export const PointsIconAnimation = () => {
  const { accentColor } = useAccountAccentColor();
  const { colors, isDarkMode } = useTheme();

  const iconState = useSharedValue(1);
  const progress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 1, 2, 3, 4, 5, 6, 7, 8], [0.75, 0.7, 0.65, 0.55, 0.75, 0.7, 0.65, 0.55, 0.75]);
    const rotate = interpolate(progress.value, [0, 1, 2, 3, 4, 5, 6, 7, 8], [-12, -4, -12, -12, -372, -380, -372, -372, -12]);
    const translateX = interpolate(progress.value, [0, 1, 2, 3, 4, 5, 6, 7, 8], [0, 4, 0, 0, 0, -4, 0, 0, 0]);
    const translateY = interpolate(progress.value, [0, 1, 2, 3, 4, 5, 6, 7, 8], [-20, -5, 10, 14, -20, -5, 10, 14, -20]);

    return {
      transform: [{ translateX }, { translateY }, { rotate: `${rotate}deg` }, { scale }],
    };
  });

  useEffect(() => {
    if (IS_TEST) return;

    progress.value = 0;
    progress.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(1, fallConfig),
          withTiming(2, fallConfig),
          withTiming(3, jumpConfig),
          withTiming(4, flyUpConfig),
          withTiming(5, fallConfig),
          withTiming(6, fallConfig),
          withTiming(7, jumpConfig),
          withTiming(8, flyUpConfig)
        ),
        -1,
        false
      )
    );
  }, [progress]);

  return (
    <Box alignItems="center" as={Animated.View} justifyContent="center" style={[{ height: 28, width: 28 }, animatedStyle]}>
      <TabBarIcon
        accentColor={accentColor}
        hideShadow
        icon="tabPoints"
        index={1}
        reanimatedPosition={iconState}
        size={56}
        tintBackdrop={colors.white}
        tintOpacity={isDarkMode ? 0.25 : 0.1}
      />
    </Box>
  );
};
