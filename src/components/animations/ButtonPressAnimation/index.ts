/* eslint-disable import/no-unresolved */
// @ts-expect-error .android and .ios exports cause errors
import ButtonPressAnimation from './ButtonPressAnimation';
import type ButtonPressAnimationT from './ButtonPressAnimation.ios';
import { ScaleButtonZoomable as ScaleButtonZoomableAndroid } from './ScaleButtonZoomable';

export default ButtonPressAnimation as typeof ButtonPressAnimationT;

export { ScaleButtonZoomableAndroid };
export type { ButtonProps as ButtonPressAnimationProps } from './types';
