import React from 'react';
import { View } from 'react-native';
import ShadowViewAndroid from './ShadowViewAndroid';

const ShadowView = props => {
  if (ios || props.elevation > 0) {
    return <View {...props} />;
  }
  return <ShadowViewAndroid {...props} />;
};

export default ShadowView;
