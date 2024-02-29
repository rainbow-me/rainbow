import React from 'react';
import Animated, {
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  SharedValue,
} from 'react-native-reanimated';
import { RainbowAnimationDetails } from './types';
import styled from '@/styled-thing';
import { ImgixImage } from '../images';

const INITIAL_SIZE = 375;
const BASE_DELAY = 69;

const RainbowImage = styled(ImgixImage)({
  height: INITIAL_SIZE,
  position: 'absolute',
  width: INITIAL_SIZE,
});

interface Props {
  details: RainbowAnimationDetails;
  shouldAnimate: SharedValue<boolean>;
}

const SingleRainbow = ({ details, shouldAnimate }: Props) => {
  const { delay, source, x, y, rotate: finalRotate, scale: finalScale } = details;

  const animationProgress = useSharedValue(0);

  useAnimatedReaction(
    () => shouldAnimate.value,
    (result, previous) => {
      if (result && previous !== result) {
        animationProgress.value = withDelay(
          delay + BASE_DELAY,
          withSpring(1, {
            damping: 7,
            restDisplacementThreshold: 0.0001,
            restSpeedThreshold: 0.001,
            stiffness: 150,
          })
        );
      }
    },
    [shouldAnimate]
  );

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(animationProgress.value, [0, 1], [0, x]);
    const translateY = interpolate(animationProgress.value, [0, 1], [0, y]);
    const rotate = interpolate(animationProgress.value, [0, 1], [0, finalRotate]);
    const scale = interpolate(animationProgress.value, [0, 1], [0, finalScale]);
    return {
      opacity: animationProgress.value,
      transform: [
        {
          translateX,
        },
        {
          translateY,
        },
        {
          rotate: `${rotate}deg`,
        },
        {
          scale,
        },
      ],
    };
  });

  return <RainbowImage Component={Animated.Image} source={source} style={animatedStyle} />;
};

export default SingleRainbow;
