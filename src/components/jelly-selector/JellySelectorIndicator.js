import PropTypes from 'prop-types';
import React from 'react';
import Animated from 'react-native-reanimated';
import ShadowStack from 'react-native-shadow-stack';
import { useTransformOrigin } from '../'
import { colors } from '../../styles';

const AnimatedShadowStack = Animated.createAnimatedComponent(ShadowStack);

const JellySelectorIndicatorShadow = [
  [0, 0, 9, colors.shadowGrey, 0.1],
  [0, 5, 15, colors.shadowGrey, 0.12],
  [0, 10, 30, colors.shadowGrey, 0.06],
];

const JellySelectorIndicator = ({
  backgroundColor,
  height,
  maxWidth,
  translateX,
  width,
}) => {
  const dimensions = {
    height: 18,
    width,
  }
  const hehe = 32;
  return (
    <AnimatedShadowStack
      borderRadius={Animated.divide(width, 2)}
      height={hehe}
      shadows={JellySelectorIndicatorShadow}
      childrenWrapperStyle={{
        backgroundColor,
        overflow: 'hidden',
      }}
      style={{
        backgroundColor,
        left: -4,
        overflow: 'hidden',
        position: 'absolute',
        top: 0,
        transform: [{ translateX }],
        width,
      }}
      zIndex={155}
    />
  );
};

export default JellySelectorIndicator;//React.memo();

