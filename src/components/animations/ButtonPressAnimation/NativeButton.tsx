import React, { LegacyRef, useMemo } from 'react';
import { requireNativeComponent, View, ViewStyle } from 'react-native';
import { BaseButtonAnimationProps, TransformOrigin } from './types';
import styled from '@/styled-thing';
import { HapticFeedback, HapticFeedbackType } from '@/utils/haptics';

interface Props extends BaseButtonAnimationProps {
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

interface SpecificRawNativeButtonProps extends Props {
  transformOrigin?: TransformOrigin;
}

const RawNativeButton = requireNativeComponent<SpecificRawNativeButtonProps>('Button');

const ButtonWithTransformOrigin = styled(RawNativeButton)(({ transformOrigin }: { transformOrigin: TransformOrigin }) => {
  if (!transformOrigin) return {};
  const [x, y] = transformOrigin;
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

export function normalizeTransformOrigin(transformOrigin: TransformOrigin | string | undefined): TransformOrigin | undefined {
  if (Array.isArray(transformOrigin) && transformOrigin.length === 2) {
    return transformOrigin;
  }

  switch (transformOrigin) {
    case 'bottom':
      return [0.5, 1];
    case 'left':
      return [0, 0.5];
    case 'right':
      return [1, 0.5];
    case 'top':
      return [0.5, 1];
    default:
      return undefined;
  }
}

const NativeButton = React.forwardRef(
  (
    {
      duration = 160,
      hapticType = HapticFeedback.selection,
      scaleTo = 0.86,
      useLateHaptic = true,
      minLongPressDuration = 500,
      enableHapticFeedback = true,
      compensateForTransformOrigin,
      transformOrigin,
      testID,
      ...props
    }: Props,
    ref
  ) => {
    const normalizedTransformOrigin = useMemo(() => normalizeTransformOrigin(transformOrigin), [transformOrigin]);

    return compensateForTransformOrigin ? (
      <View>
        {/*
        👆️ This wrapper View is necessary.
        In order to compensate for the way our NativeButton's transformOrigin effects layout/positioning,
        we set the NativeButton's left / top values relative to this wrapper View.
      */}
        <ButtonWithTransformOrigin
          {...props}
          duration={duration}
          enableHapticFeedback={enableHapticFeedback}
          hapticType={hapticType}
          minLongPressDuration={minLongPressDuration}
          ref={ref}
          scaleTo={scaleTo}
          testID={testID}
          transformOrigin={normalizedTransformOrigin}
          useLateHaptic={useLateHaptic}
        />
      </View>
    ) : (
      <RawNativeButton
        {...props}
        duration={duration}
        enableHapticFeedback={enableHapticFeedback}
        hapticType={hapticType}
        minLongPressDuration={minLongPressDuration}
        ref={ref as LegacyRef<any>}
        scaleTo={scaleTo}
        testID={testID}
        useLateHaptic={useLateHaptic}
      />
    );
  }
);

NativeButton.displayName = 'NativeButton';

export default NativeButton;
