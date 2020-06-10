import { useCallback } from 'react';
import {
  InteractionManager,
  NativeModules,
  Platform,
  StatusBar,
} from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import { iconOnSplashScreenAnimated } from '../config/experimental';

function hide() {
  const { RainbowSplashScreen } = NativeModules;
  if (
    RainbowSplashScreen &&
    RainbowSplashScreen.hideAnimated &&
    iconOnSplashScreenAnimated
  ) {
    RainbowSplashScreen.hideAnimated();
  } else {
    SplashScreen.hide();
  }
}

export default function useHideSplashScreen() {
  const onHideSplashScreen = useCallback(() => {
    hide();
    // show the StatusBar
    (Platform.OS === 'ios' && StatusBar.setHidden(false, 'fade')) ||
      InteractionManager.runAfterInteractions(() => {
        StatusBar.setHidden(false, 'fade');
      });
  }, []);
  return onHideSplashScreen;
}
