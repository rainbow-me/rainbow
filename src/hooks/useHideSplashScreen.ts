/* eslint-disable @typescript-eslint/no-var-requires */
import { InteractionManager, NativeModules } from 'react-native';
import { PerformanceReports, PerformanceReportSegments, PerformanceTracking } from '../performance/tracking';
import { IS_ANDROID, IS_IOS } from '@/env';
import { StatusBarHelper } from '@/helpers';
import { onHandleStatusBar } from '@/navigation/onNavigationStateChange';
import { getAppIcon } from '@/handlers/localstorage/globalSettings';
import { RainbowError, logger } from '@/logger';
import { AppIconKey } from '@/appIcons/appIcons';
const { RainbowSplashScreen } = NativeModules;

let alreadyLoggedPerformance = false;
let didSetStatusBar = false;

export const hideSplashScreen = async () => {
  try {
    if (RainbowSplashScreen?.hideAnimated) {
      RainbowSplashScreen.hideAnimated();
    } else if (IS_ANDROID) {
      handleAndroidStatusBar();
      const RNBootSplash = require('react-native-bootsplash');
      await RNBootSplash.hide({ fade: true });
    }

    if (IS_ANDROID && !didSetStatusBar) {
      didSetStatusBar = true;
      handleAndroidStatusBar();
    }

    onHandleStatusBar();

    if (IS_IOS) {
      StatusBarHelper.setHidden(false);
    } else {
      InteractionManager.runAfterInteractions(() => {
        StatusBarHelper.setHidden(false);
      });
    }

    if (!alreadyLoggedPerformance) {
      alreadyLoggedPerformance = true;
      PerformanceTracking.logReportSegmentRelative(PerformanceReports.appStartup, PerformanceReportSegments.appStartup.hideSplashScreen);

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
  } catch (e) {
    logger.error(new RainbowError('[useHideSplashScreen]: Error hiding splash screen'), {
      error: e,
    });
  }
};

function handleAndroidStatusBar() {
  didSetStatusBar = true;
  StatusBarHelper.setDarkContent();
}
