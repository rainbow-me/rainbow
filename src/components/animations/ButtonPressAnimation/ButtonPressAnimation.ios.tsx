import React from 'react';
import { requireNativeComponent } from 'react-native';

import { normalizeTransformOrigin } from './normalizeTransformOrigin';
import { type ButtonPressAnimationProps, type TransformOrigin } from './types';

interface NativeButtonProps extends Omit<
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

const NativeButton = requireNativeComponent<NativeButtonProps>('Button');

const ButtonPressAnimation = React.forwardRef<React.ComponentRef<typeof NativeButton>, ButtonPressAnimationProps>(
  (
    {
      duration = 160,
      enableHapticFeedback = true,
      hapticType = 'selection',
      minLongPressDuration = 500,
      onCancel,
      onLongPress,
      onLongPressEnded,
      onPress,
      onPressStart,
      scaleTo = 0.86,
      testID,
      transformOrigin,
      useLateHaptic = true,
      ...props
    },
    ref
  ) => (
    <NativeButton
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
      transformOrigin={normalizeTransformOrigin(transformOrigin)}
      useLateHaptic={useLateHaptic}
    />
  )
);

ButtonPressAnimation.displayName = 'ButtonPressAnimation';

export default ButtonPressAnimation;
