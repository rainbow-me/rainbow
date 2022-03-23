import React from 'react';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
  Easing,
  withSequence,
} from 'react-native-reanimated';
import RadialGradient from 'react-native-radial-gradient';
import styled from '@rainbow-me/styled-components';
import { Path, Svg } from 'react-native-svg';
import { View } from 'react-native';
import { Flex } from '../layout';

const Container = styled(Flex)({
  width: '100%',
  justifyContent: 'center',
});

const Circle = styled(Flex)({
  width: 120,
  height: 120,
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 120,
  overflow: 'hidden',
});

const AnimatedView = Animated.createAnimatedComponent(View);

const scaleConfig = {
  duration: 300,
  easing: Easing.elastic(2),
};

const opacityConfig = {
  duration: 200,
  easing: Easing.ease,
};

export default function CheckmarkAnimation() {
  const checkOpacity = useDerivedValue(() => {
    return withSequence(
      withTiming(0, opacityConfig),
      withTiming(1, opacityConfig)
    );
  });

  const checkScaling = useDerivedValue(() => {
    return withSequence(
      withTiming(0.5, scaleConfig),
      withTiming(1, scaleConfig)
    );
  });

  const checkRotation = useDerivedValue(() => {
    return withSequence(
      withTiming(-12, scaleConfig),
      withTiming(0, scaleConfig)
    );
  });

  const animatedCheckStyles = useAnimatedStyle(() => {
    return {
      opacity: checkOpacity.value,
      transform: [
        {
          scale: checkScaling.value,
        },
        { rotateZ: `${checkRotation.value}deg` },
      ],
    };
  });

  return (
    <Container>
      <Circle>
        <RadialGradient
          style={{
            width: 120,
            height: 120,
            borderRadius: 120,
            position: 'absolute',
          }}
          colors={['rgba(31,194,74,0.00)', 'rgba(31,194,74,0.06)']}
          stops={[1, 0.5]}
          center={[60, 60]}
        />
        <AnimatedView style={animatedCheckStyles}>
          <Svg width="120" height="120" viewBox="0 0 120 120">
            <Path
              d="M55.0928,82.834 C57.0947,82.834 58.6328,82.1016 59.6826,80.5391 L82.2412,46.5547 C82.998,45.4316 83.3154,44.333 83.3154,43.3076 C83.3154,40.5488 81.1426,38.4736 78.2861,38.4736 C76.3574,38.4736 75.1123,39.1816 73.916,41.0371 L54.9951,70.7246 L45.498,59.3721 C44.4727,58.1514 43.2764,57.5898 41.6406,57.5898 C38.7598,57.5898 36.6602,59.665 36.6602,62.4727 C36.6602,63.7422 37.0264,64.792 38.1006,66.0127 L50.6738,80.832 C51.8701,82.2236 53.2861,82.834 55.0928,82.834 Z"
              fill="#1FC24A"
            ></Path>
          </Svg>
        </AnimatedView>
      </Circle>
    </Container>
  );
}
