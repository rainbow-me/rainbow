/* eslint-disable @typescript-eslint/no-var-requires */
import { InteractionManager, NativeModules } from 'react-native';

import { SystemBars } from 'react-native-edge-to-edge';

import { IS_ANDROID, IS_IOS } from '@/env';
import { type AppIconKey } from '@/features/app-icon/models/appIcons';
import { getAppIcon } from '@/handlers/localstorage/globalSettings';
import { logger, RainbowError } from '@/logger';
import { onHandleStatusBar } from '@/navigation/onNavigationStateChange';

const { RainbowSplashScreen } = NativeModules;

// Tracks whether the once-only first-hide block has run (poolboy easter-egg sound).
let firstHide = false;
let splashScreenHidden = false;

export const isSplashScreenHidden = () => splashScreenHidden;

export const hideSplashScreen = async () => {
  splashScreenHidden = true;
  try {
    if (RainbowSplashScreen?.hideAnimated) {
      RainbowSplashScreen.hideAnimated();
    } else if (IS_ANDROID) {
      const RNBootSplash = require('react-native-bootsplash');
      await RNBootSplash.hide({ fade: true });
    }

    onHandleStatusBar();

    if (IS_IOS) {
      SystemBars.setHidden({ statusBar: false });
    } else {
      InteractionManager.runAfterInteractions(() => {
        SystemBars.setHidden({ statusBar: false });
      });
    }

    if (!firstHide) {
      firstHide = true;
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
