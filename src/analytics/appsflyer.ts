import { Platform } from 'react-native';

import appsFlyer from 'react-native-appsflyer';
import { APPSFLYER_DEV_KEY } from 'react-native-dotenv';

import { IS_DEV } from '@/env';
import { logger } from '@/logger';

const APPSFLYER_IOS_APP_ID = '1457119021';

export function initAppsFlyer(): void {
  if (!APPSFLYER_DEV_KEY) {
    logger.warn('[Analytics] AppsFlyer dev key missing; skipping AppsFlyer init');
    return;
  }

  appsFlyer.initSdk(
    {
      devKey: APPSFLYER_DEV_KEY,
      appId: Platform.OS === 'ios' ? APPSFLYER_IOS_APP_ID : undefined,
      isDebug: IS_DEV,
      onInstallConversionDataListener: false,
      onDeepLinkListener: false,
      timeToWaitForATTUserAuthorization: 0,
    },
    () => logger.debug('[Analytics] AppsFlyer initialized'),
    error => logger.warn('[Analytics]: AppsFlyer initialization failed', { error })
  );
}
