import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Box, Text, useForegroundColor } from '@/design-system';
import position from '@/styles/position';
import { BlurView } from '@react-native-community/blur';
import React, { useCallback, RefObject } from 'react';
import { TextInput } from 'react-native';
import Animated, { SharedValue, interpolateColor, useAnimatedStyle } from 'react-native-reanimated';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

const AnimatedBox = Animated.createAnimatedComponent(Box);

export const TabButton = ({
  toggleTabView,
  isFocused,
  inputRef,
  animationProgress,
}: {
  toggleTabView: () => void;
  isFocused: boolean;
  inputRef: RefObject<TextInput>;
  animationProgress: SharedValue<number>;
}) => {
  const fill = useForegroundColor('fill');
  const fillSecondary = useForegroundColor('fillSecondary');

  const tabButtonUnderlay = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(animationProgress.value ?? 0, [0, 1], [fill, 'transparent']);

    return {
      backgroundColor,
    };
  });
  const onPress = useCallback(() => {
    if (!isFocused) {
      // open tabs
      toggleTabView();
    } else {
      // close keyboard
      inputRef?.current?.blur();
    }
  }, [isFocused, inputRef, toggleTabView]);

  return (
    <Box
      as={ButtonPressAnimation}
      onPress={onPress}
      style={{ height: 44, width: 44, borderRadius: 22, borderWidth: 1, borderColor: fillSecondary }}
      alignItems="center"
      justifyContent="center"
    >
      <Text size="20pt" color="labelSecondary" align="center">
        {isFocused ? '􀆈' : '􀐅'}
      </Text>
      <Box
        as={AnimatedBlurView}
        blurAmount={70}
        blurType="dark"
        style={[{ zIndex: -1, elevation: -1, borderRadius: 22 }, position.coverAsObject]}
      />
      <Box as={AnimatedBox} style={[{ borderRadius: 22, zIndex: -1 }, position.coverAsObject, tabButtonUnderlay]} />
    </Box>
  );
};
