import { useCallback, useRef } from 'react';
import { InteractionManager, NativeModules } from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import { PerformanceContextMap } from '../performance/PerformanceContextMap';
import { StartTime } from '../performance/start-time';
import { PerformanceTracking } from '../performance/tracking';
import { PerformanceMetrics } from '../performance/tracking/types/PerformanceMetrics';
import { StatusBarHelper } from '@/helpers';
import { analytics } from '@/analytics';
import { onHandleStatusBar } from '@/navigation/onNavigationStateChange';
const Sound = require('react-native-sound');

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

    if (android) {
      StatusBarHelper.setBackgroundColor('transparent', false);
      StatusBarHelper.setTranslucent(true);
      StatusBarHelper.setDarkContent();
    }

    onHandleStatusBar();
    (ios && StatusBarHelper.setHidden(false, 'fade')) ||
      InteractionManager.runAfterInteractions(() => {
        StatusBarHelper.setHidden(false, 'fade');
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

      // play sound if wanted
      const sound = new Sound(
        require('../assets/sounds/RainbowSega.mp3'),
        (error: any) => {
          if (error) {
            console.log('failed to load the sound', error);
            return;
          }

          // if loaded successfully

          sound.play((success: any) => {
            console.log('played 1');
          });
        }
      );
    }
  }, []);
}
