import React from 'react';
import { StyleProp, ViewProps, ViewStyle } from 'react-native';
import { TapGestureHandler, TapGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, { useAnimatedGestureHandler } from 'react-native-reanimated';
import { ButtonPressAnimation } from '@/components/animations';
import ConditionalWrap from 'conditional-wrap';
import { IS_IOS } from '@/env';

type GestureHandlerButtonProps = {
  children: React.ReactNode;
  disableButtonPressWrapper?: boolean;
  disabled?: boolean;
  onPressStartWorklet?: () => void;
  onPressWorklet?: () => void;
  pointerEvents?: ViewProps['pointerEvents'];
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * @description This button runs its press functions directly on the UI thread,
 * which is useful when working with Reanimated, as it allows for the instant
 * manipulation of shared values without any dependence on the JS thread.
 *
 * 👉 Intended for use with react-native-gesture-handler v1
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
export function GestureHandlerV1Button({
  children,
  disableButtonPressWrapper = false,
  disabled = false,
  onPressStartWorklet,
  onPressWorklet,
  pointerEvents = 'box-only',
  scaleTo = 0.86,
  style,
}: GestureHandlerButtonProps) {
  const pressHandler = useAnimatedGestureHandler<TapGestureHandlerGestureEvent>({
    onStart: () => {
      if (onPressStartWorklet) onPressStartWorklet();
    },
    onActive: () => {
      if (onPressWorklet) onPressWorklet();
    },
  });

  return (
    <ConditionalWrap
      condition={IS_IOS}
      wrap={children => (
        <ButtonPressAnimation
          disabled={disabled}
          scaleTo={disableButtonPressWrapper ? 1 : scaleTo}
          useLateHaptic={disableButtonPressWrapper}
        >
          {children}
        </ButtonPressAnimation>
      )}
    >
      {/* @ts-expect-error Property 'children' does not exist on type */}
      <TapGestureHandler onGestureEvent={pressHandler}>
        <Animated.View accessible accessibilityRole="button" pointerEvents={pointerEvents} style={style}>
          {children}
        </Animated.View>
      </TapGestureHandler>
    </ConditionalWrap>
  );
}
