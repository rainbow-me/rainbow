import React, { forwardRef, useCallback, useMemo } from 'react';
import { processColor, requireNativeComponent, StyleSheet, View } from 'react-native';

import { createNativeWrapper, type RawButtonProps } from 'react-native-gesture-handler';
import { triggerHaptics } from 'react-native-turbo-haptics';

import { normalizeTransformOrigin } from './NativeButton';
import { type ButtonPressAnimationProps } from './types';

interface ButtonElementProps extends ButtonPressAnimationProps {
  isLongPress?: boolean;
}

interface ZoomableButtonPressEvent {
  nativeEvent: { type: 'longPress' | 'longPressEnded' | 'press' | 'pressStart' };
}

type ButtonElementPropsWithDefaults = ButtonElementProps &
  Required<
    Pick<
      ButtonElementProps,
      'duration' | 'minLongPressDuration' | 'scaleTo' | 'hapticType' | 'enableHapticFeedback' | 'disallowInterruption'
    >
  >;

const ZoomableRawButton = requireNativeComponent<
  Pick<
    ButtonElementProps,
    | 'children'
    | 'disallowInterruption'
    | 'duration'
    | 'exclusive'
    | 'isLongPress'
    | 'minLongPressDuration'
    | 'scaleTo'
    | 'shouldActivateOnStart'
    | 'shouldLongPressHoldPress'
    | 'style'
    | 'testID'
    | 'transformOrigin'
  > &
    Pick<RawButtonProps, 'rippleColor'> & {
      hasPressStartHandler?: boolean;
      onPress?: (event: ZoomableButtonPressEvent) => void;
    }
>('RNZoomableButton');

const ZoomableButton = createNativeWrapper(ZoomableRawButton);
type ZoomableButtonRef = React.ComponentRef<typeof ZoomableButton>;

const transparentColor = processColor('transparent');

const NativeScaleButton = forwardRef<ZoomableButtonRef, ButtonElementPropsWithDefaults>(function NativeScaleButton(
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
    onPressStart,
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
      switch (type) {
        case 'pressStart':
          onPressStart?.();
          break;
        case 'longPress':
          onLongPress?.();
          break;
        case 'longPressEnded':
          onLongPressEnded?.();
          break;
        case 'press':
          onPress?.();
          enableHapticFeedback && triggerHaptics(hapticType);
          break;
      }
    },
    [enableHapticFeedback, hapticType, onLongPress, onLongPressEnded, onPress, onPressStart]
  );

  return (
    <ZoomableButton
      duration={duration}
      exclusive={exclusive}
      hasPressStartHandler={!!onPressStart}
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
    onPressStart,
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
  const normalizedTransformOrigin = useMemo(() => normalizeTransformOrigin(transformOrigin), [transformOrigin]);

  return disabled ? (
    <View onLayout={onLayout} style={[sx.overflow, style]} ref={ref}>
      {children}
    </View>
  ) : (
    <NativeScaleButton
      duration={duration}
      enableHapticFeedback={enableHapticFeedback}
      exclusive={exclusive}
      hapticType={hapticType}
      isLongPress={!!onLongPress}
      minLongPressDuration={minLongPressDuration}
      onLongPress={onLongPress}
      onLongPressEnded={onLongPressEnded}
      onPress={onPress}
      onPressStart={onPressStart}
      scaleTo={scaleTo}
      shouldActivateOnStart={shouldActivateOnStart}
      shouldLongPressHoldPress={shouldLongPressHoldPress}
      testID={testID}
      transformOrigin={normalizedTransformOrigin}
      wrapperStyle={wrapperStyle}
      disallowInterruption={disallowInterruption}
      ref={ref}
    >
      <View onLayout={onLayout} style={[sx.overflow, style]}>
        {children}
      </View>
    </NativeScaleButton>
  );
});

const sx = StyleSheet.create({
  overflow: {
    overflow: 'visible',
  },
});
