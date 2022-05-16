/* eslint-disable react/no-unused-prop-types */
/* 👆 Had to disable this ESLint rule it was false positive on shared Props interface */
import React, {
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import {
  LayoutChangeEvent,
  NativeSyntheticEvent,
  NativeTouchEvent,
  processColor,
  requireNativeComponent,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import {
  createNativeWrapper,
  NativeViewGestureHandlerGestureEvent,
  RawButtonProps,
} from 'react-native-gesture-handler';
import { PureNativeButton } from 'react-native-gesture-handler/src/components/GestureButtons';
import Animated, {
  AnimateProps,
  Easing,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { normalizeTransformOrigin } from './NativeButton';
import { ScaleButtonContext } from './ScaleButtonZoomable.android';
import { TransformOrigin } from './types';
import { useLongPressEvents } from '@rainbow-me/hooks';
import styled from '@rainbow-me/styled-components';

interface ZoomableButtonProps extends RawButtonProps {
  minLongPressDuration: number;
  scaleTo: number;
  isLongPress?: boolean;
  shouldLongPressHoldPress?: boolean;
  duration: number;
  transformOrigin?: TransformOrigin;
  onPress: (event: NativeSyntheticEvent<NativeTouchEvent>) => void;
  style: StyleProp<ViewStyle>;
}

const ZoomableRawButton = requireNativeComponent<
  PropsWithChildren<ZoomableButtonProps>
>('RNZoomableButton');

const ZoomableButton = createNativeWrapper(ZoomableRawButton);

const AnimatedRawButton = createNativeWrapper<
  AnimateProps<PropsWithChildren<RawButtonProps>>
>(Animated.createAnimatedComponent(PureNativeButton), {
  shouldActivateOnStart: true,
  shouldCancelWhenOutside: true,
});

const OVERFLOW_MARGIN = 5;

// @ts-expect-error Property 'View' does not exist on type...
const Content = styled.View({
  overflow: 'visible',
});

interface OwnButtonElementProps {
  contentContainerStyle: StyleProp<ViewStyle>;
  duration: number;
  minLongPressDuration: number;
  onLongPress: () => void;
  onPress: () => void;
  overflowMargin: number;
  scaleTo: number;
  wrapperStyle: StyleProp<ViewStyle>;
  backgroundColor: string;
  borderRadius: number;
  onLongPressEnded: () => void;
  shouldLongPressHoldPress?: boolean;
  isLongPress?: boolean;
  onLayout: (event: LayoutChangeEvent) => void;
  skipTopMargin?: boolean;
  transformOrigin?: TransformOrigin;
  testID?: string;
}

type ButtonElementProps = PropsWithChildren<
  OwnButtonElementProps & Pick<RawButtonProps, 'hitSlop'>
>;

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
}: ButtonElementProps) => {
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

  const gestureHandler = useAnimatedGestureHandler<NativeViewGestureHandlerGestureEvent>(
    {
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
    }
  );

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
  onLongPressEnded,
  shouldLongPressHoldPress,
  isLongPress,
  onLayout,
  onPress,
  overflowMargin,
  scaleTo,
  skipTopMargin,
  transformOrigin,
  wrapperStyle,
}: ButtonElementProps) => {
  const onNativePress = useCallback(
    ({ nativeEvent: { type } }) => {
      if (type === 'longPress') {
        onLongPress?.();
      } else if (shouldLongPressHoldPress && type === 'longPressEnded') {
        onLongPressEnded?.();
      } else {
        onPress?.();
      }
    },
    [onLongPress, onLongPressEnded, onPress, shouldLongPressHoldPress]
  );

  return (
    <View
      onLayout={onLayout}
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
          isLongPress={isLongPress}
          minLongPressDuration={minLongPressDuration}
          onPress={onNativePress}
          rippleColor={processColor('transparent')}
          scaleTo={scaleTo}
          shouldLongPressHoldPress={shouldLongPressHoldPress}
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

type Props = PropsWithChildren<
  {
    disabled?: boolean;
    reanimatedButton?: boolean;
    activeOpacity?: number;
  } & ButtonElementProps &
    Pick<ZoomableButtonProps, 'hitSlop' | 'transformOrigin' | 'style'>
>;

export default function ButtonPressAnimation({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  activeOpacity = 1, // TODO
  backgroundColor = 'transparent',
  borderRadius = 0,
  children,
  contentContainerStyle,
  disabled,
  duration = 160,
  hitSlop,
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
}: Props) {
  const normalizedTransformOrigin = useMemo(
    () => normalizeTransformOrigin(transformOrigin),
    [transformOrigin]
  );

  const ButtonElement = reanimatedButton ? ScaleButton : SimpleScaleButton;
  return disabled ? (
    <Content onLayout={onLayout} style={style}>
      {children}
    </Content>
  ) : (
    <ButtonElement
      backgroundColor={backgroundColor}
      borderRadius={borderRadius}
      contentContainerStyle={contentContainerStyle}
      duration={duration}
      hitSlop={hitSlop}
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
    >
      <Content pointerEvents="box-only" style={style}>
        {children}
      </Content>
    </ButtonElement>
  );
}
