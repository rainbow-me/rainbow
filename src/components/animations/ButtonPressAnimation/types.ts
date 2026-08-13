import { type GestureResponderEvent, type PressableProps, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { type HapticType } from 'react-native-turbo-haptics';

export type TransformOrigin = [number, number];
export type Direction = 'bottom' | 'left' | 'right' | 'top';

export interface ButtonPressAnimationProps
  extends Pick<PressableProps, 'disabled' | 'hitSlop' | 'onLayout' | 'testID' | 'accessible'>, Pick<ViewProps, 'style'> {
  children?: React.ReactNode;
  onPress?: ((event?: GestureResponderEvent) => void) | null | undefined;
  onLongPress?: ((event?: GestureResponderEvent) => void) | null;
  activeOpacity?: number;
  /** Milliseconds. */
  duration?: number;
  /** Milliseconds. */
  minLongPressDuration?: number;
  onLongPressEnded?: () => void;
  onPressStart?: () => void;
  transformOrigin?: TransformOrigin | Direction;
  scaleTo?: number;
  enableHapticFeedback?: boolean;
  hapticType?: HapticType;
  shouldLongPressHoldPress?: boolean;

  /** @platform ios */
  compensateForTransformOrigin?: boolean;
  /** @platform ios */
  onCancel?: (event: { nativeEvent: { state: number; close: boolean } }) => void;
  /**
   * Milliseconds, or -1 to use `duration`.
   * @platform ios
   */
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
  /** @platform android */
  shouldActivateOnStart?: boolean;
}
