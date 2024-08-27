import { useCallback, useEffect, useState } from 'react';
import { logger, RainbowError } from '@/logger';
import { InteractionManager } from 'react-native';
import { handleReviewPromptAction } from '@/utils/reviewAlert';
import { ReviewPromptAction } from '@/storage/schema';
import { loadAddress } from '@/model/wallet';
import { InitialRoute } from '@/navigation/initialRoute';
import { PerformanceContextMap } from '@/performance/PerformanceContextMap';
import Routes from '@/navigation/routesNames';
import { checkIdentifierOnLaunch } from '@/model/backup';
import { analyticsV2 } from '@/analytics';
import { saveFCMToken } from '@/notifications/tokens';
import { initListeners as initWalletConnectListeners } from '@/walletConnect';
import isTestFlight from '@/helpers/isTestFlight';
import { PerformanceTracking } from '@/performance/tracking';
import { PerformanceMetrics } from '@/performance/tracking/types/PerformanceMetrics';

export function useApplicationSetup() {
  const [initialRoute, setInitialRoute] = useState<InitialRoute>(null);

  const identifyFlow = useCallback(async () => {
    const address = await loadAddress();
    if (address) {
      setTimeout(() => {
        InteractionManager.runAfterInteractions(() => {
          handleReviewPromptAction(ReviewPromptAction.TimesLaunchedSinceInstall);
        });
      }, 10_000);

      InteractionManager.runAfterInteractions(checkIdentifierOnLaunch);
    }

    setInitialRoute(address ? Routes.SWIPE_LAYOUT : Routes.WELCOME_SCREEN);
    PerformanceContextMap.set('initialRoute', address ? Routes.SWIPE_LAYOUT : Routes.WELCOME_SCREEN);
  }, []);

  useEffect(() => {
    if (!IS_DEV && isTestFlight) {
      logger.debug(`[App]: Test flight usage - ${isTestFlight}`);
    }
    identifyFlow();

    Promise.all([analyticsV2.initializeRudderstack(), saveFCMToken()])
      .catch(error => {
        logger.error(new RainbowError('Failed to initialize rudderstack or save FCM token', error));
      })
      .finally(() => {
        initWalletConnectListeners();
        PerformanceTracking.finishMeasuring(PerformanceMetrics.loadRootAppComponent);
        analyticsV2.track(analyticsV2.event.applicationDidMount);
      });
  }, [identifyFlow]);

  return { initialRoute };
}
