import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

const ShadowView = props => {
  if (Platform.OS === 'ios' || props.elevation > 0) {
    return <View {...props} />;
  }
  return <View {...props} elevation={Math.min(StyleSheet.flatten(props.style).shadowRadius, 5)} />;
};

export default ShadowView;
