import React from 'react';
import RadialGradient from 'react-native-radial-gradient';
import Animated, {
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LargeCheckmarkIcon } from '../icons/svg/LargeCheckmarkIcon';
import { Box } from '@rainbow-me/design-system';

export function CheckmarkAnimation() {
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
    <Box
      alignItems="center"
      height={{ custom: 132 }}
      justifyContent="center"
      width="full"
    >
      <Box
        alignItems="center"
        as={Animated.View}
        borderRadius={200}
        entering={circleEntering}
        height={{ custom: 120 }}
        justifyContent="center"
        style={{
          overflow: 'hidden',
        }}
        width={{ custom: 120 }}
      >
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
      </Box>
    </Box>
  );
}
