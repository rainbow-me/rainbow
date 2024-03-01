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
import { getAppIcon } from '@/handlers/localstorage/globalSettings';
import { RainbowError, logger } from '@/logger';
import { AppIconKey } from '@/appIcons/appIcons';
const Sound = require('react-native-sound');

const { RainbowSplashScreen, RNBootSplash } = NativeModules;

export default function useHideSplashScreen() {
  const alreadyLoggedPerformance = useRef(false);

  return useCallback(async () => {
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
      const additionalParams = initialRoute !== undefined ? { initialRoute } : undefined;
      PerformanceTracking.finishMeasuring(PerformanceMetrics.timeToInteractive, additionalParams);
      PerformanceTracking.logDirectly(PerformanceMetrics.completeStartupTime, Date.now() - StartTime.START_TIME, additionalParams);
      analytics.track('Application became interactive');
      alreadyLoggedPerformance.current = true;

      // need to load setting straight from storage, redux isnt ready yet
      const appIcon = (await getAppIcon()) as AppIconKey;
      if (appIcon === 'poolboy') {
        const sound = new Sound(require('../assets/sounds/RainbowSega.mp3'), (error: any) => {
          if (error) {
            logger.error(new RainbowError('Error playing poolboy sound'));
            return;
          }

          sound.play((success: any) => {
            logger.debug('playing poolboy sound');
          });
        });
      }
    }
  }, []);
}
