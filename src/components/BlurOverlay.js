import PropTypes from 'prop-types';
import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import { VibrancyView } from 'react-native-blur';
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
}) => (
  <Animated.View style={[styles.overlay, { backgroundColor, opacity }]}>
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
};

BlurOverlay.defaultProps = {
  blurAmount: 5,
  blurType: 'dark',
};

export default pure(BlurOverlay);
