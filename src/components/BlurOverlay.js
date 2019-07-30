import { VibrancyView } from '@react-native-community/blur';
import PropTypes from 'prop-types';
import React from 'react';
import { Animated, StyleSheet } from 'react-native';
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
  translateY,
}) => (
  <Animated.View
    style={[
      styles.overlay,
      {
        backgroundColor,
        opacity,
        transform: [{ translateX }, { translateY }],
      },
    ]}
  >
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
  translateY: PropTypes.any,
};

BlurOverlay.defaultProps = {
  blurAmount: 15,
  blurType: 'dark',
  translateX: 0,
  translateY: 0,
};

export default pure(BlurOverlay);
