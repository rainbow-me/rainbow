import React, { useMemo } from 'react';
import { View, ViewStyle } from 'react-native';
import { BaseButtonAnimationProps, TransformOrigin } from './types';
import NativeButtonNativeComponent, { NativeButtonProps } from '@/codegen/specs/NativeButtonNativeComponent';
import styled from '@/styled-thing';
import { HapticFeedback, HapticFeedbackType } from '@/utils/haptics';

interface Props extends BaseButtonAnimationProps {
  children?: React.ReactNode;
  compensateForTransformOrigin?: boolean;
  enableHapticFeedback?: boolean;
  hapticType?: HapticFeedbackType;
  onCancel?: () => void;
  onLongPressEnded?: () => void;
  onPressStart?: () => void;
  pressOutDuration?: number;
  shouldLongPressHoldPress?: boolean;
  throttle?: boolean;
  useLateHaptic?: boolean;
}

type NormalizedTransformOrigin = { x: number; y: number };

const ButtonWithTransformOrigin = styled(NativeButtonNativeComponent)(({
  transformOrigin,
}: {
  transformOrigin?: NormalizedTransformOrigin;
}) => {
  if (!transformOrigin) return {};
  const { x, y } = transformOrigin;
  // 👇️ Here we want to set the button's top / left
  // properties (relative to the parent wrapper view) to
  // values opposite of the provided transformOrigin.
  // This is necessary to do in order for the `transformOrigin` prop to
  // work with NativeButton without effecting NativeButton's layout.
  const styles: ViewStyle = {};

  if (x !== 0.5) {
    styles.left = `${x + 0.5 * (x > 0.5 ? 100 : -100)}%`;
  }
  if (y !== 0.5) {
    styles.top = `${y + 0.5 * (y > 0.5 ? 100 : -100)}%`;
  }

  return styles;
});

export function normalizeTransformOrigin(transformOrigin: TransformOrigin | string | undefined): NormalizedTransformOrigin {
  if (Array.isArray(transformOrigin) && transformOrigin.length === 2) {
    return { x: transformOrigin[0], y: transformOrigin[1] };
  }

  switch (transformOrigin) {
    case 'bottom':
      return { x: 0.5, y: 1 };
    case 'left':
      return { x: 0, y: 0.5 };
    case 'right':
      return { x: 1, y: 0.5 };
    case 'top':
      return { x: 0.5, y: 1 };
    default:
      return { x: 0.5, y: 0.5 };
  }
}

const NativeButton = React.forwardRef<React.ElementRef<typeof NativeButtonNativeComponent>, Props>(
  (
    {
      children,
      duration = 160,
      hapticType = HapticFeedback.selection,
      scaleTo = 0.86,
      useLateHaptic = true,
      minLongPressDuration = 500,
      enableHapticFeedback = true,
      compensateForTransformOrigin,
      transformOrigin,
      testID,
      onPress,
      ...rest
    }: Props,
    ref
  ) => {
    const normalizedTransformOrigin = useMemo(() => normalizeTransformOrigin(transformOrigin), [transformOrigin]);

    const nativeProps: NativeButtonProps = {
      ...rest,
      duration,
      enableHapticFeedback,
      hapticType,
      minLongPressDuration,
      scaleTo,
      testID,
      transformOrigin: normalizedTransformOrigin,
      useLateHaptic,
      onPress: onPress as NativeButtonProps['onPress'],
    };

    return compensateForTransformOrigin ? (
      <View>
        {/*
        👆️ This wrapper View is necessary.
        In order to compensate for the way our NativeButton's transformOrigin effects layout/positioning,
        we set the NativeButton's left / top values relative to this wrapper View.
      */}
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

NativeButton.displayName = 'NativeButton';

export default NativeButton;
