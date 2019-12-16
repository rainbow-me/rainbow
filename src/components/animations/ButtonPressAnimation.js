import PropTypes from 'prop-types';
import React from 'react';
import { InteractionManager } from 'react-native';
import {
  createNativeWrapper,
  PureNativeButton,
} from 'react-native-gesture-handler';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Animated, { Easing } from 'react-native-reanimated';
import stylePropType from 'react-style-proptype';
import { animations } from '../../styles';
import { directionPropType } from '../../utils';
import { transformOrigin as transformOriginUtil } from './procs';

const {
  neq,
  and,
  timing,
  startClock,
  block,
  call,
  eq,
  or,
  set,
  cond,
  createAnimatedComponent,
  event,
  onChange,
  stopClock,
} = Animated;

const AnimatedRawButton = createNativeWrapper(
  createAnimatedComponent(PureNativeButton),
  {
    shouldActivateOnStart: true,
    shouldCancelWhenOutside: true,
  }
);

const HapticFeedbackTypes = {
  impactHeavy: 'impactHeavy',
  impactLight: 'impactLight',
  impactMedium: 'impactMedium',
  notificationError: 'notificationError',
  notificationSuccess: 'notificationSuccess',
  notificationWarning: 'notificationWarning',
  selection: 'selection',
};

function useAnimatedValue(initialValue) {
  const animatedRef = React.useRef(null);

  if (animatedRef.current == null) {
    animatedRef.current = new Animated.Value(initialValue);
  }

  return animatedRef.current;
}

function useAnimatedClock() {
  const animatedRef = React.useRef(null);

  if (animatedRef.current == null) {
    animatedRef.current = new Animated.Clock();
  }

  return animatedRef.current;
}

export default function ButtonPressAnimation({
  style,
  children,
  onPress,
  scaleTo,
  duration,
  onPressStart,
  easing,
  transformOrigin,
  isInteraction,
  activeOpacity,
  disabled,
  onLongPress,
  minLongPressDuration,
  enableHapticFeedback,
  hapticType,
}) {
  const gestureState = useAnimatedValue(0);
  const scaleValue = useAnimatedValue(1);
  const finished = useAnimatedValue(0);
  const frameTime = useAnimatedValue(0);
  const time = useAnimatedValue(0);
  const toValue = useAnimatedValue(0.5);
  const durationVal = useAnimatedValue(duration);
  const animationState = useAnimatedValue(3);

  const inteactionHandle = React.useRef();
  const createHandle = React.useCallback(() => {
    inteactionHandle.current = InteractionManager.createInteractionHandle();
  });

  const removeHandle = React.useCallback(() => {
    if (inteactionHandle.current) {
      InteractionManager.clearInteractionHandle(inteactionHandle.current);
      inteactionHandle.current = null;
    }
  });

  const longPressHandle = React.useRef();

  const createLongPressHandle = React.useCallback(() => {
    longPressHandle.current = setTimeout(() => {
      onLongPress();
      longPressHandle.current = null;
      if (enableHapticFeedback) {
        ReactNativeHapticFeedback.trigger(hapticType);
      }
    }, minLongPressDuration);
  });

  const removeLongPressHandle = React.useCallback(() => {
    if (inteactionHandle.current) {
      clearTimeout(longPressHandle.current);
      longPressHandle.current = null;
    }
  });

  React.useEffect(() => () => {
    removeLongPressHandle();
    removeHandle();
  });

  const [layout, setLayout] = React.useState({ height: 0, width: 0 });

  const onLayout = React.useCallback(
    ({
      nativeEvent: {
        layout: { width, height },
      },
    }) => {
      if (transformOrigin && !Object.values(layout).reduce((a, b) => a + b)) {
        console.log(width, height, transformOrigin);
        setLayout({ height, width });
      }
    }
  );
  const { offsetX, offsetY } = React.useMemo(() => {
    let offsetX = 0;
    let offsetY = 0;

    if (transformOrigin === 'left' || transformOrigin === 'right') {
      offsetX =
        Math.floor(layout.width / 2) * (transformOrigin === 'left' ? -1 : 1);
    } else if (transformOrigin === 'bottom' || transformOrigin === 'top') {
      offsetY =
        Math.floor(layout.height / 2) * (transformOrigin === 'top' ? -1 : 1);
    }
    console.log(offsetX, offsetY);
    return { offsetX, offsetY };
  }, [layout.height, layout.width, transformOrigin]);

  const zoomClock = useAnimatedClock();

  const onGestureEvent = React.useRef(
    event([
      {
        nativeEvent: {
          state: gestureState,
        },
      },
    ]),
    [gestureState]
  ).current;

  const scale = React.useRef(
    block([
      onChange(
        gestureState,
        cond(eq(gestureState, 4), [set(animationState, 0)])
      ),
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
      ...(onPress
        ? [
            onChange(
              gestureState,
              cond(
                eq(gestureState, 5),
                call([], () => {
                  if (onLongPress && !longPressHandle.current) {
                    // assuming we've made long press
                    return;
                  }
                  if (enableHapticFeedback) {
                    ReactNativeHapticFeedback.trigger(hapticType);
                  }
                  onPress();
                })
              )
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
      onHandlerStateChange={onGestureEvent}
      enabled={!disabled}
    >
      <Animated.View
        onLayout={onLayout}
        accessible
        style={[
          style,
          {
            opacity: scaleValue.interpolate({
              inputRange: [scaleTo, 1],
              outputRange: [activeOpacity, 1],
            }),
            transform: transformOriginUtil(offsetX, offsetY, {
              scale,
            }),
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
  hapticType: PropTypes.oneOf(Object.keys(HapticFeedbackTypes)),
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
  duration: 200,
  easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
  enableHapticFeedback: true,
  hapticType: HapticFeedbackTypes.selection,
  minLongPressDuration: 500,
  scaleTo: animations.keyframes.button.to.scale,
};
