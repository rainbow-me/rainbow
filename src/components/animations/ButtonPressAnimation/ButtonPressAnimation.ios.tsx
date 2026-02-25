import React from 'react';
import NativeButton from './NativeButton';
import { type ButtonPressAnimationProps } from './types';

const ButtonPressAnimation = React.forwardRef<unknown, ButtonPressAnimationProps>((props, ref) => <NativeButton {...props} ref={ref} />);

ButtonPressAnimation.displayName = 'ButtonPressAnimation';

export default ButtonPressAnimation;
