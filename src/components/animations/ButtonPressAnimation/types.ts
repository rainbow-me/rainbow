import {
  NativeSyntheticEvent,
  NativeTouchEvent,
  ViewProps,
} from 'react-native';

export type TransformOrigin = [number, number];
export type Direction = 'bottom' | 'left' | 'right' | 'top';

export interface BaseButtonAnimationProps extends Omit<ViewProps, 'hitSlop'> {
  activeOpacity?: number;
  disabled?: boolean;
  duration?: number;
  minLongPressDuration: number;
  onPress: (event?: NativeSyntheticEvent<NativeTouchEvent>) => void;
  onLongPress: () => void;
  transformOrigin?: TransformOrigin | Direction;
  scaleTo?: number;
}
