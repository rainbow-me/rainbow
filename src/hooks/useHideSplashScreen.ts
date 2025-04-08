/* eslint-disable @typescript-eslint/no-var-requires */
import { MutableRefObject, useCallback, useRef } from 'react';
import { InteractionManager, NativeModules } from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import { PerformanceReports, PerformanceReportSegments, PerformanceTracking } from '../performance/tracking';
import { IS_ANDROID, IS_IOS } from '@/env';
import { StatusBarHelper } from '@/helpers';
import { onHandleStatusBar } from '@/navigation/onNavigationStateChange';
import { getAppIcon } from '@/handlers/localstorage/globalSettings';
import { RainbowError, logger } from '@/logger';
import { AppIconKey } from '@/appIcons/appIcons';
const { RainbowSplashScreen } = NativeModules;

export default function useHideSplashScreen() {
  const alreadyLoggedPerformance = useRef(false);
  const didSetStatusBar = useRef(false);

  return useCallback(async () => {
    if (RainbowSplashScreen?.hideAnimated) {
      RainbowSplashScreen.hideAnimated();
    } else if (IS_ANDROID) {
      handleAndroidStatusBar(didSetStatusBar);
      const RNBootSplash = require('react-native-bootsplash');
      await RNBootSplash.hide({ fade: true });
    } else {
      SplashScreen.hide();
    }

    if (IS_ANDROID && !didSetStatusBar.current) handleAndroidStatusBar(didSetStatusBar);

    onHandleStatusBar();
    (IS_IOS && StatusBarHelper.setHidden(false, 'fade')) ||
      InteractionManager.runAfterInteractions(() => {
        StatusBarHelper.setHidden(false, 'fade');
      });

    if (!alreadyLoggedPerformance.current) {
      alreadyLoggedPerformance.current = true;
      PerformanceTracking.logReportSegmentRelative(PerformanceReports.appStartup, PerformanceReportSegments.appStartup.hideSplashScreen);
      PerformanceTracking.startReportSegment(
        PerformanceReports.appStartup,
        PerformanceReportSegments.appStartup.initialScreenInteractiveRender
      );

      // need to load setting straight from storage, redux isnt ready yet
      const appIcon = (await getAppIcon()) as AppIconKey;
      if (appIcon === 'poolboy') {
        const Sound = require('react-native-sound');

        const sound = new Sound(require('../assets/sounds/RainbowSega.mp3'), (error: unknown) => {
          if (error) {
            logger.error(new RainbowError('[useHideSplashScreen]: Error playing poolboy sound'));
            return;
          }

          sound.play(() => logger.debug('[useHideSplashScreen]: playing poolboy sound'));
        });
      }
    }
  }, []);
}

function handleAndroidStatusBar(didSetStatusBar: MutableRefObject<boolean>) {
  didSetStatusBar.current = true;
  StatusBarHelper.setBackgroundColor('transparent', false);
  StatusBarHelper.setTranslucent(true);
  StatusBarHelper.setDarkContent();
}
