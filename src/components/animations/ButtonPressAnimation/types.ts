import { HapticFeedbackType } from '@/utils/haptics';
import { NativeSyntheticEvent, NativeTouchEvent, PressableProps, StyleProp, ViewProps, ViewStyle } from 'react-native';

export type TransformOrigin = [number, number];
export type Direction = 'bottom' | 'left' | 'right' | 'top';
export type ButtonPressAnimationTouchEvent = NativeSyntheticEvent<NativeTouchEvent>;

export interface BaseButtonAnimationProps
  extends Pick<ViewProps, 'onLayout' | 'style' | 'testID' | 'pointerEvents' | 'hitSlop'>,
    Pick<PressableProps, 'onPress'> {
  activeOpacity?: number;
  disabled?: boolean;
  duration?: number;
  minLongPressDuration?: number;
  onPress?: (event?: ButtonPressAnimationTouchEvent) => void;
  onLongPress?: () => void;
  transformOrigin?: TransformOrigin | Direction;
  scaleTo?: number;
}

export interface ButtonProps extends BaseButtonAnimationProps {
  children?: React.ReactNode;
  compensateForTransformOrigin?: boolean;
  enableHapticFeedback?: boolean;
  hapticType?: HapticFeedbackType;
  onCancel?: (event: NativeSyntheticEvent<{ state: number; close: boolean }>) => void;
  onLongPressEnded?: () => void;
  onPressStart?: () => void;
  pressOutDuration?: number;
  shouldLongPressHoldPress?: boolean;
  throttle?: boolean;
  useLateHaptic?: boolean;
  backgroundColor?: string;
  borderRadius?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
  exclusive?: boolean;
  isLongPress?: boolean;
  overflowMargin?: number;
  reanimatedButton?: boolean;
  skipTopMargin?: boolean;
  wrapperStyle?: StyleProp<ViewStyle>;
  disallowInterruption?: boolean;
  radiusAndroid?: number;
}
