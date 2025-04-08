import { useCallback, useEffect, useState } from 'react';
import { logger } from '@/logger';
import { InteractionManager } from 'react-native';
import { handleReviewPromptAction } from '@/utils/reviewAlert';
import { ReviewPromptAction } from '@/storage/schema';
import { loadAddress } from '@/model/wallet';
import { InitialRoute } from '@/navigation/initialRoute';
import Routes from '@/navigation/routesNames';
import { checkIdentifierOnLaunch } from '@/model/backup';
import { saveFCMToken } from '@/notifications/tokens';
import { initListeners as initWalletConnectListeners, initWalletConnectPushNotifications } from '@/walletConnect';
import { IS_DEV } from '@/env';
import isTestFlight from '@/helpers/isTestFlight';
import { PerformanceReports, PerformanceTracking } from '@/performance/tracking';

export function useApplicationSetup() {
  const [initialRoute, setInitialRoute] = useState<InitialRoute>(null);

  const setup = useCallback(async () => {
    const [address] = await Promise.all([loadAddress(), initWalletConnectListeners(), saveFCMToken()]);
    initWalletConnectPushNotifications();

    if (address) {
      setTimeout(() => {
        InteractionManager.runAfterInteractions(() => {
          handleReviewPromptAction(ReviewPromptAction.TimesLaunchedSinceInstall);
        });
      }, 10_000);

      InteractionManager.runAfterInteractions(checkIdentifierOnLaunch);
    }

    const initialRoute = address ? Routes.SWIPE_LAYOUT : Routes.WELCOME_SCREEN;

    setInitialRoute(initialRoute);
    PerformanceTracking.addReportParams(PerformanceReports.appStartup, {
      initialRoute,
    });
  }, []);

  useEffect(() => {
    if (!IS_DEV && isTestFlight) {
      logger.debug(`[App]: Test flight usage - ${isTestFlight}`);
    }
    setup();
  }, [setup]);

  return { initialRoute };
}
