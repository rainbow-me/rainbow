import React, { useMemo, type Component } from 'react';
import { requireNativeComponent, View, type NativeMethods, type ViewStyle } from 'react-native';

import styled from '@/framework/ui/styled-thing';

import { normalizeTransformOrigin } from './normalizeTransformOrigin';
import { type ButtonPressAnimationProps, type TransformOrigin } from './types';

interface SpecificRawNativeButtonProps extends Omit<
  ButtonPressAnimationProps,
  'onCancel' | 'onLongPress' | 'onLongPressEnded' | 'onPress' | 'onPressStart'
> {
  onButtonCancel?: ButtonPressAnimationProps['onCancel'];
  onButtonLongPress?: ButtonPressAnimationProps['onLongPress'];
  onButtonLongPressEnded?: ButtonPressAnimationProps['onLongPressEnded'];
  onButtonPress?: ButtonPressAnimationProps['onPress'];
  onButtonPressStart?: ButtonPressAnimationProps['onPressStart'];
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

export const NativeButton = React.forwardRef<Component<SpecificRawNativeButtonProps> & NativeMethods, ButtonPressAnimationProps>(
  (
    {
      duration = 160,
      hapticType = 'selection',
      scaleTo = 0.86,
      useLateHaptic = true,
      minLongPressDuration = 500,
      enableHapticFeedback = true,
      compensateForTransformOrigin,
      onCancel,
      onLongPress,
      onLongPressEnded,
      onPress,
      onPressStart,
      transformOrigin,
      testID,
      ...props
    }: ButtonPressAnimationProps,
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
          onButtonCancel={onCancel}
          onButtonLongPress={onLongPress}
          onButtonLongPressEnded={onLongPressEnded}
          onButtonPress={onPress}
          onButtonPressStart={onPressStart}
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
        onButtonCancel={onCancel}
        onButtonLongPress={onLongPress}
        onButtonLongPressEnded={onLongPressEnded}
        onButtonPress={onPress}
        onButtonPressStart={onPressStart}
        ref={ref}
        scaleTo={scaleTo}
        testID={testID}
        useLateHaptic={useLateHaptic}
      />
    );
  }
);

NativeButton.displayName = 'NativeButton';
