import React from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS } from 'react-native-reanimated';
import useDimensions from '@/hooks/useDimensions';
import styled from '@/styled-thing';

const NOOP = () => null;

const Container = styled.View(({ type, height }) => ({
  height,
  position: 'absolute',
  [type]: -height,
  width: '100%',
  zIndex: 10,
}));

export default function GestureBlocker({ onTouchEnd = NOOP, type }) {
  const { height: screenHeight } = useDimensions();
  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(onTouchEnd)();
  });
  const panGesture = Gesture.Pan().minDistance(1);
  const combinedGesture = Gesture.Simultaneous(panGesture, tapGesture);

  return (
    <Container height={screenHeight} type={type}>
      <GestureDetector gesture={combinedGesture}>
        <Animated.View style={StyleSheet.absoluteFillObject}>
          <Animated.View style={StyleSheet.absoluteFillObject} />
        </Animated.View>
      </GestureDetector>
    </Container>
  );
}
