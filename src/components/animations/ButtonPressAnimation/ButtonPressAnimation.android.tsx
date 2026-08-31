import React, { forwardRef, useCallback } from 'react';
import { processColor, requireNativeComponent, StyleSheet, View } from 'react-native';

import {
  legacy_createNativeWrapper as createNativeWrapper,
  type LegacyRawButtonProps as RawButtonProps,
} from 'react-native-gesture-handler';
import { triggerHaptics } from 'react-native-turbo-haptics';

import { normalizeTransformOrigin } from './normalizeTransformOrigin';
import { type ButtonPressAnimationProps } from './types';

interface ButtonElementProps extends ButtonPressAnimationProps {
  isLongPress?: boolean;
}

interface ZoomableButtonPressEvent {
  nativeEvent: { type: 'longPress' | 'longPressEnded' | 'press' };
}

type ButtonElementPropsWithDefaults = ButtonElementProps &
  Required<
    Pick<
      ButtonElementProps,
      'duration' | 'minLongPressDuration' | 'scaleTo' | 'hapticType' | 'enableHapticFeedback' | 'disallowInterruption'
    >
  >;

const ZoomableRawButton = requireNativeComponent<
  Omit<
    ButtonElementProps,
    | 'contentContainerStyle'
    | 'overflowMargin'
    | 'backgroundColor'
    | 'borderRadius'
    | 'onLongPressEnded'
    | 'wrapperStyle'
    | 'onLongPress'
    | 'onPress'
  > &
    Pick<RawButtonProps, 'rippleColor'> & {
      onPress?: (event: ZoomableButtonPressEvent) => void;
    }
>('RNZoomableButton');

const ZoomableButton = createNativeWrapper(ZoomableRawButton);
type ZoomableButtonRef = React.ComponentRef<typeof ZoomableButton>;

const transparentColor = processColor('transparent');

const SimpleScaleButton = forwardRef<ZoomableButtonRef, ButtonElementPropsWithDefaults>(function SimpleScaleButton(
  {
    children,
    duration,
    exclusive,
    minLongPressDuration,
    onLongPress,
    onLongPressEnded,
    shouldActivateOnStart,
    shouldLongPressHoldPress,
    isLongPress,
    hapticType,
    enableHapticFeedback,
    onPress,
    scaleTo,
    transformOrigin,
    wrapperStyle,
    testID,
    disallowInterruption,
  }: ButtonElementPropsWithDefaults,
  ref
) {
  const onNativePress = useCallback(
    ({ nativeEvent: { type } }: ZoomableButtonPressEvent) => {
      if (type === 'longPress') {
        onLongPress?.();
      } else if (shouldLongPressHoldPress && type === 'longPressEnded') {
        onLongPressEnded?.();
      } else {
        onPress?.();
        enableHapticFeedback && triggerHaptics(hapticType);
      }
    },
    [enableHapticFeedback, hapticType, onLongPress, onLongPressEnded, onPress, shouldLongPressHoldPress]
  );

  return (
    <ZoomableButton
      duration={duration}
      exclusive={exclusive}
      isLongPress={isLongPress}
      minLongPressDuration={minLongPressDuration}
      onPress={onNativePress}
      scaleTo={scaleTo}
      rippleColor={transparentColor}
      shouldActivateOnStart={shouldActivateOnStart}
      shouldLongPressHoldPress={shouldLongPressHoldPress}
      style={[sx.overflow, wrapperStyle]}
      testID={testID}
      transformOrigin={transformOrigin}
      disallowInterruption={disallowInterruption}
      ref={ref}
    >
      {children}
    </ZoomableButton>
  );
});

export default forwardRef<ZoomableButtonRef, ButtonElementProps>(function ButtonPressAnimation(
  {
    children,
    disabled,
    duration = 160,
    exclusive,
    minLongPressDuration = 500,
    onLayout,
    onLongPress,
    onLongPressEnded,
    shouldLongPressHoldPress,
    onPress,
    scaleTo = 0.86,
    style,
    testID,
    transformOrigin,
    wrapperStyle,
    hapticType = 'selection',
    enableHapticFeedback = true,
    disallowInterruption = false,
    shouldActivateOnStart,
  }: ButtonElementProps,
  ref
) {
  return disabled ? (
    <View onLayout={onLayout} style={[sx.overflow, style]} ref={ref}>
      {children}
    </View>
  ) : (
    <SimpleScaleButton
      duration={duration}
      enableHapticFeedback={enableHapticFeedback}
      exclusive={exclusive}
      hapticType={hapticType}
      isLongPress={!!onLongPress}
      minLongPressDuration={minLongPressDuration}
      onLongPress={onLongPress}
      onLongPressEnded={onLongPressEnded}
      onPress={onPress}
      scaleTo={scaleTo}
      shouldActivateOnStart={shouldActivateOnStart}
      shouldLongPressHoldPress={shouldLongPressHoldPress}
      testID={testID}
      transformOrigin={normalizeTransformOrigin(transformOrigin)}
      wrapperStyle={wrapperStyle}
      disallowInterruption={disallowInterruption}
      ref={ref}
    >
      <View onLayout={onLayout} pointerEvents="box-only" style={[sx.overflow, style]}>
        {children}
      </View>
    </SimpleScaleButton>
  );
});

const sx = StyleSheet.create({
  overflow: {
    overflow: 'visible',
  },
});
