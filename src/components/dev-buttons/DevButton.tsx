import React from 'react';
import { useWindowDimensions } from 'react-native';

import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withSpring,
} from 'react-native-reanimated';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import RNRestart from 'react-native-restart';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';

const Button = styled(ButtonPressAnimation)`
  border-radius: 35;
  width: 70;
  height: 70;
  justify-content: center;
  align-items: center;
  background-color: ${({ color }) => color};
  shadow-opacity: 0.2;
  shadow-radius: 6;
`;

const Wrapper = styled(Animated.View)`
  elevation: 5;
  border-radius: 35;
  width: 70;
  height: 70;
  position: absolute;
`;

export default function DevButton({
  // @ts-expect-error ts-migrate(7031) FIXME: Binding element 'givenColor' implicitly has an 'an... Remove this comment to see the full error message
  color: givenColor,
  onPress = () => RNRestart.Restart(),
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  children = <Icon color="white" name="warning" size="lmedium" />,
  initialDisplacement = 100,
}) {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  const color = givenColor || colors.purpleDark;
  const { width } = useWindowDimensions();
  const x = useSharedValue(2);
  const y = useSharedValue(initialDisplacement);
  const gestureHandler = useAnimatedGestureHandler({
    onActive: (event, ctx) => {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'startX' does not exist on type '{}'.
      x.value = ctx.startX + event.translationX;
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'startY' does not exist on type '{}'.
      y.value = ctx.startY + event.translationY;
    },
    onEnd: event => {
      x.value = withSpring(
        x.value + event.velocityX > (width - 35) / 2 ? width - 74 : 2,
        { velocity: event.velocityX }
      );
      y.value = withDecay({ deceleration: 0.99, velocity: event.velocityY });
    },
    onStart: (event, ctx) => {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'startX' does not exist on type '{}'.
      ctx.startX = x.value;
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'startY' does not exist on type '{}'.
      ctx.startY = y.value;
    },
  });

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
  }));

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <PanGestureHandler
      onGestureEvent={gestureHandler}
      onHandlerStateChange={gestureHandler}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Wrapper style={style}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Button color={color} onPress={onPress}>
          {children}
        </Button>
      </Wrapper>
    </PanGestureHandler>
  );
}
