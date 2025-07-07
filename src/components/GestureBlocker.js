import React, { useRef } from 'react';
import { StyleSheet } from 'react-native';
import { PanGestureHandler, TapGestureHandler } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedGestureHandler } from 'react-native-reanimated';
import styled from '@/styled-thing';
import { DEVICE_HEIGHT } from '@/utils/deviceUtils';

const NOOP = () => null;

const Container = styled.View(({ type, height }) => ({
  height,
  position: 'absolute',
  [type]: -height,
  width: '100%',
  zIndex: 10,
}));

export default function GestureBlocker({ onTouchEnd = NOOP, type }) {
  const tab = useRef(null);
  const pan = useRef(null);

  const onHandlerStateChange = useAnimatedGestureHandler({
    onEnd: () => {
      runOnJS(onTouchEnd)();
    },
  });

  return (
    <Container height={DEVICE_HEIGHT} type={type}>
      <PanGestureHandler minDeltaX={1} minDeltaY={1} ref={pan} simultaneousHandlers={tab}>
        <Animated.View style={StyleSheet.absoluteFillObject}>
          <TapGestureHandler onHandlerStateChange={onHandlerStateChange} ref={tab} simultaneousHandlers={pan}>
            <Animated.View style={StyleSheet.absoluteFillObject} />
          </TapGestureHandler>
        </Animated.View>
      </PanGestureHandler>
    </Container>
  );
}
