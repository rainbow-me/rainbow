import { VibrancyView } from '@react-native-community/blur';
import PropTypes from 'prop-types';
import React from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { pure } from 'recompact';
import { position } from '../styles';

const styles = StyleSheet.create({
  overlay: {
    ...position.coverAsObject,
    zIndex: 1,
  },
});

const BlurOverlay = ({
  backgroundColor,
  blurAmount,
  blurType,
  opacity,
  translateX,
}) => (
  <Animated.View style={[styles.overlay, { backgroundColor, opacity, transform: [{ translateX }] }]}>
    <VibrancyView
      blurAmount={blurAmount}
      blurType={blurType}
      style={styles.overlay}
    />
  </Animated.View>
);

BlurOverlay.propTypes = {
  backgroundColor: PropTypes.string,
  blurAmount: PropTypes.number,
  blurType: PropTypes.oneOf(['dark', 'light', 'xlight']).isRequired,
  opacity: PropTypes.object,
  translateX: PropTypes.any,
};

BlurOverlay.defaultProps = {
  blurAmount: 5,
  blurType: 'dark',
  translateX: 0,
};

export default pure(BlurOverlay);
