import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { processColor, requireNativeComponent, View } from 'react-native';
import { createNativeWrapper } from 'react-native-gesture-handler';
import { PureNativeButton } from 'react-native-gesture-handler/src/components/GestureButtons';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import styled from 'styled-components';
import { normalizeTransformOrigin } from './NativeButton';
import { useLongPressEvents } from '@rainbow-me/hooks';

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

const Content = styled.View`
  overflow: visible;
`;

// I managed to implement partially overflow in scale button (up to 5px),
// but overflow is not visible beyond small boundaries. Hence, to make it reactive to touches
// I couldn't just expend boundaries, because then it intercepts touches, so I managed to
// extract animated component to external value

export const ScaleButtonZoomable = ({ children, style, duration = 160 }) => {
  const scale = useSharedValue(1);
  const scaleTraversed = useDerivedValue(() => {
    const value = withTiming(scale.value, {
      duration,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    return value;
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

  return (
    <ScaleButtonContext.Provider value={scale}>
      <Animated.View style={[style, sz]}>{children}</Animated.View>
    </ScaleButtonContext.Provider>
  );
};

const ScaleButton = ({
  children,
  contentContainerStyle,
  duration,
  minLongPressDuration,
  onLongPress,
  onPress,
  overflowMargin,
  scaleTo,
  wrapperStyle,
  onPressStart,
  onPressCancel,
}) => {
  const parentScale = useContext(ScaleButtonContext);
  const childScale = useSharedValue(1);
  const scale = parentScale || childScale;
  const hasScaledDown = useSharedValue(0);
  const scaleTraversed = useDerivedValue(() => {
    const value = withTiming(scale.value, {
      duration,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    if (parentScale) {
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

  const { handleCancel, handlePress, handleStartPress } = useLongPressEvents({
    minLongPressDuration,
    onLongPress,
    onPress,
    onPressCancel,
    onPressStart,
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
  children,
  contentContainerStyle,
  duration,
  minLongPressDuration,
  onLongPress,
  onPress,
  overflowMargin,
  scaleTo,
  skipTopMargin,
  transformOrigin,
  wrapperStyle,
}) => {
  const onNativePress = useCallback(
    ({ nativeEvent: { type } }) => {
      if (type === 'longPress') {
        onLongPress?.();
      } else {
        onPress?.();
      }
    },
    [onLongPress, onPress]
  );

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
  contentContainerStyle,
  disabled,
  duration = 160,
  hitSlop,
  minLongPressDuration = 500,
  onLongPress,
  onPress,
  onPressStart,
  overflowMargin = OVERFLOW_MARGIN,
  reanimatedButton,
  scaleTo = 0.86,
  skipTopMargin,
  style,
  testID,
  transformOrigin,
  wrapperStyle,
  onPressCancel,
}) {
  const normalizedTransformOrigin = useMemo(
    () => normalizeTransformOrigin(transformOrigin),
    [transformOrigin]
  );

  const ButtonElement = reanimatedButton ? ScaleButton : SimpleScaleButton;
  return disabled ? (
    <Content style={style}>{children}</Content>
  ) : (
    <ButtonElement
      backgroundColor={backgroundColor}
      borderRadius={borderRadius}
      contentContainerStyle={contentContainerStyle}
      duration={duration}
      hitSlop={hitSlop}
      minLongPressDuration={minLongPressDuration}
      onLongPress={onLongPress}
      onPress={onPress}
      onPressCancel={onPressCancel}
      onPressStart={onPressStart}
      overflowMargin={overflowMargin}
      scaleTo={scaleTo}
      skipTopMargin={skipTopMargin}
      testID={testID}
      transformOrigin={normalizedTransformOrigin}
      wrapperStyle={wrapperStyle}
    >
      <Content pointerEvents="box-only" style={style}>
        {children}
      </Content>
    </ButtonElement>
  );
}
