import React from 'react';
import RadialGradient from 'react-native-radial-gradient';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LargeCheckmarkIcon } from '../icons/svg/LargeCheckmarkIcon';
import { Box } from '@/design-system';
import { colors } from '@/styles';

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

  const pulsingCheckmarkAnimation = useDerivedValue(() =>
    withDelay(2000, withRepeat(withSequence(withDelay(2000, withTiming(1)), withTiming(1.1), withTiming(1)), -1))
  );
  const pulsingCircleAnimation = useDerivedValue(() =>
    withDelay(1800, withRepeat(withSequence(withDelay(2000, withTiming(1)), withTiming(1.05), withTiming(1)), -1))
  );
  const rippleCircleAnimation = useDerivedValue(() =>
    withDelay(1800, withRepeat(withSequence(withDelay(2000, withTiming(0)), withTiming(1), withTiming(0)), -1))
  );
  const rippleCircleScaleAnimation = useDerivedValue(() =>
    withDelay(1800, withRepeat(withSequence(withDelay(2000, withTiming(0.6)), withTiming(1), withTiming(0.6)), -1))
  );
  const pulseCheckmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulsingCheckmarkAnimation.value }],
  }));
  const pulseCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulsingCircleAnimation.value }],
  }));
  const rippleCircleStyle = useAnimatedStyle(() => ({
    opacity: rippleCircleAnimation.value,
    transform: [{ scale: rippleCircleScaleAnimation.value }],
  }));

  return (
    <Box alignItems="center" height={{ custom: 132 }} justifyContent="center" width="full">
      <Box
        alignItems="center"
        as={Animated.View}
        borderRadius={200}
        entering={circleEntering}
        height={{ custom: 120 }}
        justifyContent="center"
        style={{ overflow: 'hidden' }}
        width={{ custom: 120 }}
      >
        <Box
          alignItems="center"
          as={Animated.View}
          borderRadius={200}
          height={{ custom: 120 }}
          justifyContent="center"
          style={[{ overflow: 'hidden', position: 'absolute' }, rippleCircleStyle]}
          width={{ custom: 120 }}
        >
          <RadialGradient
            center={[60, 60]}
            colors={
              android ? colors.gradients.checkmarkAnimation : ['rgba(31,194,74,0.00)', 'rgba(31,194,74,0.03)']
              // https://github.com/surajitsarkar19/react-native-radial-gradient/issues/9
            }
            stops={[1, 0.5]}
            style={{
              height: 120,
              position: 'absolute',
              width: 120,
            }}
          />
        </Box>

        <Box
          alignItems="center"
          as={Animated.View}
          borderRadius={100}
          entering={circleEntering}
          height={{ custom: 100 }}
          justifyContent="center"
          style={[{ overflow: 'hidden', position: 'absolute' }, pulseCircleStyle]}
          width={{ custom: 100 }}
        >
          <RadialGradient
            center={[60, 60]}
            colors={
              android ? colors.gradients.checkmarkAnimation : ['rgba(31,194,74,0.00)', 'rgba(31,194,74,0.06)']
              // https://github.com/surajitsarkar19/react-native-radial-gradient/issues/9
            }
            stops={[1, 0.5]}
            style={{
              height: 100,
              position: 'absolute',
              width: 100,
            }}
          />
        </Box>

        <Animated.View entering={checkEntering}>
          <Animated.View style={[pulseCheckmarkStyle]}>
            <LargeCheckmarkIcon />
          </Animated.View>
        </Animated.View>
      </Box>
    </Box>
  );
}
