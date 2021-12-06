import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { createNativeWrapper, State } from 'react-native-gesture-handler';
// @ts-expect-error ts-migrate(6142) FIXME: Module 'react-native-gesture-handler/src/component... Remove this comment to see the full error message
import { PureNativeButton } from 'react-native-gesture-handler/src/components/GestureButtons';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Animated, {
  Clock,
  clockRunning,
  Easing,
  timing,
  Value,
} from 'react-native-reanimated';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import stylePropType from 'react-style-proptype';
import { useMemoOne } from 'use-memo-one';
import useNativeButtonAvailable from '../../../helpers/isNativeButtonAvailable';
import { directionPropType } from '../../../utils';
// @ts-expect-error ts-migrate(6142) FIXME: Module './NativeButton' was resolved to '/Users/ni... Remove this comment to see the full error message
import NativeButton from './NativeButton';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useInteraction, useTransformOrigin } from '@rainbow-me/hooks';

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
  proc,
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
  createAnimatedComponent(PureNativeButton),
  {
    shouldActivateOnStart: true,
  }
);

function usePressHandler({
  interactionHandle = {},
  minLongPressDuration,
  onLongPress,
  onPress,
  optionallyTriggerHaptic,
}: any) {
  const longPressHandle = useRef();

  const createHandle = useCallback(() => {
    // @ts-expect-error ts-migrate(2322) FIXME: Type 'number' is not assignable to type 'undefined... Remove this comment to see the full error message
    longPressHandle.current = setTimeout(() => {
      onLongPress();
      // @ts-expect-error ts-migrate(2322) FIXME: Type 'null' is not assignable to type 'undefined'.
      longPressHandle.current = null;
      optionallyTriggerHaptic();
    }, minLongPressDuration);
  }, [minLongPressDuration, onLongPress, optionallyTriggerHaptic]);

  const handlePress = useCallback(() => {
    if (onLongPress && !longPressHandle.current) return;
    onPress && onPress();
    optionallyTriggerHaptic();
  }, [longPressHandle, onLongPress, onPress, optionallyTriggerHaptic]);

  const removeHandle = useCallback(() => {
    if (interactionHandle.current) {
      clearTimeout(longPressHandle.current);
      // @ts-expect-error ts-migrate(2322) FIXME: Type 'null' is not assignable to type 'undefined'.
      longPressHandle.current = null;
    }
  }, [interactionHandle]);

  useEffect(() => () => removeHandle());
  return [handlePress, createHandle, removeHandle];
}

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
const maybeProc = ios ? (a: any) => a : proc;

const ButtonPressAnimationProc = maybeProc(function (
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
          // @ts-expect-error ts-migrate(2322) FIXME: Type 'EasingFunction' is not assignable to type 'E... Remove this comment to see the full error message
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
});

const ButtonPressAnimationHelperProc = maybeProc(function (
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
});

function ButtonPressAnimationJS({
  activeOpacity,
  children,
  disabled,
  duration,
  enableHapticFeedback,
  hapticType,
  isInteraction,
  minLongPressDuration,
  onLayout,
  onLongPress,
  onPress,
  onPressStart,
  scaleTo,
  style,
  testID,
  transformOrigin,
}: any) {
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
          call([], () => onPressStart && onPressStart()),
          call([gestureState], ([gs]) => {
            if (!onLongPress) {
              return;
            }
            // @ts-expect-error ts-migrate(2367) FIXME: This condition will always return 'false' since th... Remove this comment to see the full error message
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
            // @ts-expect-error ts-migrate(2367) FIXME: This condition will always return 'false' since th... Remove this comment to see the full error message
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <AnimatedRawButton
      enabled={!disabled}
      onHandlerStateChange={onGestureEvent}
      onLayout={onLayout}
      testID={testID}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Animated.View
        accessible
        onLayout={measureInnerElement}
        style={[
          style,
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

const ButtonPressAnimation = React.forwardRef((props, ref) => {
  const isNativeButtonAvailable = useNativeButtonAvailable();
  const Component = isNativeButtonAvailable
    ? NativeButton
    : ButtonPressAnimationJS;
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  return <Component {...props} ref={ref} />;
});
ButtonPressAnimation.displayName = 'ButtonPressAnimation';

export default ButtonPressAnimation;

ButtonPressAnimation.propTypes = {
  // @ts-expect-error ts-migrate(2322) FIXME: Type '{ activeOpacity: PropTypes.Requireable<numbe... Remove this comment to see the full error message
  activeOpacity: PropTypes.number,
  children: PropTypes.any,
  disabled: PropTypes.bool,
  duration: PropTypes.number,
  enableHapticFeedback: PropTypes.bool,
  hapticType: PropTypes.string,
  isInteraction: PropTypes.bool,
  minLongPressDuration: PropTypes.number,
  onLayout: PropTypes.func,
  onLongPress: PropTypes.func,
  onPress: PropTypes.func,
  onPressStart: PropTypes.func,
  pressOutDuration: PropTypes.number,
  scaleTo: PropTypes.number,
  style: stylePropType,
  transformOrigin: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.number),
    directionPropType,
  ]),
  useLateHaptic: PropTypes.bool,
};

ButtonPressAnimation.defaultProps = {
  // @ts-expect-error ts-migrate(2322) FIXME: Type '{ activeOpacity: number; duration: number; e... Remove this comment to see the full error message
  activeOpacity: 1,
  duration: 160,
  enableHapticFeedback: true,
  hapticType: 'selection',
  minLongPressDuration: 500,
  scaleTo: 0.86,
};

NativeButton.defaultProps = {
  activeOpacity: 1,
  duration: 160,
  enableHapticFeedback: true,
  hapticType: 'selection',
  minLongPressDuration: 500,
  scaleTo: 0.86,
  useLateHaptic: true,
};
