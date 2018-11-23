import PropTypes from 'prop-types';
import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import { BlurView } from 'react-native-blur';
import { position } from '../styles';

const styles = StyleSheet.create({
  overlay: {
    ...position.coverAsObject,
    zIndex: 1,
  },
});

const BlurOverlay = ({ blurAmount, opacity }) => (
  <Animated.View style={[styles.overlay, { opacity }]}>
    <BlurView
      blurAmount={blurAmount}
      blurType="dark"
      style={styles.overlay}
    />
  </Animated.View>
);

BlurOverlay.propTypes = {
  blurAmount: PropTypes.number,
  opacity: PropTypes.object,
};

BlurOverlay.defaultProps = {
  blurAmount: 5,
};

export default BlurOverlay;
