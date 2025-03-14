import React, { MutableRefObject, useMemo } from 'react';
import { Insets, LayoutChangeEvent, StyleProp, ViewProps, ViewStyle } from 'react-native';
import { Gesture, GestureDetector, GestureType, LongPressGesture, TapGesture } from 'react-native-gesture-handler';
import Animated, { AnimatedStyle, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { HapticType, triggerHaptics } from 'react-native-turbo-haptics';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { LONG_PRESS_DURATION_IN_MS } from '@/components/buttons/hold-to-authorize/constants';

export type GestureHandlerButtonProps = {
  blocksExternalGesture?: MutableRefObject<GestureType>;
  children: React.ReactNode;
  disableHaptics?: boolean;
  disableScale?: boolean;
  disabled?: boolean;
  hapticTrigger?: 'tap-end' | 'tap-start';
  hapticType?: HapticType;
  hitSlop?: number | Insets;
  longPressDuration?: number;
  longPressRef?: MutableRefObject<LongPressGesture>;
  onLayout?: (e: LayoutChangeEvent) => void;
  onLongPressEndWorklet?: (success?: boolean) => void;
  onLongPressJS?: () => void;
  onLongPressWorklet?: () => void;
  onPressJS?: () => void;
  onPressStartWorklet?: () => void;
  onPressWorklet?: () => void;
  pointerEvents?: ViewProps['pointerEvents'];
  requireExternalGestureToFail?: MutableRefObject<GestureType>;
  scaleTo?: number;
  simultaneousWithExternalGesture?: MutableRefObject<GestureType>;
  style?: StyleProp<ViewStyle> | AnimatedStyle;
  tapRef?: MutableRefObject<TapGesture>;
  testID?: string;
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
  blocksExternalGesture,
  children,
  disableHaptics = false,
  disableScale = false,
  disabled = false,
  hapticTrigger = 'tap-start',
  hapticType = 'selection',
  hitSlop = 10,
  longPressDuration = LONG_PRESS_DURATION_IN_MS,
  longPressRef,
  onLayout,
  onLongPressEndWorklet,
  onLongPressJS,
  onLongPressWorklet,
  onPressJS,
  onPressStartWorklet,
  onPressWorklet,
  pointerEvents = 'box-only',
  requireExternalGestureToFail,
  scaleTo = 0.86,
  simultaneousWithExternalGesture,
  style,
  tapRef,
  testID,
}: GestureHandlerButtonProps) {
  const isPressed = useSharedValue(false);

  const pressStyle = useAnimatedStyle(() => {
    if (disableScale) return {};
    return {
      transform: [{ scale: withTiming(isPressed.value ? scaleTo : 1, TIMING_CONFIGS.buttonPressConfig) }],
    };
  });

  const gesture = useMemo(() => {
    const tap = Gesture.Tap()
      .enabled(!disabled)
      .maxDistance(20)
      .onBegin(() => {
        if (!disableScale) isPressed.value = true;
        if (!disableHaptics && hapticTrigger === 'tap-start') triggerHaptics(hapticType);
        onPressStartWorklet?.();
      })
      .onEnd(() => {
        if (!disableScale) isPressed.value = false;
        if (!disableHaptics && hapticTrigger === 'tap-end') triggerHaptics(hapticType);
        onPressWorklet?.();
        if (onPressJS) runOnJS(onPressJS)();
      })
      .onFinalize(() => {
        if (!disableScale) isPressed.value = false;
      });

    if (tapRef) tap.withRef(tapRef);
    if (blocksExternalGesture) tap.blocksExternalGesture(blocksExternalGesture);
    if (requireExternalGestureToFail) tap.requireExternalGestureToFail(requireExternalGestureToFail);
    if (simultaneousWithExternalGesture) tap.simultaneousWithExternalGesture(simultaneousWithExternalGesture);

    const longPressEnabled = !!(onLongPressEndWorklet || onLongPressJS || onLongPressWorklet);

    if (!longPressEnabled) return tap;

    const longPress = Gesture.LongPress()
      .enabled(!disabled)
      .maxDistance(20)
      .minDuration(longPressDuration)
      .onStart(() => {
        if (!disableScale) isPressed.value = true;
        if (!disableHaptics) triggerHaptics(hapticType);
        onLongPressWorklet?.();
        if (onLongPressJS) runOnJS(onLongPressJS)();
      })
      .onFinalize((_, success) => {
        if (!disableScale) isPressed.value = false;
        onLongPressEndWorklet?.(success);
      });

    if (longPressRef) longPress.withRef(longPressRef);
    if (blocksExternalGesture) longPress.blocksExternalGesture(blocksExternalGesture);
    if (requireExternalGestureToFail) longPress.requireExternalGestureToFail(requireExternalGestureToFail);
    if (simultaneousWithExternalGesture) longPress.simultaneousWithExternalGesture(simultaneousWithExternalGesture);

    return Gesture.Race(tap, longPress);
  }, [
    blocksExternalGesture,
    disableHaptics,
    disableScale,
    disabled,
    hapticTrigger,
    hapticType,
    isPressed,
    longPressDuration,
    longPressRef,
    onLongPressEndWorklet,
    onLongPressJS,
    onLongPressWorklet,
    onPressJS,
    onPressStartWorklet,
    onPressWorklet,
    requireExternalGestureToFail,
    simultaneousWithExternalGesture,
    tapRef,
  ]);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        accessible
        accessibilityRole="button"
        hitSlop={hitSlop}
        onLayout={onLayout}
        pointerEvents={pointerEvents}
        style={[style, pressStyle]}
        testID={testID}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
