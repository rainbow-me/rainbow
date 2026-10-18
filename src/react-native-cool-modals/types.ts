import { type ReactNode } from 'react';
import { type ColorValue, type NativeSyntheticEvent, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { type NavigationHelpers, type ParamListBase, type StackNavigationState } from '@react-navigation/native';
import { type StackNavigationOptions } from '@react-navigation/stack';

export type NativeScreenProps = ViewProps & {
  allowsDragToDismiss?: boolean;
  allowsTapToDismiss?: boolean;
  anchorModalToLongForm?: boolean;
  backgroundOpacity?: number;
  cornerRadius?: number;
  customStack?: boolean;
  disableShortFormAfterTransitionToLongForm?: boolean;
  dismissable?: boolean;
  gestureEnabled?: boolean;
  headerHeight?: number;
  ignoreBottomOffset?: boolean;
  inStack: boolean;
  interactWithScrollView?: boolean;
  isShortFormEnabled?: boolean;
  limitActiveModals?: boolean;
  longFormHeight?: number;
  modalBackgroundColor?: ColorValue;
  onAppear?: () => void;
  onDismissed?: (event: NativeSyntheticEvent<{ presentationRequest: number }>) => void;
  onTouchTop?: (event: NativeSyntheticEvent<{ dismissing: boolean }>) => void;
  onWillDismiss?: () => void;
  presentationRequest: number;
  shortFormHeight?: number;
  springDamping?: number;
  stackAnimation?: 'default' | 'none' | 'fade' | 'flip';
  stackPresentation?:
    | 'push'
    | 'modal'
    | 'transparentModal'
    | 'containedModal'
    | 'containedTransparentModal'
    | 'fullScreenModal'
    | 'formSheet';
  startFromShortForm?: boolean;
  topOffset?: number;
  transitionDuration?: number;
};

export type NativeStackOptions = StackNavigationOptions &
  Omit<NativeScreenProps, keyof ViewProps | 'inStack' | 'modalBackgroundColor' | 'onAppear' | 'onDismissed' | 'presentationRequest'> & {
    backgroundColor?: ColorValue;
    contentStyle?: StyleProp<ViewStyle>;
    onAppear?: (() => void) | null;
    onDismissed?: () => void;
  };

export type NativeStackEvents = {
  appear: { data: undefined };
  dismiss: { data: undefined };
};

export type NativeStackRoute = StackNavigationState<ParamListBase>['routes'][number] & { presentationRequest?: number };
export type NativeStackState = Omit<StackNavigationState<ParamListBase>, 'routes'> & { routes: NativeStackRoute[] };
export type NativeStackNavigation = NavigationHelpers<ParamListBase, NativeStackEvents>;
export type NativeStackDescriptor = { options: NativeStackOptions; render: () => ReactNode; route: NativeStackRoute };
export type NativeStackDescriptors = Record<string, NativeStackDescriptor>;
