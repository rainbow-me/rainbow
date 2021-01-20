import React, { createContext, useContext, useMemo, useRef } from 'react';
import { processColor, requireNativeComponent, View } from 'react-native';
import {
  createNativeWrapper,
  PureNativeButton,
} from 'react-native-gesture-handler';
import Animated, {
  NewEasing as Easing,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { normalizeTransformOrigin } from './NativeButton';

const ZoomableRawButton = requireNativeComponent('RNZoomableButton');

const ZoomableButton = createNativeWrapper(ZoomableRawButton);

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

const useLongPress = ({ onPress, onLongPress, minLongPressDuration }) => {
  const longPressTimer = useRef(null);
  const isPressEventLegal = useRef(false);

  const handleStartPress = () => {
    if (longPressTimer.current == null) {
      longPressTimer.current = setTimeout(() => {
        longPressTimer.current = null;
        onLongPress?.();
      }, minLongPressDuration);
    }

    isPressEventLegal.current = true;
  };
  const handlePress = () => {
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

  return {
    handleCancel,
    handlePress,
    handleStartPress,
  };
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
  const scale = useSharedValue(1);
  const hasScaledDown = useSharedValue(0);
  const parentValue = useContext(ScaleButtonContext);
  const scaleTraversed = useDerivedValue(() => {
    const value = withTiming(scale.value, {
      duration,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
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

  const { handleCancel, handlePress, handleStartPress } = useLongPress({
    minLongPressDuration,
    onLongPress,
    onPress,
  });

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
      runOnJS(handlePress)();
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

const SimpleScaleButton = ({
  backgroundColor,
  borderRadius,
  scaleTo,
  children,
  onPress,
  onLongPress,
  contentContainerStyle,
  minLongPressDuration,
  overflowMargin,
  wrapperStyle,
  duration,
  transformOrigin,
  skipTopMargin,
}) => {
  const onNativePress = ({ nativeEvent: { type } }) => {
    if (type === 'longPress') {
      onLongPress?.();
    } else {
      onPress();
    }
  };

  return (
    <View
      style={[
        {
          backgroundColor,
          borderRadius,
          overflow: 'visible',
        },
        wrapperStyle,
      ]}
    >
      <View
        style={{
          margin: -overflowMargin,
          marginTop: skipTopMargin ? -OVERFLOW_MARGIN : -overflowMargin,
        }}
      >
        <ZoomableButton
          duration={duration}
          hitSlop={-overflowMargin}
          minLongPressDuration={minLongPressDuration}
          onPress={onNativePress}
          rippleColor={processColor('transparent')}
          scaleTo={scaleTo}
          style={{ overflow: 'visible' }}
          transformOrigin={transformOrigin}
        >
          <View style={{ backgroundColor: 'transparent' }}>
            <View
              style={{
                padding: overflowMargin,
                paddingTop: skipTopMargin ? OVERFLOW_MARGIN : overflowMargin,
              }}
            >
              <Animated.View style={contentContainerStyle}>
                {children}
              </Animated.View>
            </View>
          </View>
        </ZoomableButton>
      </View>
    </View>
  );
};

export default function ButtonPressAnimation({
  // eslint-disable-next-line no-unused-vars
  activeOpacity = 1, // TODO
  backgroundColor = 'transparent',
  borderRadius = 0,
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
  reanimatedButton,
  transformOrigin,
  skipTopMargin,
}) {
  const normalizedTransformOrigin = useMemo(
    () => normalizeTransformOrigin(transformOrigin),
    [transformOrigin]
  );

  if (disabled) {
    return <View style={[style, { overflow: 'visible' }]}>{children}</View>;
  }

  const Button = reanimatedButton ? ScaleButton : SimpleScaleButton;

  return (
    <Button
      backgroundColor={backgroundColor}
      borderRadius={borderRadius}
      contentContainerStyle={contentContainerStyle}
      duration={duration}
      hitSlop={hitSlop}
      minLongPressDuration={minLongPressDuration}
      onLongPress={onLongPress}
      onPress={onPress}
      onPressStart={onPressStart}
      overflowMargin={overflowMargin}
      scaleTo={scaleTo}
      skipTopMargin={skipTopMargin}
      testID={testID}
      transformOrigin={normalizedTransformOrigin}
      wrapperStyle={wrapperStyle}
    >
      <View pointerEvents="box-only" style={[style, { overflow: 'visible' }]}>
        {children}
      </View>
    </Button>
  );
}
