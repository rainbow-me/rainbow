import { Platform } from 'react-native';

import appsFlyerClient, { type InitSDKOptions } from 'react-native-appsflyer';
import { APPSFLYER_DEV_KEY } from 'react-native-dotenv';

import { IS_DEV } from '@/env';
import { logger } from '@/logger';

const APPSFLYER_IOS_APP_ID = '1457119021';

export const defaultOptions: InitSDKOptions = {
  devKey: APPSFLYER_DEV_KEY,
  appId: Platform.OS === 'ios' ? APPSFLYER_IOS_APP_ID : undefined,
  isDebug: IS_DEV,
  onInstallConversionDataListener: false,
  onDeepLinkListener: false,
  timeToWaitForATTUserAuthorization: 0,
};

export class AppsFlyer {
  constructor(private readonly options: InitSDKOptions = defaultOptions) {}

  stop(isStopped: boolean): void {
    appsFlyerClient.stop(isStopped);
  }

  init(): void {
    if (!this.options.devKey) {
      logger.warn('[Analytics] AppsFlyer dev key missing; skipping AppsFlyer init');
      return;
    }

    appsFlyerClient.initSdk(
      this.options,
      () => logger.debug('[Analytics] AppsFlyer initialized'),
      error => logger.warn('[Analytics]: AppsFlyer initialization failed', { error })
    );
  }
}
