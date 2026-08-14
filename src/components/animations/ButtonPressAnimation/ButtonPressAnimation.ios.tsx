import React, { useMemo } from 'react';
import { View, type ViewStyle } from 'react-native';

import NativeButtonNativeComponent, { type NativeButtonProps } from '@/codegen/specs/NativeButtonNativeComponent';
import styled from '@/framework/ui/styled-thing';

import { normalizeTransformOrigin } from './normalizeTransformOrigin';
import type { ButtonPressAnimationProps, TransformOrigin } from './types';

const ButtonWithTransformOrigin = styled(NativeButtonNativeComponent)(({ transformOrigin }: { transformOrigin?: TransformOrigin }) => {
  if (!transformOrigin) return {};
  const [x, y] = transformOrigin;
  // Counter the native layer's anchor-point offset within the stable wrapper frame.
  const styles: ViewStyle = {};

  if (x !== 0.5) {
    styles.left = `${x + 0.5 * (x > 0.5 ? 100 : -100)}%`;
  }
  if (y !== 0.5) {
    styles.top = `${y + 0.5 * (y > 0.5 ? 100 : -100)}%`;
  }

  return styles;
});

const ButtonPressAnimation = React.forwardRef<React.ElementRef<typeof NativeButtonNativeComponent>, ButtonPressAnimationProps>(
  (
    {
      children,
      duration = 160,
      hapticType = 'selection',
      scaleTo = 0.86,
      useLateHaptic = true,
      minLongPressDuration = 500,
      enableHapticFeedback = true,
      compensateForTransformOrigin,
      transformOrigin,
      testID,
      onPress,
      onLongPress,
      onCancel,
      onLongPressEnded,
      onPressStart,
      shouldLongPressHoldPress,
      accessible = true,
      ...rest
    },
    ref
  ) => {
    const normalizedTransformOrigin = useMemo(() => normalizeTransformOrigin(transformOrigin), [transformOrigin]);
    const nativeOnPress = useMemo<NativeButtonProps['onPress']>(() => (onPress ? () => onPress() : undefined), [onPress]);
    const nativeOnLongPress = useMemo<NativeButtonProps['onLongPress']>(
      () => (onLongPress ? () => onLongPress() : undefined),
      [onLongPress]
    );
    const longPressGestureEnabled = Boolean(onLongPress || onCancel || onLongPressEnded || shouldLongPressHoldPress);

    const nativeProps: NativeButtonProps = {
      ...rest,
      cancelEnabled: Boolean(onCancel),
      duration,
      enableHapticFeedback,
      hapticType,
      longPressGestureEnabled,
      minLongPressDuration,
      pressStartEnabled: Boolean(onPressStart),
      scaleTo,
      testID,
      transformOrigin: normalizedTransformOrigin,
      useLateHaptic,
      onPress: nativeOnPress,
      onCancel,
      onLongPress: nativeOnLongPress,
      onLongPressEnded,
      onPressStart,
      shouldLongPressHoldPress,
      accessible,
    };

    return compensateForTransformOrigin ? (
      <View collapsable={false}>
        <ButtonWithTransformOrigin {...nativeProps} ref={ref} transformOrigin={normalizedTransformOrigin}>
          {children}
        </ButtonWithTransformOrigin>
      </View>
    ) : (
      <NativeButtonNativeComponent {...nativeProps} ref={ref}>
        {children}
      </NativeButtonNativeComponent>
    );
  }
);

ButtonPressAnimation.displayName = 'ButtonPressAnimation';

export default ButtonPressAnimation;
