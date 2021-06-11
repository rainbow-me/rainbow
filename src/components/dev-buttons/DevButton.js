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
  color: givenColor,
  onPress = () => RNRestart.Restart(),
  children = <Icon color="white" name="warning" size="lmedium" />,
  initialDisplacement = 100,
}) {
  const { colors } = useTheme();
  const color = givenColor || colors.purpleDark;
  const { width } = useWindowDimensions();
  const x = useSharedValue(2);
  const y = useSharedValue(initialDisplacement);
  const gestureHandler = useAnimatedGestureHandler({
    onActive: (event, ctx) => {
      x.value = ctx.startX + event.translationX;
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
      ctx.startX = x.value;
      ctx.startY = y.value;
    },
  });

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
  }));

  return (
    <PanGestureHandler
      onGestureEvent={gestureHandler}
      onHandlerStateChange={gestureHandler}
    >
      <Wrapper style={style}>
        <Button color={color} onPress={onPress}>
          {children}
        </Button>
      </Wrapper>
    </PanGestureHandler>
  );
}
