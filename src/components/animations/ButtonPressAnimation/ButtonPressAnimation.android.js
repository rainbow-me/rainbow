import React, { createContext, useContext, useRef } from 'react';
import { processColor, View } from 'react-native';
import {
  createNativeWrapper,
  PureNativeButton,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useDerivedValue,
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

const OVERFLOW_MARGIN = 5;

const ScaleButtonContext = createContext(null);

// I managed to implement partially overflow in scale button (up to 5px),
// but overflow is not visible beyond small boundaries. Hence, to make it reactive to touches
// I couldn't just expend boundaries, because then it intercepts touches, so I managed to
// extract animated component to external value

export const ScaleButtonZoomable = ({ children, style }) => {
  const value = useSharedValue(1);
  const sz = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: value.value,
        },
      ],
    };
  });

  return (
    <ScaleButtonContext.Provider value={value}>
      <Animated.View style={[style, sz]}>{children}</Animated.View>
    </ScaleButtonContext.Provider>
  );
};

const ScaleButton = ({
  duration,
  scaleTo,
  children,
  onPress,
  onLongPress,
  contentContainerStyle,
  minLongPressDuration,
  overflowMargin,
  wrapperStyle,
}) => {
  const longPressTimer = useRef(false);
  const isPressEventLegal = useRef(false);
  const scale = useSharedValue(1);
  const hasScaledDown = useSharedValue(0);
  const parentValue = useContext(ScaleButtonContext);
  const scaleTraversed = useDerivedValue(() => {
    const value = withTiming(scale.value, { duration });
    if (parentValue) {
      parentValue.value = value;
      return 1;
    } else {
      return value;
    }
  });
  const sz = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: scaleTraversed.value,
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
    <View style={[{ overflow: 'visible' }, wrapperStyle]}>
      <View style={{ margin: -overflowMargin }}>
        <AnimatedRawButton
          hitSlop={-overflowMargin}
          onGestureEvent={gestureHandler}
          rippleColor={processColor('transparent')}
          style={{ overflow: 'visible' }}
        >
          <View style={{ backgroundColor: 'transparent' }}>
            <View style={{ padding: overflowMargin }}>
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
  contentContainerStyle,
  overflowMargin = OVERFLOW_MARGIN,
  hitSlop,
  wrapperStyle,
}) {
  if (disabled) {
    return <View style={[style, { overflow: 'visible' }]}>{children}</View>;
  }

  return (
    <ScaleButton
      contentContainerStyle={contentContainerStyle}
      duration={duration}
      hitSlop={hitSlop}
      minLongPressDuration={minLongPressDuration}
      onLongPress={onLongPress}
      onPress={onPress}
      onPressStart={onPressStart}
      overflowMargin={overflowMargin}
      scaleTo={scaleTo}
      testID={testID}
      wrapperStyle={wrapperStyle}
    >
      <View pointerEvents="box-only" style={[style, { overflow: 'visible' }]}>
        {children}
      </View>
    </ScaleButton>
  );
}
