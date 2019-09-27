import PropTypes from 'prop-types';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { deviceUtils } from '../utils';

const { height } = deviceUtils.dimensions;

const GestureBlocker = ({ type }) => (
  <View
    style={{
      height,
      position: 'absolute',
      [type]: -height,
      width: '100%',
      zIndex: 10,
    }}
  >
    <PanGestureHandler minDeltaX={1} minDeltaY={1}>
      <View style={StyleSheet.absoluteFillObject} />
    </PanGestureHandler>
  </View>
);

GestureBlocker.propTypes = {
  type: PropTypes.string,
};

export default GestureBlocker;
