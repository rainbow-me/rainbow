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
  uid?: string;

  constructor(private readonly options: InitSDKOptions = defaultOptions) {}

  stop(isStopped: boolean): void {
    appsFlyerClient.stop(isStopped);
  }

  init(cuid?: string): void {
    if (!this.options.devKey) {
      logger.warn('[Analytics] AppsFlyer dev key missing; skipping AppsFlyer init');
      return;
    }

    if (cuid) appsFlyerClient.setCustomerUserId(cuid);

    appsFlyerClient.initSdk(
      this.options,
      () => {
        logger.debug('[Analytics] AppsFlyer initialized');
        appsFlyerClient.getAppsFlyerUID((error, uid) => {
          if (uid) this.uid = uid;
          else logger.warn('[Analytics] AppsFlyer ID unavailable', { error });
        });
      },
      error => logger.warn('[Analytics] AppsFlyer initialization failed', { error })
    );
  }
}
