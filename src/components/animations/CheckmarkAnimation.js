import React from 'react';
import RadialGradient from 'react-native-radial-gradient';
import Animated, {
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LargeCheckmarkIcon } from '../icons/svg/LargeCheckmarkIcon';
import { Flex } from '../layout';
import styled from '@rainbow-me/styled-components';

const Container = styled(Flex)({
  alignItems: 'center',
  height: 132,
  justifyContent: 'center',
  width: '100%',
});

const Circle = styled(Animated.createAnimatedComponent(Flex))({
  alignItems: 'center',
  borderRadius: 200,
  height: 120,
  justifyContent: 'center',
  overflow: 'hidden',
  width: 120,
});

export default function CheckmarkAnimation() {
  const circleEntering = () => {
    'worklet';
    const animations = {
      opacity: withTiming(1, { duration: 250 }),
      transform: [
        {
          scale: withSpring(1, {
            damping: 12,
            restDisplacementThreshold: 0.001,
            restSpeedThreshold: 0.001,
            stiffness: 260,
          }),
        },
      ],
    };
    const initialValues = {
      opacity: 0,
      transform: [{ scale: 0.4 }],
    };
    return {
      animations,
      initialValues,
    };
  };

  const checkEntering = () => {
    'worklet';
    const animations = {
      opacity: withDelay(200, withTiming(1, { duration: 200 })),
      transform: [
        {
          rotateZ: withDelay(
            250,
            withSpring(`0deg`, {
              damping: 10,
              restDisplacementThreshold: 0.001,
              restSpeedThreshold: 0.001,
              stiffness: 280,
            })
          ),
        },
        {
          scale: withDelay(
            250,
            withSpring(1, {
              damping: 12,
              restDisplacementThreshold: 0.001,
              restSpeedThreshold: 0.001,
              stiffness: 280,
            })
          ),
        },
      ],
    };
    const initialValues = {
      opacity: 0,
      transform: [{ rotateZ: '22deg' }, { scale: 0.5 }],
    };
    return {
      animations,
      initialValues,
    };
  };

  return (
    <Container>
      <Circle entering={circleEntering}>
        <RadialGradient
          center={[60, 60]}
          colors={
            android
              ? ['#1FC24A10', '#1FC24A10', '#1FC24A00']
              : ['rgba(31,194,74,0.00)', 'rgba(31,194,74,0.06)']
            // https://github.com/surajitsarkar19/react-native-radial-gradient/issues/9
          }
          stops={[1, 0.5]}
          style={{
            borderRadius: 120,
            height: 120,
            position: 'absolute',
            width: 120,
          }}
        />
        <Animated.View entering={checkEntering}>
          <LargeCheckmarkIcon />
        </Animated.View>
      </Circle>
    </Container>
  );
}
