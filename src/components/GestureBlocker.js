import PropTypes from 'prop-types';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  State,
  PanGestureHandler,
  TapGestureHandler,
} from 'react-native-gesture-handler';
import { deviceUtils } from '../utils';

const { height } = deviceUtils.dimensions;

const GestureBlocker = ({ type, onHandlerStateChange }) => {
  const tab = React.useRef(null);
  const pan = React.useRef(null);

  const handleGestureBlockerStateChange = ({ nativeEvent }) => {
    if (nativeEvent.state === State.END) {
      onHandlerStateChange();
    }
  };

  return (
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
        ref={pan}
        simultaneousHandlers={tab}
        minDeltaX={1}
        minDeltaY={1}
      >
        <TapGestureHandler
          ref={tab}
          simultaneousHandlers={pan}
          onHandlerStateChange={handleGestureBlockerStateChange}
        >
          <View style={StyleSheet.absoluteFillObject} />
        </TapGestureHandler>
      </PanGestureHandler>
    </View>
  );
};

GestureBlocker.propTypes = {
  onHandlerStateChange: PropTypes.func,
  type: PropTypes.string,
};

export default React.memo(GestureBlocker);
