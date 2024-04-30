/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';

import { AnimatedText, Box, Inline, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import Animated, { runOnJS, runOnUI, useAnimatedStyle, useDerivedValue, withSpring, withTiming } from 'react-native-reanimated';
import { fadeConfig, springConfig } from '../constants';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { GestureHandlerButtonProps, GestureHandlerV1Button } from './GestureHandlerV1Button';
import { StyleSheet } from 'react-native';

type AnimatedSwitchProps = {
  onToggle: () => void;
  value: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
} & Omit<GestureHandlerButtonProps, 'children'>;

export function AnimatedSwitch({ onToggle, value, activeLabel, inactiveLabel, ...props }: AnimatedSwitchProps) {
  const { isDarkMode } = useColorMode();

  const inactiveBg = useForegroundColor('fillSecondary');
  const activeBg = useForegroundColor('green');
  const border = useForegroundColor('separatorSecondary');

  const containerStyles = useAnimatedStyle(() => {
    return {
      backgroundColor: !value
        ? withTiming(opacityWorklet(inactiveBg, 0.12), fadeConfig)
        : withTiming(opacityWorklet(activeBg, 0.64), fadeConfig),
      borderColor: opacityWorklet(border, 0.06),
    };
  });

  const circleStyles = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: withSpring(value ? 11 : 1, springConfig),
        },
      ],
    };
  });

  const labelItem = useDerivedValue(() => {
    if (!activeLabel && !inactiveLabel) {
      return;
    }

    if (value) {
      return activeLabel;
    }

    return inactiveLabel;
  });

  if (labelItem.value) {
    return (
      <GestureHandlerV1Button onPressJS={onToggle} {...props}>
        <Inline alignVertical="center" horizontalSpace="6px">
          <AnimatedText align="right" color={isDarkMode ? 'labelSecondary' : 'label'} size="15pt" weight="heavy" text={labelItem} />
          <Box as={Animated.View} style={[styles.containerStyles, containerStyles]}>
            <Box as={Animated.View} style={[styles.circleStyles, circleStyles]} />
          </Box>
        </Inline>
      </GestureHandlerV1Button>
    );
  }

  return (
    <GestureHandlerV1Button onPressJS={onToggle} style={[styles.containerStyles, containerStyles]} {...props}>
      <Box as={Animated.View} style={[styles.circleStyles, circleStyles]} />
    </GestureHandlerV1Button>
  );
}

const styles = StyleSheet.create({
  containerStyles: {
    position: 'relative',
    borderWidth: 1,
    borderRadius: 100,
    width: 26,
    height: 16,
  },
  circleStyles: {
    top: 1,
    backgroundColor: globalColors.white100,
    borderRadius: 100,
    width: 12,
    height: 12,
  },
});
