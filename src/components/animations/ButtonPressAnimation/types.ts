import { NativeSyntheticEvent, NativeTouchEvent, PressableProps, ViewProps } from 'react-native';

export type TransformOrigin = [number, number];
export type Direction = 'bottom' | 'left' | 'right' | 'top';
export type ButtonPressAnimationTouchEvent = NativeSyntheticEvent<NativeTouchEvent>;

export interface BaseButtonAnimationProps extends Pick<ViewProps, 'onLayout' | 'style' | 'testID'>, Pick<PressableProps, 'onPress'> {
  activeOpacity?: number;
  disabled?: boolean;
  duration?: number;
  minLongPressDuration?: number;
  onPress: (event?: ButtonPressAnimationTouchEvent) => void;
  onLongPress?: () => void;
  transformOrigin?: TransformOrigin | Direction;
  scaleTo?: number;
}
