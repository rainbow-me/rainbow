import PropTypes from 'prop-types';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { BlurView } from '@react-native-community/blur';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

const interpolationConfig = {
  inputRange: [0, 0.1, 1],
  outputRange: [0, 0, 1],
};

const BlurOverlay = ({ blurType, intensity }) => (
  <View
    pointerEvents="none"
    style={[
      StyleSheet.absoluteFill,
      { position: 'absolute', zIndex: 10 },
    ]}
  >
    <AnimatedBlurView
      blurAmount={15}
      blurType={blurType}
      opacity={Animated.interpolate(intensity, interpolationConfig)}
      style={StyleSheet.absoluteFill}
    />
  </View>
);

BlurOverlay.propTypes = {
  blurType: PropTypes.oneOf(['default', 'light', 'dark']).isRequired,
  intensity: PropTypes.number,
};

BlurOverlay.defaultProps = {
  blurType: 'dark',
  intensity: new Animated.Value(0),
};

export default React.memo(BlurOverlay);
