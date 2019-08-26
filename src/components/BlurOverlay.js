import PropTypes from 'prop-types';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { pure } from 'recompact';
import Animated from 'react-native-reanimated';
import { BlurView } from '@react-native-community/blur';

const {
  Value,
  multiply,
  interpolate,
  min,
  add,
} = Animated;

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

const BlurOverlay = ({ blurType, intensity }) => {
  const opacity = interpolate(
    intensity,
    {
      inputRange: [0, 0.1, 1],
      outputRange: [0, 0, 1],
    },
  );

  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        { position: 'absolute', zIndex: 10 },
      ]}
    >
      <AnimatedBlurView
        opacity={opacity}
        blurAmount={15}
        blurType={blurType}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
};

BlurOverlay.propTypes = {
  blurType: PropTypes.oneOf(['default', 'light', 'dark']).isRequired,
  intensity: PropTypes.number,
};

BlurOverlay.defaultProps = {
  blurType: 'dark',
  intensity: new Value(0),
};

export default pure(BlurOverlay);
