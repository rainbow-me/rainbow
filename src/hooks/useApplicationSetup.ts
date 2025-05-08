import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { InteractionManager } from 'react-native';
import { checkIdentifierOnLaunch } from '@/model/backup';
import { loadAddress } from '@/model/wallet';
import { InitialRoute } from '@/navigation/initialRoute';
import Routes from '@/navigation/routesNames';
import { saveFCMToken } from '@/notifications/tokens';
import { PerformanceReports, PerformanceTracking } from '@/performance/tracking';
import { initListeners as initWalletConnectListeners, initWalletConnectPushNotifications } from '@/walletConnect';

export function useApplicationSetup() {
  const [initialRoute, setInitialRoute] = useState<InitialRoute>(null);

  useEffect(() => {
    runSetup(setInitialRoute);
  }, [setInitialRoute]);

  return { initialRoute };
}

async function runSetup(setInitialRoute: Dispatch<SetStateAction<InitialRoute>>): Promise<void> {
  const address = await loadAddress();

  Promise.all([initWalletConnectListeners(), saveFCMToken()]).then(() => {
    initWalletConnectPushNotifications();
  });

  if (address) InteractionManager.runAfterInteractions(checkIdentifierOnLaunch);

  const initialRoute = address ? Routes.SWIPE_LAYOUT : Routes.WELCOME_SCREEN;

  setInitialRoute(initialRoute);
  PerformanceTracking.addReportParams(PerformanceReports.appStartup, { initialRoute });
}
