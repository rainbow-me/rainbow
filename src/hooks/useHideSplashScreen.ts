import { useCallback } from 'react';
import { InteractionManager, NativeModules, StatusBar } from 'react-native';
import SplashScreen from 'react-native-splash-screen';

const { RainbowSplashScreen } = NativeModules;

export default function useHideSplashScreen() {
  return useCallback(() => {
    if (RainbowSplashScreen && RainbowSplashScreen.hideAnimated) {
      RainbowSplashScreen.hideAnimated();
    } else {
      SplashScreen.hide();
    }
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    if (android) {
      StatusBar.setBackgroundColor('transparent', false);
      StatusBar.setTranslucent(true);
      StatusBar.setBarStyle('dark-content', true);
    }
    // show the StatusBar
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
    (ios && StatusBar.setHidden(false, 'fade')) ||
      InteractionManager.runAfterInteractions(() => {
        StatusBar.setHidden(false, 'fade');
      });
  }, []);
}
