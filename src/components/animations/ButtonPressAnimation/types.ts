import { GestureResponderEvent, PressableProps, StyleProp, ViewProps, ViewStyle } from 'react-native';
import { HapticFeedbackTypes } from 'react-native-haptic-feedback';

export type TransformOrigin = [number, number];
export type Direction = 'bottom' | 'left' | 'right' | 'top';

export interface ButtonPressAnimationProps
  extends Pick<PressableProps, 'disabled' | 'hitSlop' | 'onLayout' | 'testID'>,
    Pick<ViewProps, 'style'> {
  children?: React.ReactNode;
  onPress?: ((event?: GestureResponderEvent) => void) | null | undefined;
  onLongPress?: ((event?: GestureResponderEvent) => void) | null;
  activeOpacity?: number;
  duration?: number;
  minLongPressDuration?: number;
  onLongPressEnded?: () => void;
  onPressStart?: () => void;
  transformOrigin?: TransformOrigin | Direction;
  scaleTo?: number;
  enableHapticFeedback?: boolean;
  hapticType?: HapticFeedbackTypes;
  shouldLongPressHoldPress?: boolean;

  /** @platform ios */
  compensateForTransformOrigin?: boolean;
  /** @platform ios */
  onCancel?: (event: { nativeEvent: { state: number; close: boolean } }) => void;
  /** @platform ios */
  pressOutDuration?: number;
  /** @platform ios */
  throttle?: boolean;
  /** @platform ios */
  useLateHaptic?: boolean;
  /** @platform ios */
  isInteraction?: boolean;

  /** @platform android */
  reanimatedButton?: boolean;
  /** @platform android */
  backgroundColor?: string;
  /** @platform android */
  borderRadius?: number;
  /** @platform android */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** @platform android */
  exclusive?: boolean;
  /** @platform android */
  overflowMargin?: number;
  /** @platform android */
  skipTopMargin?: boolean;
  /** @platform android */
  wrapperStyle?: StyleProp<ViewStyle>;
  /** @platform android */
  disallowInterruption?: boolean;
  /** @platform android */
  radiusAndroid?: number;
}
