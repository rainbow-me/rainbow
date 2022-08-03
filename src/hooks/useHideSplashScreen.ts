import { useCallback, useRef } from 'react';
import { InteractionManager, NativeModules, StatusBar } from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import { PerformanceContextMap } from '../performance/PerformanceContextMap';
import { StartTime } from '../performance/start-time';
import { PerformanceTracking } from '../performance/tracking';
import { PerformanceMetrics } from '../performance/tracking/types/PerformanceMetrics';
import { analytics } from '@rainbow-me/analytics';
import { onHandleStatusBar } from '@rainbow-me/navigation/onNavigationStateChange';
import { StatusBarService } from '@rainbow-me/services';

const { RainbowSplashScreen, RNBootSplash } = NativeModules;

export default function useHideSplashScreen() {
  const alreadyLoggedPerformance = useRef(false);

  return useCallback(() => {
    if (!!RainbowSplashScreen && RainbowSplashScreen.hideAnimated) {
      RainbowSplashScreen.hideAnimated();
    } else {
      if (android) {
        RNBootSplash.hide(true);
      } else {
        SplashScreen.hide();
      }
    }
    StatusBar.setTranslucent(true);

    onHandleStatusBar();
    (ios && StatusBarService.setHidden(false, 'fade')) ||
      InteractionManager.runAfterInteractions(() => {
        StatusBarService.setHidden(false, 'fade');
      });

    if (!alreadyLoggedPerformance.current) {
      const initialRoute = PerformanceContextMap.get('initialRoute');
      const additionalParams =
        initialRoute !== undefined ? { initialRoute } : undefined;
      PerformanceTracking.finishMeasuring(
        PerformanceMetrics.timeToInteractive,
        additionalParams
      );
      PerformanceTracking.logDirectly(
        PerformanceMetrics.completeStartupTime,
        Date.now() - StartTime.START_TIME,
        additionalParams
      );
      analytics.track('Application became interactive');
      alreadyLoggedPerformance.current = true;
    }
  }, []);
}
