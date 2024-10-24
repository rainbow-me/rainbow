import ConditionalWrap from 'conditional-wrap';
import React, { MutableRefObject, useMemo } from 'react';
import { StyleProp, ViewProps, ViewStyle } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureStateChangeEvent,
  LongPressGesture,
  LongPressGestureHandlerEventPayload,
  TapGesture,
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
  disableHapticFeedback?: boolean;
  disabled?: boolean;
  longPressDuration?: number;
  longPressRef?: MutableRefObject<LongPressGesture>;
  onLongPressEndWorklet?: (success?: boolean) => void;
  onLongPressJS?: (e?: GestureStateChangeEvent<LongPressGestureHandlerEventPayload>) => void;
  onLongPressWorklet?: (e?: GestureStateChangeEvent<LongPressGestureHandlerEventPayload>) => void;
  onPressJS?: (e?: GestureStateChangeEvent<TapGestureHandlerEventPayload>) => void;
  onPressStartWorklet?: (e?: GestureStateChangeEvent<TapGestureHandlerEventPayload>) => void;
  onPressWorklet?: (e?: GestureStateChangeEvent<TapGestureHandlerEventPayload>) => void;
  pointerEvents?: ViewProps['pointerEvents'];
  scaleTo?: number;
  style?: StyleProp<ViewStyle> | AnimatedStyle;
  tapRef?: MutableRefObject<TapGesture>;
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
  disableHapticFeedback = false,
  disabled = false,
  longPressDuration = LONG_PRESS_DURATION_IN_MS,
  longPressRef,
  onLongPressEndWorklet,
  onLongPressJS,
  onLongPressWorklet,
  onPressJS,
  onPressStartWorklet,
  onPressWorklet,
  pointerEvents = 'box-only',
  scaleTo = 0.86,
  style,
  tapRef,
}: GestureHandlerButtonProps) {
  const gesture = useMemo(() => {
    const tap = Gesture.Tap()
      .enabled(!disabled)
      .onBegin(e => {
        if (onPressStartWorklet) onPressStartWorklet(e);
      })
      .onEnd(e => {
        if (onPressWorklet) onPressWorklet(e);
        if (onPressJS) runOnJS(onPressJS)(e);
      });

    if (tapRef) tap.withRef(tapRef);

    const longPressEnabled = !!(onLongPressEndWorklet || onLongPressJS || onLongPressWorklet);

    if (!longPressEnabled) return tap;

    const longPress = Gesture.LongPress()
      .enabled(!disabled)
      .minDuration(longPressDuration)
      .onStart(e => {
        if (onLongPressWorklet) onLongPressWorklet(e);
        if (onLongPressJS) runOnJS(onLongPressJS)(e);
      })
      .onFinalize((_, success) => {
        if (onLongPressEndWorklet) onLongPressEndWorklet(success);
      });

    if (longPressRef) longPress.withRef(longPressRef);

    return Gesture.Race(tap, longPress);
  }, [
    disabled,
    longPressDuration,
    longPressRef,
    onLongPressEndWorklet,
    onLongPressJS,
    onLongPressWorklet,
    onPressJS,
    onPressStartWorklet,
    onPressWorklet,
    tapRef,
  ]);

  return (
    <ConditionalWrap
      condition={IS_IOS && !disableButtonPressWrapper}
      wrap={children => (
        <ButtonPressAnimation
          disabled={disabled}
          // This buffer ensures the native iOS button press wrapper doesn't cancel the RNGH long press events before they fire
          minLongPressDuration={longPressDuration * 1.2}
          scaleTo={disableButtonPressWrapper ? 1 : scaleTo}
          style={buttonPressWrapperStyleIOS}
          useLateHaptic={disableButtonPressWrapper || disableHapticFeedback}
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
