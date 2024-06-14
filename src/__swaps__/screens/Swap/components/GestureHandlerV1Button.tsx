import { ButtonPressAnimation } from '@/components/animations';
import { IS_IOS } from '@/env';
import ConditionalWrap from 'conditional-wrap';
import React from 'react';
import { StyleProp, ViewProps, ViewStyle } from 'react-native';
import { TapGestureHandler, TapGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, { AnimatedStyle, runOnJS, useAnimatedGestureHandler } from 'react-native-reanimated';

export type GestureHandlerButtonProps = {
  buttonPressWrapperStyleIOS?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  disableButtonPressWrapper?: boolean;
  disabled?: boolean;
  onPressJS?: () => void;
  onPressStartWorklet?: () => void;
  onPressWorklet?: () => void;
  pointerEvents?: ViewProps['pointerEvents'];
  scaleTo?: number;
  style?: StyleProp<ViewStyle> | AnimatedStyle;
};

/**
 * @description This button can execute press functions directly on the UI thread,
 * which is useful when working with Reanimated, as it allows for instantly
 * manipulating shared values without any dependence on the JS thread.
 *
 * 👉 Intended for use with react-native-gesture-handler v1
 *
 * ———
 *
 * 🔵 `onPressWorklet`
 * -
 * 🔵 `onPressStartWorklet`
 * -
 * - To execute code on the UI thread, pass a function tagged with `'worklet';`
 * like so:
 *
 * ```
 *  const onPressWorklet = () => {
 *    'worklet';
 *    opacity.value = withTiming(1);
 *  };
 * ```
 * ———
 *
 * 🟢 `onPressJS`
 * -
 * - If you need to simultaneously execute code on the JS thread, rather than
 * using runOnJS within your worklet, you can pass a function via `onPressJS`:
 *
 * ```
 * const [fromJSThread, setFromJSThread] = useState(false);
 *
 * const onPressJS = () => {
 *   setFromJSThread(true);
 * };
 * ```
 */
export const GestureHandlerV1Button = React.forwardRef(function GestureHandlerV1Button(
  {
    buttonPressWrapperStyleIOS,
    children,
    disableButtonPressWrapper = false,
    disabled = false,
    onPressJS,
    onPressStartWorklet,
    onPressWorklet,
    pointerEvents = 'box-only',
    scaleTo = 0.86,
    style,
  }: GestureHandlerButtonProps,
  ref: React.LegacyRef<unknown> | undefined
) {
  const pressHandler = useAnimatedGestureHandler<TapGestureHandlerGestureEvent>({
    onStart: () => {
      if (onPressStartWorklet) onPressStartWorklet();
    },
    onActive: () => {
      if (onPressWorklet) onPressWorklet();
      if (onPressJS) runOnJS(onPressJS)();
    },
  });

  return (
    <ConditionalWrap
      condition={IS_IOS && !disableButtonPressWrapper}
      wrap={children => (
        <ButtonPressAnimation scaleTo={disabled ? 1 : scaleTo} style={buttonPressWrapperStyleIOS} useLateHaptic={disabled}>
          {children}
        </ButtonPressAnimation>
      )}
    >
      {/* @ts-expect-error Property 'children' does not exist on type */}
      <TapGestureHandler enabled={!disabled} onGestureEvent={pressHandler} ref={ref}>
        <Animated.View accessible accessibilityRole="button" pointerEvents={pointerEvents} style={style}>
          {children}
        </Animated.View>
      </TapGestureHandler>
    </ConditionalWrap>
  );
});
