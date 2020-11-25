import React, { useRef } from 'react';
import { processColor, View } from 'react-native';
import {
  createNativeWrapper,
  PureNativeButton,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const AnimatedRawButton = createNativeWrapper(
  Animated.createAnimatedComponent(PureNativeButton),
  {
    shouldActivateOnStart: true,
    shouldCancelWhenOutside: true,
  }
);

const OVERFLOW_MARGIN = 25;

const ScaleButton = ({
  duration,
  scaleTo,
  children,
  onPress,
  onLongPress,
  contentContainerStyle,
  minLongPressDuration,
}) => {
  const longPressTimer = useRef(false);
  const isPressEventLegal = useRef(false);
  const scale = useSharedValue(1);
  const hasScaledDown = useSharedValue(0);
  const sz = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withTiming(scale.value, { duration }),
        },
      ],
    };
  });

  const handleStartPress = () => {
    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = null;
      onLongPress?.();
    }, minLongPressDuration);
    isPressEventLegal.current = true;
  };
  const handlerPress = () => {
    clearTimeout(longPressTimer.current);
    if (longPressTimer.current) {
      onPress();
      longPressTimer.current = null;
    }
  };

  const handleCancel = () => {
    clearTimeout(longPressTimer.current);
    isPressEventLegal.current = false;
  };

  const gestureHandler = useAnimatedGestureHandler({
    onActive: () => {
      runOnJS(handleStartPress)();
      if (hasScaledDown.value === 0) {
        scale.value = scaleTo;
      }
      hasScaledDown.value = 1;
    },
    onCancel: () => {
      scale.value = 1;
      hasScaledDown.value = 0;
      runOnJS(handleCancel)();
    },
    onEnd: () => {
      hasScaledDown.value = 0;
      scale.value = 1;
      runOnJS(handlerPress)();
    },
    onFail: () => {
      runOnJS(handleCancel)();
    },
  });

  return (
    <View style={{ overflow: 'visible' }}>
      <View style={{ margin: -OVERFLOW_MARGIN }}>
        <AnimatedRawButton
          hitSlop={-OVERFLOW_MARGIN + 10}
          onGestureEvent={gestureHandler}
          rippleColor={processColor('transparent')}
          style={{ overflow: 'hidden' }}
        >
          <View style={{ backgroundColor: 'transparent' }}>
            <View style={{ padding: OVERFLOW_MARGIN }}>
              <Animated.View style={[sz, contentContainerStyle]}>
                {children}
              </Animated.View>
            </View>
          </View>
        </AnimatedRawButton>
      </View>
    </View>
  );
};

export default function ButtonPressAnimation({
  // eslint-disable-next-line no-unused-vars
  activeOpacity = 1, // TODO
  children,
  disabled,
  duration = 160,
  onLongPress,
  onPress,
  onPressStart,
  style,
  minLongPressDuration = 500,
  testID,
  scaleTo = 0.86,
}) {
  if (disabled) {
    return <View style={[style, { overflow: 'visible' }]}>{children}</View>;
  }

  return (
    <ScaleButton
      duration={duration}
      minLongPressDuration={minLongPressDuration}
      onLongPress={onLongPress}
      onPress={onPress}
      onPressStart={onPressStart}
      scaleTo={scaleTo}
      testID={testID}
    >
      <View pointerEvents="box-only" style={[style, { overflow: 'visible' }]}>
        {children}
      </View>
    </ScaleButton>
  );
}
