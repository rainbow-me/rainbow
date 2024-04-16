/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';

import { AnimatedText, Box, Inline, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import Animated, { DerivedValue, useAnimatedStyle, useDerivedValue, withSpring, withTiming } from 'react-native-reanimated';
import { fadeConfig, springConfig } from '../constants';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { GestureHandlerButtonProps, GestureHandlerV1Button } from './GestureHandlerV1Button';

type AnimatedSwitchProps = {
  onToggle: () => void;
  value: DerivedValue<boolean>;
  activeLabel?: string;
  inactiveLabel?: string;
} & Omit<GestureHandlerButtonProps, 'children'>;

export function AnimatedSwitch({ value, onToggle, activeLabel, inactiveLabel, ...props }: AnimatedSwitchProps) {
  const { isDarkMode } = useColorMode();

  const inactiveBg = useForegroundColor('fillSecondary');
  const activeBg = useForegroundColor('green');
  const border = useForegroundColor('separatorSecondary');

  const containerStyles = useAnimatedStyle(() => {
    return {
      position: 'relative',
      backgroundColor: !value.value
        ? withTiming(opacityWorklet(inactiveBg, 0.12), fadeConfig)
        : withTiming(opacityWorklet(activeBg, 0.64), fadeConfig),
      borderWidth: 1,
      borderColor: opacityWorklet(border, 0.06),
      borderRadius: 100,
      width: 26,
      height: 16,
    };
  });

  const circleStyles = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: withSpring(value.value ? 11 : 1, springConfig),
        },
      ],
      top: 1,
      backgroundColor: globalColors.white100,
      borderRadius: 100,
      width: 12,
      height: 12,
    };
  });

  const labelItem = useDerivedValue(() => {
    if (!activeLabel && !inactiveLabel) {
      return;
    }

    if (value.value) {
      return activeLabel;
    }

    return inactiveLabel;
  });

  if (labelItem.value) {
    return (
      <Inline alignVertical="center" horizontalSpace="6px">
        <AnimatedText align="right" color={isDarkMode ? 'labelSecondary' : 'label'} size="15pt" weight="heavy" text={labelItem} />
        {/* TODO: Small switch, so let's move this out to be the whole row */}
        <GestureHandlerV1Button onPressWorklet={onToggle} style={containerStyles} {...props}>
          <Box style={circleStyles} as={Animated.View} />
        </GestureHandlerV1Button>
      </Inline>
    );
  }

  return (
    <GestureHandlerV1Button onPressWorklet={onToggle} style={containerStyles} {...props}>
      <Box style={circleStyles} as={Animated.View} />
    </GestureHandlerV1Button>
  );
}
