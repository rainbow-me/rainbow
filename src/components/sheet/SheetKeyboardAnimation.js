import React, { useMemo } from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { isReanimatedAvailable } from '@/helpers';
import { useKeyboardHeight } from '@/hooks';
import styled from '@/styled-thing';

// we create this empty styled Animated.View so that parent components can pass
// through the "as" prop
const Container = styled(Animated.View)({});

export default function SheetKeyboardAnimation({ isKeyboardVisible, translateY, ...props }) {
  const keyboardHeight = useKeyboardHeight();

  const animatedStyles = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }), [translateY]);

  const fallbackStyles = useMemo(
    () => ({
      marginBottom: isKeyboardVisible ? keyboardHeight : 0,
    }),
    [isKeyboardVisible, keyboardHeight]
  );

  return <Container {...props} style={isReanimatedAvailable ? animatedStyles : fallbackStyles} />;
}
