import React, { PropsWithChildren, useCallback, useMemo } from 'react';
import { StyleProp, ViewProps, ViewStyle } from 'react-native';
import {
  createNativeWrapper,
  RawButtonProps,
  State,
} from 'react-native-gesture-handler';
import { PureNativeButton } from 'react-native-gesture-handler/src/components/GestureButtons';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Animated, {
  Clock,
  clockRunning,
  Easing,
  timing,
  Value,
} from 'react-native-reanimated';
import { useMemoOne } from 'use-memo-one';
import NativeButton from './NativeButton';
import { usePressHandler } from './helpers/usePressHandler';
import { Direction, TransformOrigin } from './types';
import useNativeButtonAvailable from '@rainbow-me/helpers/isNativeButtonAvailable';
import { useInteraction, useTransformOrigin } from '@rainbow-me/hooks';
import { HapticFeedback, HapticFeedbackType } from '@rainbow-me/utils/haptics';

const {
  and,
  block,
  call,
  cond,
  createAnimatedComponent,
  eq,
  event,
  neq,
  or,
  set,
  not,
  startClock,
  stopClock,
} = Animated;

const { ACTIVE, CANCELLED, END, UNDETERMINED } = State;
const END_TOUCHED = 7;
const ANIMATION_STATE_0 = 0;
const ANIMATION_STATE_1 = 1;
const ANIMATION_STATE_2 = 2;
const ANIMATION_STATE_3 = 3;

const AnimatedRawButton = createNativeWrapper(
  createAnimatedComponent<PropsWithChildren<RawButtonProps & ViewProps>>(
    PureNativeButton
  ),
  {
    shouldActivateOnStart: true,
  }
);
// TODO: Leaving any because we will get rid of these Reanimated 1 code
const ButtonPressAnimationProc = function (
  animationState: any,
  durationVal: any,
  finished: any,
  frameTime: any,
  gestureState: any,
  onGestureEvent: any,
  prevGestureState: any,
  scaleValue: any,
  time: any,
  toValue: any,
  zoomClock: any,
  scaleTo: any,
  onPressCall: any,
  onPressStartCall: any,
  onLongPressCall: any,
  interactionCall: any
) {
  return block([
    cond(neq(prevGestureState, gestureState), [
      cond(
        or(
          eq(gestureState, ACTIVE),
          and(neq(prevGestureState, ACTIVE), eq(gestureState, UNDETERMINED))
        ),
        [set(animationState, ANIMATION_STATE_0)]
      ),
      cond(eq(gestureState, END), onPressCall),
      cond(eq(gestureState, ACTIVE), [
        onLongPressCall,
        interactionCall,
        onPressStartCall,
      ]),
    ]),
    set(prevGestureState, gestureState),
    cond(eq(animationState, ANIMATION_STATE_0), [
      startClock(zoomClock),
      set(finished, 0),
      set(animationState, ANIMATION_STATE_1),
      set(frameTime, 0),
      set(time, 0),
      set(toValue, scaleTo),
    ]),
    cond(
      and(
        eq(animationState, ANIMATION_STATE_1),
        neq(gestureState, ACTIVE),
        finished
      ),
      [
        set(finished, 0),
        set(animationState, ANIMATION_STATE_2),
        set(frameTime, 0),
        set(time, 0),
        set(toValue, 1),
      ]
    ),
    cond(and(eq(animationState, ANIMATION_STATE_2), finished), [
      set(animationState, ANIMATION_STATE_3),
      stopClock(zoomClock),
    ]),
    cond(
      or(
        eq(animationState, ANIMATION_STATE_1),
        eq(animationState, ANIMATION_STATE_2)
      ),
      timing(
        zoomClock,
        {
          finished,
          frameTime,
          position: scaleValue,
          time,
        },
        {
          duration: durationVal,
          // @ts-expect-error going to be fixed in Reanimated 2.8.0 whic we will merge later
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
          toValue,
        }
      )
    ),
    cond(eq(prevGestureState, END), [
      set(prevGestureState, END_TOUCHED),
      set(gestureState, END_TOUCHED),
    ]),
    scaleValue,
  ]);
};

// TODO: Leaving any because we will get rid of these Reanimated 1 code
const ButtonPressAnimationHelperProc = function (
  animationState: any,
  gestureState: any,
  prevGestureState: any,
  zoomClock: any
) {
  return block([
    cond(
      and(
        eq(gestureState, END),
        eq(prevGestureState, END_TOUCHED),
        not(clockRunning(zoomClock))
      ),
      set(prevGestureState, UNDETERMINED)
    ),
  ]);
};

interface Props {
  activeOpacity?: number;
  disabled: boolean;
  duration?: number;
  enableHapticFeedback?: boolean;
  hapticType: HapticFeedbackType;
  isInteraction?: boolean;
  minLongPressDuration: number;
  onLayout: () => void;
  onLongPress: () => void;
  onPress: () => void;
  onPressStart: () => void;
  scaleTo: number;
  style: StyleProp<ViewStyle>;
  transformOrigin: TransformOrigin | Direction;
  testID?: string;
}

function ButtonPressAnimationJS({
  activeOpacity = 1,
  children,
  disabled,
  duration = 160,
  enableHapticFeedback = true,
  hapticType = HapticFeedback.selection,
  isInteraction,
  minLongPressDuration = 500,
  onLayout,
  onLongPress,
  onPress,
  onPressStart,
  scaleTo = 0.86,
  style,
  testID,
  transformOrigin,
}: PropsWithChildren<Props>) {
  const [createHandle, removeHandle, interactionHandle] = useInteraction();
  const {
    onLayout: measureInnerElement,
    withTransformOrigin,
  } = useTransformOrigin(transformOrigin);

  const optionallyTriggerHaptic = useCallback(() => {
    if (enableHapticFeedback) {
      ReactNativeHapticFeedback.trigger(hapticType);
    }
  }, [enableHapticFeedback, hapticType]);

  const [
    handlePress,
    createLongPressHandle,
    removeLongPressHandle,
  ] = usePressHandler({
    interactionHandle,
    minLongPressDuration,
    onLongPress,
    onPress,
    optionallyTriggerHaptic,
  });

  const {
    animationState,
    durationVal,
    finished,
    frameTime,
    gestureState,
    onGestureEvent,
    prevGestureState,
    scaleValue,
    time,
    toValue,
    zoomClock,
  } = useMemoOne(() => {
    const gestureState = new Value(UNDETERMINED);
    const onGestureEvent = event([
      {
        nativeEvent: {
          state: gestureState,
        },
      },
    ]);

    return {
      animationState: new Value(CANCELLED),
      durationVal: new Value(duration),
      finished: new Value(0),
      frameTime: new Value(0),
      gestureState,
      onGestureEvent,
      prevGestureState: new Value(UNDETERMINED),
      scaleValue: new Value(1),
      time: new Value(0),
      toValue: new Value(0.5),
      zoomClock: new Clock(),
    };
  }, []);

  const scale = useMemo(
    () =>
      block([
        ButtonPressAnimationHelperProc(
          animationState,
          gestureState,
          prevGestureState,
          zoomClock
        ),
        cond(
          and(
            eq(prevGestureState, UNDETERMINED),
            eq(gestureState, END),
            neq(animationState, ANIMATION_STATE_0)
          ),
          set(animationState, ANIMATION_STATE_0)
        ),
        ButtonPressAnimationProc(
          animationState,
          durationVal,
          finished,
          frameTime,
          gestureState,
          onGestureEvent,
          prevGestureState,
          scaleValue,
          time,
          toValue,
          zoomClock,
          scaleTo,
          call([], handlePress),
          call([], () => onPressStart?.()),
          call([gestureState], ([gs]) => {
            if (!onLongPress) {
              return;
            }
            // @ts-expect-error whatever, typing there seems off we will rewrite it anyway
            if (gs === ACTIVE) {
              createLongPressHandle();
            } else {
              removeLongPressHandle();
            }
          }),
          call([gestureState], ([gs]) => {
            if (!isInteraction) {
              return;
            }
            // @ts-expect-error whatever, typing there seems off we will rewrite it anyway
            if (gs === ACTIVE) {
              createHandle();
            } else {
              removeHandle();
            }
          })
        ),
      ]),
    [
      animationState,
      createHandle,
      createLongPressHandle,
      durationVal,
      finished,
      frameTime,
      gestureState,
      handlePress,
      isInteraction,
      onGestureEvent,
      onLongPress,
      onPressStart,
      prevGestureState,
      removeHandle,
      removeLongPressHandle,
      scaleTo,
      scaleValue,
      time,
      toValue,
      zoomClock,
    ]
  );

  return (
    <AnimatedRawButton
      enabled={!disabled}
      onHandlerStateChange={onGestureEvent}
      onLayout={onLayout}
      testID={testID}
    >
      <Animated.View
        accessible
        onLayout={measureInnerElement}
        style={[
          style,
          // @ts-expect-error Will be rewritten to Reanimated 2 useAnimatedStyle
          {
            opacity: scaleValue.interpolate({
              inputRange: scaleTo > 1 ? [1, scaleTo] : [scaleTo, 1],
              outputRange:
                scaleTo > 1 ? [1, activeOpacity] : [activeOpacity, 1],
            }),
            transform: withTransformOrigin({ scale }),
          },
        ]}
      >
        {children}
      </Animated.View>
    </AnimatedRawButton>
  );
}

const ButtonPressAnimation = React.forwardRef(
  (props: PropsWithChildren<Props>, ref) => {
    const isNativeButtonAvailable = useNativeButtonAvailable();
    const Component = isNativeButtonAvailable
      ? NativeButton
      : ButtonPressAnimationJS;
    return <Component {...props} ref={ref} />;
  }
);
ButtonPressAnimation.displayName = 'ButtonPressAnimation';

export default ButtonPressAnimation;
