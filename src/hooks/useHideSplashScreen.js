import { useCallback } from 'react';
import {
  InteractionManager,
  NativeModules,
  Platform,
  StatusBar,
} from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import useExperimentalFlag, {
  NEW_SPLASH_SCREEN,
} from '@rainbow-me/config/experimentalHooks';

const { RainbowSplashScreen } = NativeModules;

export default function useHideSplashScreen() {
  const iconOnSplashScreenAnimated = useExperimentalFlag(NEW_SPLASH_SCREEN);

  return useCallback(() => {
    if (
      RainbowSplashScreen &&
      RainbowSplashScreen.hideAnimated &&
      iconOnSplashScreenAnimated
    ) {
      RainbowSplashScreen.hideAnimated();
    } else {
      SplashScreen.hide();
    }
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent', false);
      StatusBar.setTranslucent(true);
      StatusBar.setBarStyle('dark-content', true);
    }
    // show the StatusBar
    (Platform.OS === 'ios' && StatusBar.setHidden(false, 'fade')) ||
      InteractionManager.runAfterInteractions(() => {
        StatusBar.setHidden(false, 'fade');
      });
  }, [iconOnSplashScreenAnimated]);
}
