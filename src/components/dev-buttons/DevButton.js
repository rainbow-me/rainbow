import React from 'react';
import { useWindowDimensions } from 'react-native';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withDecay, withSpring } from 'react-native-reanimated';
import RNRestart from 'react-native-restart';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import styled from '@/styled-thing';

const Button = styled(ButtonPressAnimation)(({ size, color }) => ({
  alignItems: 'center',
  backgroundColor: color,
  borderRadius: size,
  height: size,
  justifyContent: 'center',
  shadowOpacity: 0.2,
  shadowRadius: 6,
  width: size,
}));

const Wrapper = styled(Animated.View)(({ size }) => ({
  borderRadius: size / 2,
  elevation: 5,
  height: size,
  position: 'absolute',
  width: size,
}));

export default function DevButton({
  color: givenColor,
  onPress = () => RNRestart.Restart(),
  children = <Icon color="white" name="warning" size="lmedium" />,
  initialDisplacement = 100,
  testID = '',
  size = 20,
}) {
  const { colors } = useTheme();
  const color = givenColor || colors.purpleDark;
  const { width } = useWindowDimensions();
  const x = useSharedValue(2);
  const y = useSharedValue(initialDisplacement);
  const panGesture = Gesture.Pan()
    .onUpdate(event => {
      x.value = event.translationX;
      y.value = event.translationY;
    })
    .onEnd(event => {
      x.value = withSpring(x.value + event.velocityX > (width - size / 2) / 2 ? width - size / 2 : 2, { velocity: event.velocityX });
      y.value = withDecay({ deceleration: 0.99, velocity: event.velocityY });
    });

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Wrapper style={style} size={size}>
        <Button color={color} onPress={onPress} testID={testID} size={size}>
          {children}
        </Button>
      </Wrapper>
    </GestureDetector>
  );
}
