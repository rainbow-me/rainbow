import PropTypes from 'prop-types';
import React, { useRef } from 'react';
import { StyleSheet } from 'react-native';
import {
  PanGestureHandler,
  State,
  TapGestureHandler,
} from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import { useDimensions } from '../hooks';

const { call, cond, event, eq } = Animated;

const Container = styled.View`
  ${({ height, type }) => `${type}: ${-height};`};
  height: ${({ height }) => height};
  position: absolute;
  width: 100%;
  z-index: 10;
`;

const GestureBlocker = ({ type, onTouchEnd }) => {
  const { height: screenHeight } = useDimensions();
  const tab = useRef(null);
  const pan = useRef(null);

  const onHandlerStateChange = event([
    {
      nativeEvent: {
        state: s => cond(cond(cond(eq(State.END, s), call([], onTouchEnd)))),
      },
    },
  ]);

  return (
    <Container height={screenHeight} type={type}>
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
    </Container>
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
