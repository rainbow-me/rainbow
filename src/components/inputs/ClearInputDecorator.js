import React, { useLayoutEffect, useState } from 'react';
import Animated, { Easing, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { magicMemo } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { Centered } from '../layout';
import { Text } from '../text';
import styled from '@/styled-thing';
import { position } from '@/styles';

const START_SCALE = 0.5;
const FINISH_SCALE = 1;

const Button = styled(Centered).attrs({
  scaleTo: 0.8,
})(({ size }) => position.sizeAsObject(size));

const Container = styled.View({
  bottom: 0,
  flex: 0,
  position: 'absolute',
  right: 0,
  top: 0,
});

const TextIcon = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.4),
  letterSpacing: 'zero',
  size: 'large',
  weight: 'bold',
}))({
  marginBottom: 0.5,
});

const easingOut = Easing.out(Easing.ease);
const easingIn = Easing.in(Easing.ease);
const duration = 69;

const ClearInputDecorator = ({ inputHeight, isVisible, onPress, testID }) => {
  const [isVisibleInternal, setIsVisibleInternal] = useState(isVisible);
  const animation = useSharedValue(isVisible ? 1 : 0);

  useLayoutEffect(() => {
    if (isVisible) {
      setIsVisibleInternal(true);
    } else if (!isVisible) {
      animation.value = withTiming(0, { duration, easing: easingOut }, finished => {
        if (finished) {
          runOnJS(setIsVisibleInternal)(false);
        }
      });
    }
  }, [isVisible, animation]);

  useLayoutEffect(() => {
    if (isVisibleInternal && isVisible) {
      animation.value = withTiming(1, { duration, easing: easingIn });
    }
  }, [isVisible, isVisibleInternal, animation]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(animation.value, [0, 1], [START_SCALE, FINISH_SCALE], 'extend');
    return {
      opacity: animation.value,
      transform: [{ scale }],
    };
  });

  return (
    <Container>
      {isVisibleInternal && (
        <Animated.View style={animatedStyle}>
          <Button as={ButtonPressAnimation} onPress={onPress} size={inputHeight} testID={testID}>
            <TextIcon>􀁡</TextIcon>
          </Button>
        </Animated.View>
      )}
    </Container>
  );
};

export default magicMemo(ClearInputDecorator, 'isVisible');
