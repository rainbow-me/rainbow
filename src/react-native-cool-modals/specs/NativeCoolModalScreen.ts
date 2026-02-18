import { type ColorValue, type ViewProps, codegenNativeComponent, type CodegenTypes } from 'react-native';

type StackPresentation =
  | 'push'
  | 'modal'
  | 'transparentModal'
  | 'containedModal'
  | 'containedTransparentModal'
  | 'fullScreenModal'
  | 'formSheet';

type StackAnimation = 'default' | 'none' | 'fade' | 'flip';

type TouchTopEvent = Readonly<{
  dismissing: boolean;
}>;

export interface NativeProps extends ViewProps {
  allowsDragToDismiss?: CodegenTypes.WithDefault<boolean, true>;
  allowsTapToDismiss?: CodegenTypes.WithDefault<boolean, true>;
  anchorModalToLongForm?: CodegenTypes.WithDefault<boolean, false>;
  backgroundOpacity?: CodegenTypes.WithDefault<CodegenTypes.Double, 0.7>;
  blocksBackgroundTouches?: CodegenTypes.WithDefault<boolean, true>;
  cornerRadius?: CodegenTypes.Double;
  customStack?: CodegenTypes.WithDefault<boolean, false>;
  disableShortFormAfterTransitionToLongForm?: CodegenTypes.WithDefault<boolean, false>;
  dismissable?: CodegenTypes.WithDefault<boolean, true>;
  gestureEnabled?: CodegenTypes.WithDefault<boolean, true>;
  headerHeight?: CodegenTypes.Double;
  hidden?: CodegenTypes.WithDefault<boolean, false>;
  ignoreBottomOffset?: CodegenTypes.WithDefault<boolean, false>;
  interactWithScrollView?: CodegenTypes.WithDefault<boolean, true>;
  isShortFormEnabled?: CodegenTypes.WithDefault<boolean, false>;
  longFormHeight?: CodegenTypes.Double;
  modalBackgroundColor?: ColorValue;
  onAppear?: CodegenTypes.DirectEventHandler<undefined>;
  onDismissed?: CodegenTypes.DirectEventHandler<undefined>;
  onTouchTop?: CodegenTypes.DirectEventHandler<TouchTopEvent>;
  onWillDismiss?: CodegenTypes.DirectEventHandler<undefined>;
  relevantScrollViewDepth?: CodegenTypes.WithDefault<CodegenTypes.Int32, 1>;
  shortFormHeight?: CodegenTypes.WithDefault<CodegenTypes.Double, 300>;
  showDragIndicator?: CodegenTypes.WithDefault<boolean, true>;
  stackAnimation?: CodegenTypes.WithDefault<StackAnimation, 'default'>;
  stackPresentation?: CodegenTypes.WithDefault<StackPresentation, 'push'>;
  springDamping?: CodegenTypes.Double;
  startFromShortForm?: CodegenTypes.WithDefault<boolean, false>;
  topOffset?: CodegenTypes.WithDefault<CodegenTypes.Double, 42>;
  transitionDuration?: CodegenTypes.Double;
}

export default codegenNativeComponent<NativeProps>('RNCMScreen', { excludedPlatforms: ['android'], interfaceOnly: true });
