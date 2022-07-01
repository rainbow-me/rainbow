import analytics from '@segment/analytics-react-native';
import { useCallback, useRef } from 'react';
import { NativeModules } from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import { StartTime } from '../performance/start-time';
import { PerformanceTracking } from '../performance/tracking';
import { PerformanceMetrics } from '../performance/tracking/types/PerformanceMetrics';
import { onHandleStatusBar } from '@rainbow-me/navigation/onNavigationStateChange';
// import { StatusBarService } from '@rainbow-me/services';
// import { currentColors } from '@rainbow-me/theme';

const { RainbowSplashScreen, RNBootSplash } = NativeModules;

export default function useHideSplashScreen() {
  const alreadyLoggedPerformance = useRef(false);

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
    onHandleStatusBar();
    // if (android) {
    //   StatusBarService.setBackgroundColor('transparent', false);
    //   StatusBarService.setTranslucent(true);
    //   StatusBarService.setBarStyle('dark-content', true);
    // }
    // // show the StatusBar
    onHandleStatusBar();
    // (ios && StatusBarService.setHidden(false, 'fade')) ||
    //   InteractionManager.runAfterInteractions(() => {
    //     StatusBarService.setHidden(false, 'fade');
    //   });
    // console.log('currentColors.0.0', currentColors.theme);

    if (!alreadyLoggedPerformance.current) {
      PerformanceTracking.finishMeasuring(PerformanceMetrics.timeToInteractive);
      PerformanceTracking.logDirectly(
        PerformanceMetrics.completeStartupTime,
        Date.now() - StartTime.START_TIME
      );
      analytics.track('Application became interactive');
      alreadyLoggedPerformance.current = true;
    }
  }, []);
}
