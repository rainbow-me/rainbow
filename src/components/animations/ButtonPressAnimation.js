import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  createNativeWrapper,
  PureNativeButton,
} from 'react-native-gesture-handler';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Animated, { Easing } from 'react-native-reanimated';
import stylePropType from 'react-style-proptype';
import { useMemoOne } from 'use-memo-one';
import { useInteraction, useTransformOrigin } from '../../hooks';
import { animations } from '../../styles';
import { directionPropType } from '../../utils';

const {
  and,
  block,
  call,
  Clock,
  cond,
  createAnimatedComponent,
  eq,
  event,
  neq,
  onChange,
  or,
  set,
  startClock,
  stopClock,
  timing,
  Value,
} = Animated;

const AnimatedRawButton = createNativeWrapper(
  createAnimatedComponent(PureNativeButton),
  {
    shouldActivateOnStart: true,
    shouldCancelWhenOutside: true,
  }
);

function usePressHandler({
  interactionHandle = {},
  minLongPressDuration,
  onLongPress,
  onPress,
  optionallyTriggerHaptic,
}) {
  const longPressHandle = useRef();

  const createHandle = useCallback(() => {
    longPressHandle.current = setTimeout(() => {
      onLongPress();
      longPressHandle.current = null;
      optionallyTriggerHaptic();
    }, minLongPressDuration);
  }, [minLongPressDuration, onLongPress, optionallyTriggerHaptic]);

  const handlePress = useCallback(() => {
    if (onLongPress && !longPressHandle.current) return;
    onPress();
    optionallyTriggerHaptic();
  }, [longPressHandle, onLongPress, onPress, optionallyTriggerHaptic]);

  const removeHandle = useCallback(() => {
    if (interactionHandle.current) {
      clearTimeout(longPressHandle.current);
      longPressHandle.current = null;
    }
  }, [interactionHandle]);

  useEffect(() => () => removeHandle());
  return [handlePress, createHandle, removeHandle];
}

export default function ButtonPressAnimation({
  activeOpacity,
  children,
  disabled,
  duration,
  easing,
  enableHapticFeedback,
  hapticType,
  isInteraction,
  minLongPressDuration,
  onLongPress,
  onPress,
  onPressStart,
  scaleTo,
  style,
  transformOrigin,
}) {
  const [interactionHandle, createHandle, removeHandle] = useInteraction();
  const { onLayout, withTransformOrigin } = useTransformOrigin(transformOrigin);

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
    const gestureState = new Value(0);
    const onGestureEvent = event([
      {
        nativeEvent: {
          state: gestureState,
        },
      },
    ]);

    return {
      animationState: new Value(3),
      durationVal: new Value(duration),
      finished: new Value(0),
      frameTime: new Value(0),
      gestureState,
      onGestureEvent,
      prevGestureState: new Value(0),
      scaleValue: new Value(1),
      time: new Value(0),
      toValue: new Value(0.5),
      zoomClock: new Clock(),
    };
  }, []);

  const scale = useRef(
    block([
      onChange(
        gestureState,
        cond(
          or(
            eq(gestureState, 4),
            and(neq(prevGestureState, 4), eq(gestureState, 5))
          ),
          [set(animationState, 0)]
        )
      ),
      set(prevGestureState, gestureState),
      ...(onPress
        ? [
            onChange(
              gestureState,
              cond(eq(gestureState, 5), call([], handlePress))
            ),
          ]
        : []),
      ...(onLongPress
        ? [
            onChange(
              eq(gestureState, 4),
              call([gestureState], ([gs]) => {
                if (gs === 4) {
                  createLongPressHandle();
                } else {
                  removeLongPressHandle();
                }
              })
            ),
          ]
        : []),
      ...(isInteraction
        ? [
            onChange(
              eq(gestureState, 4),
              call([gestureState], ([gs]) => {
                if (gs === 4) {
                  createHandle();
                } else {
                  removeHandle();
                }
              })
            ),
          ]
        : []),
      ...(onPressStart
        ? [
            onChange(
              eq(gestureState, 4),
              cond(eq(gestureState, 4), call([], onPressStart))
            ),
          ]
        : []),
      cond(eq(animationState, 0), [
        startClock(zoomClock),
        set(finished, 0),
        set(animationState, 1),
        set(frameTime, 0),
        set(time, 0),
        set(toValue, scaleTo),
      ]),
      cond(and(eq(animationState, 1), neq(gestureState, 4), finished), [
        set(finished, 0),
        set(animationState, 2),
        set(frameTime, 0),
        set(time, 0),
        set(toValue, 1),
      ]),
      cond(and(eq(animationState, 2), finished), [
        set(animationState, 3),
        stopClock(zoomClock),
      ]),
      cond(
        or(eq(animationState, 1), eq(animationState, 2)),
        timing(
          zoomClock,
          { finished, frameTime, position: scaleValue, time },
          { duration: durationVal, easing, toValue }
        )
      ),
      scaleValue,
    ])
  ).current;

  return (
    <AnimatedRawButton
      enabled={!disabled}
      onHandlerStateChange={onGestureEvent}
    >
      <Animated.View
        accessible
        onLayout={onLayout}
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

ButtonPressAnimation.propTypes = {
  activeOpacity: PropTypes.number,
  children: PropTypes.any,
  disabled: PropTypes.bool,
  duration: PropTypes.number,
  easing: PropTypes.func,
  enableHapticFeedback: PropTypes.bool,
  hapticType: PropTypes.string,
  isInteraction: PropTypes.bool,
  minLongPressDuration: PropTypes.number,
  onLongPress: PropTypes.func,
  onPress: PropTypes.func,
  onPressStart: PropTypes.func,
  scaleTo: PropTypes.number,
  style: stylePropType,
  transformOrigin: directionPropType,
};

ButtonPressAnimation.defaultProps = {
  activeOpacity: 1,
  duration: 170,
  easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
  enableHapticFeedback: true,
  hapticType: 'selection',
  minLongPressDuration: 500,
  scaleTo: animations.keyframes.button.to.scale,
};
