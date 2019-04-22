import PropTypes from 'prop-types';
import React from 'react';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { StyleSheet, View } from 'react-native';
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
    <PanGestureHandler
      minDeltaY={1}
      minDeltaX={1}
    >
      <View style={StyleSheet.absoluteFillObject} />
    </PanGestureHandler>
  </View>
);

GestureBlocker.propTypes = {
  type: PropTypes.string,
}

export default GestureBlocker;
