import React, { useRef } from 'react';
import { StyleSheet } from 'react-native';
import {
  PanGestureHandler,
  State,
  TapGestureHandler,
} from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import styled from 'styled-components';
import { useMemoOne } from 'use-memo-one';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useDimensions } from '@rainbow-me/hooks';

const { call, cond, event, eq } = Animated;
const NOOP = () => null;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const Container = styled.View`
  ${({ height, type }: any) => `${type}: ${-height};`};
  height: ${({ height }: any) => height};
  position: absolute;
  width: 100%;
  z-index: 10;
`;

export default function GestureBlocker({ onTouchEnd = NOOP, type }: any) {
  const { height: screenHeight } = useDimensions();
  const tab = useRef(null);
  const pan = useRef(null);

  const onHandlerStateChange = useMemoOne(
    () =>
      event([
        {
          nativeEvent: {
            state: (s: any) =>
              // @ts-expect-error ts-migrate(2554) FIXME: Expected 2-3 arguments, but got 1.
              cond(cond(cond(eq(State.END, s), call([], onTouchEnd)))),
          },
        },
      ]),
    [onTouchEnd]
  );

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container height={screenHeight} type={type}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <PanGestureHandler
        minDeltaX={1}
        minDeltaY={1}
        ref={pan}
        simultaneousHandlers={tab}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Animated.View style={StyleSheet.absoluteFillObject}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <TapGestureHandler
            onHandlerStateChange={onHandlerStateChange}
            ref={tab}
            simultaneousHandlers={pan}
          >
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Animated.View style={StyleSheet.absoluteFillObject} />
          </TapGestureHandler>
        </Animated.View>
      </PanGestureHandler>
    </Container>
  );
}
