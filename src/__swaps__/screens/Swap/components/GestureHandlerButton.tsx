import ConditionalWrap from 'conditional-wrap';
import React, { useMemo } from 'react';
import { StyleProp, ViewProps, ViewStyle } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureStateChangeEvent,
  LongPressGestureHandlerEventPayload,
  TapGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import Animated, { AnimatedStyle, runOnJS } from 'react-native-reanimated';
import { ButtonPressAnimation } from '@/components/animations';
import { LONG_PRESS_DURATION_IN_MS } from '@/components/buttons/hold-to-authorize/constants';
import { IS_IOS } from '@/env';

export type GestureHandlerButtonProps = {
  buttonPressWrapperStyleIOS?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  disableButtonPressWrapper?: boolean;
  disabled?: boolean;
  longPressDuration?: number;
  onLongPressEndWorklet?: (success?: boolean) => void;
  onLongPressJS?: (e?: GestureStateChangeEvent<LongPressGestureHandlerEventPayload>) => void;
  onLongPressWorklet?: (e?: GestureStateChangeEvent<LongPressGestureHandlerEventPayload>) => void;
  onPressJS?: (e?: GestureStateChangeEvent<TapGestureHandlerEventPayload>) => void;
  onPressStartWorklet?: (e?: GestureStateChangeEvent<TapGestureHandlerEventPayload>) => void;
  onPressWorklet?: (e?: GestureStateChangeEvent<TapGestureHandlerEventPayload>) => void;
  pointerEvents?: ViewProps['pointerEvents'];
  scaleTo?: number;
  style?: StyleProp<ViewStyle> | AnimatedStyle;
};

/**
 * @description This button runs its press functions directly on the UI thread,
 * which is useful when working with Reanimated, as it allows for the instant
 * manipulation of shared values without any dependence on the JS thread.
 *
 * 👉 Intended for use with react-native-gesture-handler v2
 *
 * Its onPress props accept worklets, which need to be tagged with `'worklet';`
 * like so:
 *
 * ```
 *  const onPressWorklet = () => {
 *    'worklet';
 *    opacity.value = withTiming(1);
 *  };
 * ```
 */
export function GestureHandlerButton({
  buttonPressWrapperStyleIOS,
  children,
  disableButtonPressWrapper = false,
  disabled = false,
  longPressDuration = LONG_PRESS_DURATION_IN_MS,
  onLongPressEndWorklet,
  onLongPressJS,
  onLongPressWorklet,
  onPressJS,
  onPressStartWorklet,
  onPressWorklet,
  pointerEvents = 'box-only',
  scaleTo = 0.86,
  style,
}: GestureHandlerButtonProps) {
  const gesture = useMemo(
    () =>
      Gesture.Race(
        Gesture.Tap()
          .enabled(!disabled)
          .onBegin(e => {
            if (onPressStartWorklet) onPressStartWorklet(e);
          })
          .onEnd(e => {
            if (onPressWorklet) onPressWorklet(e);
            if (onPressJS) runOnJS(onPressJS)(e);
          }),
        Gesture.LongPress()
          .enabled(!disabled && !!(onLongPressEndWorklet || onLongPressJS || onLongPressWorklet))
          .minDuration(longPressDuration)
          .onStart(e => {
            if (onLongPressWorklet) onLongPressWorklet(e);
            if (onLongPressJS) runOnJS(onLongPressJS)(e);
          })
          .onFinalize((_, success) => {
            if (onLongPressEndWorklet) onLongPressEndWorklet(success);
          })
      ),
    [disabled, longPressDuration, onLongPressEndWorklet, onLongPressJS, onLongPressWorklet, onPressJS, onPressStartWorklet, onPressWorklet]
  );

  return (
    <ConditionalWrap
      condition={IS_IOS}
      wrap={children => (
        <ButtonPressAnimation
          disabled={disabled}
          minLongPressDuration={longPressDuration}
          scaleTo={disableButtonPressWrapper ? 1 : scaleTo}
          style={buttonPressWrapperStyleIOS}
          useLateHaptic={disableButtonPressWrapper}
        >
          {children}
        </ButtonPressAnimation>
      )}
    >
      <GestureDetector gesture={gesture}>
        <Animated.View accessible accessibilityRole="button" pointerEvents={pointerEvents} style={style}>
          {children}
        </Animated.View>
      </GestureDetector>
    </ConditionalWrap>
  );
}
