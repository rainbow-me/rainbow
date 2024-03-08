/* eslint-disable react/no-unused-prop-types */
/* 👆 Had to disable this ESLint rule it was false positive on shared Props interface */
import React, { useState, PropsWithChildren, useCallback, useContext, useMemo } from 'react';
import { processColor, requireNativeComponent, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { createNativeWrapper, NativeViewGestureHandlerGestureEvent, RawButtonProps } from 'react-native-gesture-handler';
import { PureNativeButton } from 'react-native-gesture-handler/src/components/GestureButtons';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Animated, {
  AnimatedProps,
  Easing,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { normalizeTransformOrigin } from './NativeButton';
import { ScaleButtonContext } from './ScaleButtonZoomable';
import { BaseButtonAnimationProps } from './types';
import { HapticFeedbackType } from '@/utils/haptics';
import { useLongPressEvents } from '@/hooks';

interface BaseProps extends BaseButtonAnimationProps {
  backgroundColor: string;
  borderRadius: number;
  contentContainerStyle: StyleProp<ViewStyle>;
  isLongPress?: boolean;
  onLongPressEnded: () => void;
  overflowMargin: number;
  reanimatedButton?: boolean;
  shouldLongPressHoldPress?: boolean;
  skipTopMargin?: boolean;
  wrapperStyle: StyleProp<ViewStyle>;
  hapticType: HapticFeedbackType;
  enableHapticFeedback: boolean;
  disallowInterruption?: boolean;
}

type Props = PropsWithChildren<BaseProps>;

const ZoomableRawButton = requireNativeComponent<
  Omit<
    Props,
    'contentContainerStyle' | 'overflowMargin' | 'backgroundColor' | 'borderRadius' | 'onLongPressEnded' | 'wrapperStyle' | 'onLongPress'
  > &
    Pick<RawButtonProps, 'rippleColor'>
>('RNZoomableButton');

const ZoomableButton = createNativeWrapper(ZoomableRawButton);

const AnimatedRawButton = createNativeWrapper<AnimatedProps<PropsWithChildren<RawButtonProps>>>(
  Animated.createAnimatedComponent(PureNativeButton),
  {
    shouldActivateOnStart: true,
    shouldCancelWhenOutside: true,
  }
);

const OVERFLOW_MARGIN = 5;

const transparentColor = processColor('transparent');

const ScaleButton = ({
  children,
  contentContainerStyle,
  duration,
  minLongPressDuration,
  onLongPress,
  onPress,
  overflowMargin,
  scaleTo = 0.86,
  wrapperStyle,
  testID,
}: PropsWithChildren<Props>) => {
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
  });

  const gestureHandler = useAnimatedGestureHandler<NativeViewGestureHandlerGestureEvent>({
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
    <View style={[sx.overflow, wrapperStyle]} testID={testID}>
      <View style={{ margin: -overflowMargin }}>
        <AnimatedRawButton hitSlop={-overflowMargin} onGestureEvent={gestureHandler} rippleColor={transparentColor}>
          <View style={sx.transparentBackground}>
            <View style={{ padding: overflowMargin }}>
              <Animated.View style={[sz, contentContainerStyle]}>{children}</Animated.View>
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
  shouldLongPressHoldPress,
  isLongPress,
  onLayout,
  hapticType,
  enableHapticFeedback,
  onPress,
  overflowMargin,
  scaleTo,
  skipTopMargin,
  transformOrigin,
  wrapperStyle,
  testID,
  disallowInterruption,
}: Props) => {
  const onNativePress = useCallback(
    ({ nativeEvent: { type } }: any) => {
      if (type === 'longPress') {
        onLongPress?.();
      } else if (shouldLongPressHoldPress && type === 'longPressEnded') {
        onLongPressEnded?.();
      } else {
        enableHapticFeedback && ReactNativeHapticFeedback.trigger(hapticType);
        onPress?.();
      }
    },
    [enableHapticFeedback, hapticType, onLongPress, onLongPressEnded, onPress, shouldLongPressHoldPress]
  );

  // we won't guess if there are any animated styles in there but we can
  // not render the Animated.View if we don't use that prop at all
  const Wrapper: React.ComponentType<any> = contentContainerStyle ? Animated.View : View;
  // hack to lay out BottomTab buttons normally instead of being stacked on top of each other
  const [overflowMarginHelper, setOverflowMargin] = useState(overflowMargin);
  const layoutHelper = () => setOverflowMargin(overflowMargin - 1);
  return (
    <View
      onLayout={onLayout || layoutHelper}
      style={[
        {
          backgroundColor,
          borderRadius,
          overflow: 'visible',
        },
        wrapperStyle,
      ]}
      testID={testID}
    >
      <View
        style={{
          margin: -overflowMarginHelper,
          marginTop: skipTopMargin ? -OVERFLOW_MARGIN : -overflowMargin,
        }}
      >
        <ZoomableButton
          duration={duration}
          enableHapticFeedback={enableHapticFeedback}
          hapticType={hapticType}
          hitSlop={-overflowMargin}
          isLongPress={isLongPress}
          minLongPressDuration={minLongPressDuration}
          onPress={onNativePress}
          rippleColor={transparentColor}
          scaleTo={scaleTo}
          shouldLongPressHoldPress={shouldLongPressHoldPress}
          style={sx.overflow}
          transformOrigin={transformOrigin}
          disallowInterruption={disallowInterruption}
        >
          <View style={sx.transparentBackground}>
            <View
              style={{
                padding: overflowMargin,
                paddingTop: skipTopMargin ? OVERFLOW_MARGIN : overflowMargin,
              }}
            >
              <Wrapper style={contentContainerStyle}>{children}</Wrapper>
            </View>
          </View>
        </ZoomableButton>
      </View>
    </View>
  );
};
export default function ButtonPressAnimation({
  backgroundColor = 'transparent',
  borderRadius = 0,
  children,
  contentContainerStyle,
  disabled,
  duration = 160,
  minLongPressDuration = 500,
  onLayout,
  onLongPress,
  onLongPressEnded,
  shouldLongPressHoldPress,
  onPress,
  overflowMargin = OVERFLOW_MARGIN,
  reanimatedButton,
  scaleTo = 0.86,
  skipTopMargin,
  style,
  testID,
  transformOrigin,
  wrapperStyle,
  hapticType = 'selection',
  enableHapticFeedback = true,
  disallowInterruption = false,
}: Props) {
  const normalizedTransformOrigin = useMemo(() => normalizeTransformOrigin(transformOrigin), [transformOrigin]);

  const ButtonElement = reanimatedButton ? ScaleButton : SimpleScaleButton;
  return disabled ? (
    <View onLayout={onLayout} style={[sx.overflow, style]}>
      {children}
    </View>
  ) : (
    <ButtonElement
      backgroundColor={backgroundColor}
      borderRadius={borderRadius}
      contentContainerStyle={contentContainerStyle}
      duration={duration}
      enableHapticFeedback={enableHapticFeedback}
      hapticType={hapticType}
      isLongPress={!!onLongPress}
      minLongPressDuration={minLongPressDuration}
      onLayout={onLayout}
      onLongPress={onLongPress}
      onLongPressEnded={onLongPressEnded}
      onPress={onPress}
      overflowMargin={overflowMargin}
      scaleTo={scaleTo}
      shouldLongPressHoldPress={shouldLongPressHoldPress}
      skipTopMargin={skipTopMargin}
      testID={testID}
      transformOrigin={normalizedTransformOrigin}
      wrapperStyle={wrapperStyle}
      disallowInterruption={disallowInterruption}
    >
      <View pointerEvents="box-only" style={[sx.overflow, style]}>
        {children}
      </View>
    </ButtonElement>
  );
}

const sx = StyleSheet.create({
  overflow: {
    overflow: 'visible',
  },
  transparentBackground: {
    backgroundColor: 'transparent',
  },
});
