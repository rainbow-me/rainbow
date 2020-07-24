import React, { useRef } from 'react';
import { StyleSheet } from 'react-native';
import {
  PanGestureHandler,
  State,
  TapGestureHandler,
} from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import { useMemoOne } from 'use-memo-one';
import { useDimensions } from '@rainbow-me/hooks';

const { call, cond, event, eq } = Animated;
const NOOP = () => null;

const Container = styled.View`
  ${({ height, type }) => `${type}: ${-height};`};
  height: ${({ height }) => height};
  position: absolute;
  width: 100%;
  z-index: 10;
`;

export default function GestureBlocker({ onTouchEnd = NOOP, type }) {
  const { height: screenHeight } = useDimensions();
  const tab = useRef(null);
  const pan = useRef(null);

  const onHandlerStateChange = useMemoOne(
    () =>
      event([
        {
          nativeEvent: {
            state: s =>
              cond(cond(cond(eq(State.END, s), call([], onTouchEnd)))),
          },
        },
      ]),
    [onTouchEnd]
  );

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
}
