import React from 'react';
import { View } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';

const HeaderGestureBlocker = ({ children, enabled }) => (
  <PanGestureHandler enabled={enabled}>
    <View zIndex={1}>{children}</View>
  </PanGestureHandler>
);

export default HeaderGestureBlocker;
