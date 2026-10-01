import React, { forwardRef, useCallback, useContext, useMemo } from 'react';
import { processColor, requireNativeComponent, StyleSheet, View } from 'react-native';

import { createNativeWrapper, type RawButtonProps } from 'react-native-gesture-handler';
import { triggerHaptics } from 'react-native-turbo-haptics';

import { ButtonPressContext } from './ButtonPressContext';
import { normalizeTransformOrigin } from './normalizeTransformOrigin';
import { type ButtonPressAnimationProps } from './types';

interface ButtonElementProps extends ButtonPressAnimationProps {
  isLongPress?: boolean;
}

interface ZoomableButtonPressEvent {
  nativeEvent: { type: 'longPress' | 'longPressEnded' | 'press' | 'pressStart' };
}

type NativeScaleButtonProps = ButtonElementProps &
  Required<
    Pick<
      ButtonElementProps,
      'duration' | 'minLongPressDuration' | 'scaleTo' | 'hapticType' | 'enableHapticFeedback' | 'disallowInterruption'
    >
  > & { importantForAccessibility: 'auto' | 'no' };

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
    Pick<RawButtonProps, 'rippleColor' | 'importantForAccessibility'> & {
      hasPressStartHandler?: boolean;
      onPress?: (event: ZoomableButtonPressEvent) => void;
    }
>('RNZoomableButton');

const ZoomableButton = createNativeWrapper(ZoomableRawButton);
type ZoomableButtonRef = React.ComponentRef<typeof ZoomableButton>;

const transparentColor = processColor('transparent');

const NativeScaleButton = forwardRef<ZoomableButtonRef, NativeScaleButtonProps>(function NativeScaleButton(
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
    importantForAccessibility,
    hapticType,
    enableHapticFeedback,
    onPress,
    onPressStart,
    scaleTo,
    transformOrigin,
    wrapperStyle,
    testID,
    disallowInterruption,
  }: NativeScaleButtonProps,
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
      importantForAccessibility={importantForAccessibility}
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
  const defaultActions = useContext(ButtonPressContext);
  const handlePress = onPress === undefined ? defaultActions?.onPress : onPress;
  const handleLongPress = onLongPress === undefined ? defaultActions?.onLongPress : onLongPress;
  const inheritsPress = onPress === undefined && !!defaultActions?.onPress;
  const hasOwnAction = onPress !== undefined || onLongPress !== undefined;
  const content =
    defaultActions && hasOwnAction ? <ButtonPressContext.Provider value={null}>{children}</ButtonPressContext.Provider> : children;
  const normalizedTransformOrigin = useMemo(() => normalizeTransformOrigin(transformOrigin), [transformOrigin]);

  return disabled ? (
    <View onLayout={onLayout} style={[sx.overflow, style]} ref={ref}>
      {content}
    </View>
  ) : (
    <NativeScaleButton
      duration={duration}
      enableHapticFeedback={enableHapticFeedback}
      exclusive={exclusive}
      hapticType={hapticType}
      isLongPress={!!handleLongPress}
      importantForAccessibility={inheritsPress && !onLongPress ? 'no' : 'auto'}
      minLongPressDuration={minLongPressDuration}
      onLongPress={handleLongPress}
      onLongPressEnded={onLongPressEnded}
      onPress={handlePress}
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
        {content}
      </View>
    </NativeScaleButton>
  );
});

const sx = StyleSheet.create({
  overflow: {
    overflow: 'visible',
  },
});
