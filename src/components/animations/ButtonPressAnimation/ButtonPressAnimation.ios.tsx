import React, { PropsWithChildren } from 'react';
import NativeButton from './NativeButton';
import { BaseButtonAnimationProps } from './types';
import { HapticFeedbackType } from '@/utils/haptics';

interface Props extends BaseButtonAnimationProps {
  enableHapticFeedback?: boolean;
  hapticType: HapticFeedbackType;
  isInteraction?: boolean;
  onPressStart: () => void;
}

const ButtonPressAnimation = React.forwardRef((props: PropsWithChildren<Props>, ref) => <NativeButton {...props} ref={ref} />);

ButtonPressAnimation.displayName = 'ButtonPressAnimation';

export default ButtonPressAnimation;
