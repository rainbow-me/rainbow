import { codegenNativeComponent, type ViewProps, type CodegenTypes } from 'react-native';

type OnPressEvent = Readonly<{
  locationX: CodegenTypes.Double;
  locationY: CodegenTypes.Double;
}>;

type TransformOrigin = Readonly<{
  x: CodegenTypes.Double;
  y: CodegenTypes.Double;
}>;

export interface NativeButtonProps extends ViewProps {
  activeOpacity?: CodegenTypes.Double;
  disabled?: CodegenTypes.WithDefault<boolean, false>;
  duration?: CodegenTypes.WithDefault<CodegenTypes.Double, 160>;
  enableHapticFeedback?: CodegenTypes.WithDefault<boolean, true>;
  hapticType?: CodegenTypes.WithDefault<string, 'selection'>;
  minLongPressDuration?: CodegenTypes.WithDefault<CodegenTypes.Double, 500>;
  pressOutDuration?: CodegenTypes.WithDefault<CodegenTypes.Double, -1>;
  scaleTo?: CodegenTypes.WithDefault<CodegenTypes.Double, 0.86>;
  shouldLongPressHoldPress?: CodegenTypes.WithDefault<boolean, false>;
  throttle?: CodegenTypes.WithDefault<boolean, false>;
  useLateHaptic?: CodegenTypes.WithDefault<boolean, true>;
  transformOrigin: TransformOrigin;
  onCancel?: CodegenTypes.DirectEventHandler<undefined>;
  onLongPress?: CodegenTypes.DirectEventHandler<undefined>;
  onLongPressEnded?: CodegenTypes.DirectEventHandler<undefined>;
  onPress?: CodegenTypes.BubblingEventHandler<OnPressEvent>;
  onPressStart?: CodegenTypes.DirectEventHandler<undefined>;
}

export default codegenNativeComponent<NativeButtonProps>('Button');
