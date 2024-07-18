import React from 'react';
import { LongPressGestureHandler } from 'react-native-gesture-handler';
import Animated, { Easing, runOnJS, SharedValue, useAnimatedReaction, withTiming } from 'react-native-reanimated';
import { GestureHandlerButtonProps } from './GestureHandlerV1Button';

export function GestureHandlerHoldButton({
  children,
  holdProgress,
  onPressWorklet,
  onPressJS,
  disabled = false,
  pointerEvents = 'box-only',
  style,
}: Omit<GestureHandlerButtonProps, 'onPressStartWorklet' | 'disableButtonPressWrapper' | 'buttonPressWrapperStyleIOS' | 'scaleTo'> & {
  holdProgress: SharedValue<number>;
}) {
  useAnimatedReaction(
    () => holdProgress.value === 100,
    (current, previous) => {
      if (current === true && !previous) {
        holdProgress.value = 0;
        onPressWorklet?.();
        if (onPressJS) runOnJS(onPressJS)();
      }
    }
  );

  return (
    <LongPressGestureHandler
      minDurationMs={0.1}
      enabled={!disabled}
      onActivated={() => {
        holdProgress.value = withTiming(100, { duration: 1000, easing: Easing.linear });
      }}
      onEnded={() => {
        holdProgress.value = withTiming(0, { duration: 300, easing: Easing.linear });
      }}
    >
      <Animated.View accessible accessibilityRole="button" pointerEvents={pointerEvents} style={style}>
        {children}
      </Animated.View>
    </LongPressGestureHandler>
  );
}
