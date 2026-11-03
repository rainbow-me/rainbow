import { type GestureResponderEvent, type PressableProps, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { type HapticType } from 'react-native-turbo-haptics';

export type TransformOrigin = [number, number];
export type Direction = 'bottom' | 'left' | 'right' | 'top';

export interface ButtonPressAnimationProps
  extends Pick<PressableProps, 'disabled' | 'hitSlop' | 'onLayout' | 'testID'>, Pick<ViewProps, 'style'> {
  children?: React.ReactNode;
  onPress?: ((event?: GestureResponderEvent) => void) | null | undefined;
  onLongPress?: ((event?: GestureResponderEvent) => void) | null;
  activeOpacity?: number;
  /**
   * Timing duration in milliseconds, also used for release unless overridden.
   * On iOS 17+, setting either duration opts out of the default springs.
   * Defaults to 160 when using timing.
   */
  duration?: number;
  minLongPressDuration?: number;
  onLongPressEnded?: () => void;
  onPressStart?: () => void;
  transformOrigin?: TransformOrigin | Direction;
  scaleTo?: number;
  enableHapticFeedback?: boolean;
  hapticType?: HapticType;
  shouldLongPressHoldPress?: boolean;

  /** @platform ios */
  onCancel?: (event: { nativeEvent: { state: number; close: boolean } }) => void;
  /**
   * Release timing duration in milliseconds. Setting this opts out of the default springs.
   * The press duration defaults to 160 if `duration` is omitted.
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
  backgroundColor?: string;
  /** @platform android */
  borderRadius?: number;
  /** @platform android */
  exclusive?: boolean;
  /** @platform android */
  importantForAccessibility?: ViewProps['importantForAccessibility'];
  /** @platform android */
  wrapperStyle?: StyleProp<ViewStyle>;
  /** @platform android */
  disallowInterruption?: boolean;
  /** @platform android */
  radiusAndroid?: number;
  /** @platform android */
  shouldActivateOnStart?: boolean;
}
