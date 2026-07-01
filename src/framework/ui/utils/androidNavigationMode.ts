import { NativeModules } from 'react-native';

export enum AndroidNavigationMode {
  ThreeButton = '3-button',
  TwoButton = '2-button',
  Gesture = 'gesture',
}

export function getAndroidNavigationMode(): AndroidNavigationMode {
  switch (NativeModules.NavbarHeight?.getNavigationMode?.()) {
    case 1:
      return AndroidNavigationMode.TwoButton;
    case 2:
      return AndroidNavigationMode.Gesture;
    default:
      return AndroidNavigationMode.ThreeButton;
  }
}
