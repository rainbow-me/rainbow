import { useCallback } from 'react';
import { InteractionManager, NativeModules, StatusBar } from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import PerformanceTracking from '../performance-tracking';
import PerformanceMetric from '../performance-tracking/types/PerformanceMetric';

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
      StatusBar.setBackgroundColor('transparent', false);
      StatusBar.setTranslucent(true);
      StatusBar.setBarStyle('dark-content', true);
    }
    // show the StatusBar
    (ios && StatusBar.setHidden(false, 'fade')) ||
      InteractionManager.runAfterInteractions(() => {
        StatusBar.setHidden(false, 'fade');
      });

    PerformanceTracking.finishMeasuring(PerformanceMetric.timeToInteractive);
  }, []);
}
