import React from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

const ShadowView = props => {
  if (ios || props.elevation > 0) {
    return <Animated.View {...props} />;
  }
  return (
    <Animated.View
      {...props}
      elevation={Math.min(StyleSheet.flatten(props.style).shadowRadius, 5)}
    />
  );
};

export default ShadowView;
