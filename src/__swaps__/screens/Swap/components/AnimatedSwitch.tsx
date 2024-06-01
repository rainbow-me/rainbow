/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { AnimatedText, Box, Inline, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import Animated, { SharedValue, useAnimatedStyle, useDerivedValue, withSpring, withTiming } from 'react-native-reanimated';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { GestureHandlerButtonProps, GestureHandlerV1Button } from './GestureHandlerV1Button';
import { StyleSheet } from 'react-native';
import { SPRING_CONFIGS, TIMING_CONFIGS } from '@/components/animations/animationConfigs';

type AnimatedSwitchProps = {
  onToggle: () => void;
  value: SharedValue<boolean>;
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
      backgroundColor: !value.value
        ? withTiming(opacityWorklet(inactiveBg, 0.12), TIMING_CONFIGS.fadeConfig)
        : withTiming(opacityWorklet(activeBg, 0.64), TIMING_CONFIGS.fadeConfig),
      borderColor: opacityWorklet(border, 0.06),
    };
  });

  const circleStyles = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: withSpring(value.value ? 11 : 1, SPRING_CONFIGS.springConfig),
        },
      ],
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
      <GestureHandlerV1Button onPressWorklet={onToggle} {...props}>
        <Inline alignVertical="center" horizontalSpace="6px">
          <AnimatedText align="right" color={isDarkMode ? 'labelSecondary' : 'label'} size="15pt" weight="heavy">
            {labelItem}
          </AnimatedText>
          <Box as={Animated.View} style={[styles.containerStyles, containerStyles]}>
            <Box style={[styles.circleStyles, circleStyles]} as={Animated.View} />
          </Box>
        </Inline>
      </GestureHandlerV1Button>
    );
  }

  return (
    <GestureHandlerV1Button onPressWorklet={onToggle} style={[styles.containerStyles, containerStyles]} {...props}>
      <Box style={[styles.circleStyles, circleStyles]} as={Animated.View} />
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
