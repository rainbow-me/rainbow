import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { processColor, requireNativeComponent, View } from 'react-native';
import { createNativeWrapper } from 'react-native-gesture-handler';
// @ts-expect-error ts-migrate(6142) FIXME: Module 'react-native-gesture-handler/src/component... Remove this comment to see the full error message
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
// @ts-expect-error ts-migrate(6142) FIXME: Module './NativeButton' was resolved to '/Users/ni... Remove this comment to see the full error message
import { normalizeTransformOrigin } from './NativeButton';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
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

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const Content = styled.View`
  overflow: visible;
`;

// I managed to implement partially overflow in scale button (up to 5px),
// but overflow is not visible beyond small boundaries. Hence, to make it reactive to touches
// I couldn't just expend boundaries, because then it intercepts touches, so I managed to
// extract animated component to external value

export const ScaleButtonZoomable = ({
  children,
  style,
  duration = 160,
}: any) => {
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ScaleButtonContext.Provider value={scale}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
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
}: any) => {
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <View style={[{ overflow: 'visible' }, wrapperStyle]}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <View style={{ margin: -overflowMargin }}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <AnimatedRawButton
          hitSlop={-overflowMargin}
          // @ts-expect-error ts-migrate(2322) FIXME: Type 'OnGestureEvent<PanGestureHandlerGestureEvent... Remove this comment to see the full error message
          onGestureEvent={gestureHandler}
          rippleColor={processColor('transparent')}
          style={{ overflow: 'visible' }}
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <View style={{ backgroundColor: 'transparent' }}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <View style={{ padding: overflowMargin }}>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
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
  onLongPressEnded,
  shouldLongPressEndPress,
  onPress,
  overflowMargin,
  scaleTo,
  skipTopMargin,
  transformOrigin,
  wrapperStyle,
}: any) => {
  const onNativePress = useCallback(
    ({ nativeEvent: { type } }) => {
      if (type === 'longPress') {
        onLongPress?.();
      } else if (shouldLongPressEndPress && type === 'longPressEnded') {
        onLongPressEnded?.();
      } else {
        onPress?.();
      }
    },
    [onLongPress, onLongPressEnded, onPress, shouldLongPressEndPress]
  );

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <View
        style={{
          margin: -overflowMargin,
          marginTop: skipTopMargin ? -OVERFLOW_MARGIN : -overflowMargin,
        }}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
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
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <View style={{ backgroundColor: 'transparent' }}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <View
              style={{
                padding: overflowMargin,
                paddingTop: skipTopMargin ? OVERFLOW_MARGIN : overflowMargin,
              }}
            >
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
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
  // TODO
  activeOpacity = 1,

  backgroundColor = 'transparent',
  borderRadius = 0,
  children,
  contentContainerStyle,
  disabled,
  duration = 160,
  hitSlop,
  minLongPressDuration = 500,
  onLongPress,
  onLongPressEnded,
  shouldLongPressEndPress,
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
}: any) {
  const normalizedTransformOrigin = useMemo(
    () => normalizeTransformOrigin(transformOrigin),
    [transformOrigin]
  );

  const ButtonElement = reanimatedButton ? ScaleButton : SimpleScaleButton;
  return disabled ? (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Content style={style}>{children}</Content>
  ) : (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ButtonElement
      backgroundColor={backgroundColor}
      borderRadius={borderRadius}
      contentContainerStyle={contentContainerStyle}
      duration={duration}
      hitSlop={hitSlop}
      minLongPressDuration={minLongPressDuration}
      onLongPress={onLongPress}
      onLongPressEnded={onLongPressEnded}
      onPress={onPress}
      onPressCancel={onPressCancel}
      onPressStart={onPressStart}
      overflowMargin={overflowMargin}
      scaleTo={scaleTo}
      shouldLongPressEndPress={shouldLongPressEndPress}
      skipTopMargin={skipTopMargin}
      testID={testID}
      transformOrigin={normalizedTransformOrigin}
      wrapperStyle={wrapperStyle}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Content pointerEvents="box-only" style={style}>
        {children}
      </Content>
    </ButtonElement>
  );
}
