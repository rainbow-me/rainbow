import React, { PropsWithChildren } from 'react';
import NativeButton from './NativeButton';
import { BaseButtonAnimationProps } from './types';
import { HapticFeedbackTypes } from 'react-native-haptic-feedback';

interface Props extends BaseButtonAnimationProps {
  enableHapticFeedback?: boolean;
  hapticType: HapticFeedbackTypes;
  isInteraction?: boolean;
  onPressStart: () => void;
}

const ButtonPressAnimation = React.forwardRef((props: PropsWithChildren<Props>, ref) => <NativeButton {...props} ref={ref} />);

ButtonPressAnimation.displayName = 'ButtonPressAnimation';

export default ButtonPressAnimation;
