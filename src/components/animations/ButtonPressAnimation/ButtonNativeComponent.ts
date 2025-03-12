import type { ViewProps, HostComponent } from 'react-native';
import type { BubblingEventHandler, Double } from 'react-native/Libraries/Types/CodegenTypes';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

export interface NativeButtonProps extends ViewProps {
  disabled?: boolean;
  duration?: Double;
  enableHapticFeedback?: boolean;
  hapticType?: string;
  minLongPressDuration?: Double;
  onLongPress?: BubblingEventHandler<null>;
  onLongPressEnded?: BubblingEventHandler<null>;
  onPress?: BubblingEventHandler<null>;
  onPressStart?: BubblingEventHandler<null>;
  pressOutDuration?: Double;
  scaleTo?: Double;
  shouldLongPressHoldPress?: boolean;
  throttle?: boolean;
  transformOrigin?: Readonly<{
    x: Double;
    y: Double;
  }>;
  useLateHaptic?: boolean;
}

// eslint-disable-next-line import/no-default-export
export default codegenNativeComponent<NativeButtonProps>('Button') as HostComponent<NativeButtonProps>;
