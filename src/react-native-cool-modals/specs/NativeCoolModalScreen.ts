import { type ColorValue, type ViewProps } from 'react-native';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
import { type DirectEventHandler, type Double, type Int32, type WithDefault } from 'react-native/Libraries/Types/CodegenTypes';

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
  allowsDragToDismiss?: WithDefault<boolean, true>;
  allowsTapToDismiss?: WithDefault<boolean, true>;
  anchorModalToLongForm?: WithDefault<boolean, false>;
  backgroundOpacity?: WithDefault<Double, 0.7>;
  blocksBackgroundTouches?: WithDefault<boolean, true>;
  cornerRadius?: Double;
  customStack?: WithDefault<boolean, false>;
  disableShortFormAfterTransitionToLongForm?: WithDefault<boolean, false>;
  dismissable?: WithDefault<boolean, true>;
  gestureEnabled?: WithDefault<boolean, true>;
  headerHeight?: Double;
  hidden?: WithDefault<boolean, false>;
  ignoreBottomOffset?: WithDefault<boolean, false>;
  interactWithScrollView?: WithDefault<boolean, true>;
  isShortFormEnabled?: WithDefault<boolean, false>;
  longFormHeight?: Double;
  modalBackgroundColor?: ColorValue;
  onAppear?: DirectEventHandler<undefined>;
  onDismissed?: DirectEventHandler<undefined>;
  onTouchTop?: DirectEventHandler<TouchTopEvent>;
  onWillDismiss?: DirectEventHandler<undefined>;
  relevantScrollViewDepth?: WithDefault<Int32, 1>;
  shortFormHeight?: WithDefault<Double, 300>;
  showDragIndicator?: WithDefault<boolean, true>;
  stackAnimation?: WithDefault<StackAnimation, 'default'>;
  stackPresentation?: WithDefault<StackPresentation, 'push'>;
  springDamping?: Double;
  startFromShortForm?: WithDefault<boolean, false>;
  topOffset?: WithDefault<Double, 42>;
  transitionDuration?: Double;
}

export default codegenNativeComponent<NativeProps>('RNCMScreen', { excludedPlatforms: ['android'], interfaceOnly: true });
