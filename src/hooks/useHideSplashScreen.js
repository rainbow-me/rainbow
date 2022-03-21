import { useCallback } from 'react';
import { InteractionManager, NativeModules } from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import { StatusBarService } from '../services';

const { RainbowSplashScreen, RNBootSplash } = NativeModules;

export default function useHideSplashScreen() {
  return useCallback(() => {
    if (RainbowSplashScreen && RainbowSplashScreen.hideAnimated) {
      RainbowSplashScreen.hideAnimated();
    } else {
      if (android) {
        RNBootSplash.hide(true);
      } else {
        SplashScreen.hide();
      }
    }
    if (android) {
      StatusBarService.setBackgroundColor('transparent', false);
      StatusBarService.setTranslucent(true);
    }
    // show the StatusBar
    (ios && StatusBarService.setHidden(false, 'fade')) ||
      InteractionManager.runAfterInteractions(() => {
        StatusBarService.setHidden(false, 'fade');
      });
  }, []);
}
