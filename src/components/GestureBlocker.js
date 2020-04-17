import PropTypes from 'prop-types';
import React, { useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  PanGestureHandler,
  State,
  TapGestureHandler,
} from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useDimensions } from '../hooks';

const { call, cond, event, eq } = Animated;

const sx = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    zIndex: 10,
  },
});

const GestureBlocker = ({ type, onTouchEnd }) => {
  const { height: screenHeight } = useDimensions();
  const tab = useRef(null);
  const pan = useRef(null);

  const containerStyles = useMemo(
    () => ({
      height: screenHeight,
      [type]: -screenHeight,
    }),
    [screenHeight, type]
  );

  const onHandlerStateChange = event([
    {
      nativeEvent: {
        state: s => cond(cond(cond(eq(State.END, s), call([], onTouchEnd)))),
      },
    },
  ]);

  return (
    <View style={[containerStyles, sx.container]}>
      <PanGestureHandler
        minDeltaX={1}
        minDeltaY={1}
        ref={pan}
        simultaneousHandlers={tab}
      >
        <Animated.View style={StyleSheet.absoluteFillObject}>
          <TapGestureHandler
            onHandlerStateChange={onHandlerStateChange}
            ref={tab}
            simultaneousHandlers={pan}
          >
            <Animated.View style={StyleSheet.absoluteFillObject} />
          </TapGestureHandler>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

GestureBlocker.propTypes = {
  onTouchEnd: PropTypes.func,
  type: PropTypes.string,
};

GestureBlocker.defaultProps = {
  onTouchEnd: () => null,
};

export default React.memo(GestureBlocker);
