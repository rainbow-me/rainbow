import { memo } from 'react';
import { Platform } from 'react-native';

import chroma from 'chroma-js';
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { Cover, useColorMode } from '@/design-system';

type HoldToActivateProgressProps = {
  holdProgress: SharedValue<number>;
  color: string;
};

export const HoldToActivateProgress = memo(function HoldToActivateProgress({ holdProgress, color }: HoldToActivateProgressProps) {
  const { isDarkMode } = useColorMode();

  const brightenedColor = chroma(color)
    .saturate(isDarkMode ? 0.15 : 0.1)
    .brighten(isDarkMode ? 0.5 : 0.3)
    .css();

  const holdProgressStyle = useAnimatedStyle(() => ({
    opacity: interpolate(holdProgress.value, [0, 4, 20, 96, 100], [0, 0, 1, 1, 0], 'clamp'),
    width: `${holdProgress.value ?? 0}%`,
  }));

  return (
    <Cover style={{ borderRadius: 100, overflow: 'hidden' }}>
      <Animated.View
        style={[
          holdProgressStyle,
          {
            backgroundColor: brightenedColor,
            height: '100%',
            ...(Platform.OS === 'ios'
              ? {
                  shadowColor: brightenedColor,
                  shadowOffset: { width: 12, height: 0 },
                  shadowOpacity: 1,
                  shadowRadius: 6,
                }
              : {}),
          },
        ]}
      />
    </Cover>
  );
});
