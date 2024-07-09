/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { AnimatedText, Bleed, Box, Inline, globalColors, useColorMode, useForegroundColor } from '@/design-system';
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
  disabled?: boolean;
} & Omit<GestureHandlerButtonProps, 'children'>;

export function AnimatedSwitch({ value, onToggle, activeLabel, inactiveLabel, disabled = false, ...props }: AnimatedSwitchProps) {
  const { isDarkMode } = useColorMode();

  const inactiveBg = useForegroundColor('fillSecondary');
  const activeBg = useForegroundColor('green');
  const border = useForegroundColor('separatorSecondary');

  const containerStyles = useAnimatedStyle(() => {
    return {
      backgroundColor: !value.value
        ? withTiming(opacityWorklet(inactiveBg, 0.12), TIMING_CONFIGS.fadeConfig)
        : withTiming(opacityWorklet(activeBg, 0.72), TIMING_CONFIGS.fadeConfig),
      borderColor: opacityWorklet(border, 0.06),
      opacity: disabled ? 0.4 : 1,
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
    if (disabled) return;

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
      <Bleed horizontal="12px" vertical="8px">
        <GestureHandlerV1Button onPressWorklet={onToggle} {...props}>
          <Box paddingHorizontal="12px" paddingVertical="8px">
            <Inline alignVertical="center" horizontalSpace="8px" wrap={false}>
              <AnimatedText align="right" color={isDarkMode ? 'labelSecondary' : 'label'} size="15pt" weight="bold">
                {labelItem}
              </AnimatedText>
              <Box as={Animated.View} style={[styles.containerStyles, containerStyles]}>
                <Box style={[styles.circleStyles, circleStyles]} as={Animated.View} />
              </Box>
            </Inline>
          </Box>
        </GestureHandlerV1Button>
      </Bleed>
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
