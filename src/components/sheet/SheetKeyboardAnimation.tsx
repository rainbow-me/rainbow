import React, { useMemo } from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers' or its co... Remove this comment to see the full error message
import { isReanimatedAvailable } from '@rainbow-me/helpers';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useKeyboardHeight } from '@rainbow-me/hooks';

// we create this empty styled Animated.View so that parent components can pass
// through the "as" prop
const Container = styled(Animated.View)``;

export default function SheetKeyboardAnimation({
  isKeyboardVisible,
  translateY,
  ...props
}: any) {
  const keyboardHeight = useKeyboardHeight();

  const animatedStyles = useAnimatedStyle(
    () => ({ transform: [{ translateY: translateY.value }] }),
    [translateY]
  );

  const fallbackStyles = useMemo(
    () => ({
      marginBottom: isKeyboardVisible ? keyboardHeight : 0,
    }),
    [isKeyboardVisible, keyboardHeight]
  );

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container
      {...props}
      style={isReanimatedAvailable ? animatedStyles : fallbackStyles}
    />
  );
}
