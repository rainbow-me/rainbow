import analytics from '@segment/analytics-react-native';
import { InteractionManager, NativeModules, StatusBar } from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import { StartTime } from '../performance/start-time';
import { PerformanceTracking } from '../performance/tracking';
import { PerformanceMetrics } from '../performance/tracking/types/PerformanceMetrics';

const { RainbowSplashScreen, RNBootSplash } = NativeModules;

let alreadyLoggedPerformance = false;

export function hideSplashScreen() {
  if (RainbowSplashScreen?.hideAnimated) {
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

  if (!alreadyLoggedPerformance) {
    PerformanceTracking.finishMeasuring(PerformanceMetrics.timeToInteractive);
    PerformanceTracking.logDirectly(
      PerformanceMetrics.completeStartupTime,
      Date.now() - StartTime.START_TIME
    );
    analytics.track('Application became interactive');
    alreadyLoggedPerformance = true;
  }
}
