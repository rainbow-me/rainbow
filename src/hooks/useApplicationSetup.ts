import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { InteractionManager } from 'react-native';

import { checkIdentifierOnLaunch } from '@/features/backup/backup';
import {
  initListeners as initWalletConnectListeners,
  initWalletConnectPushNotifications,
} from '@/features/wallet-connect/handlers/listeners';
import { loadAddress } from '@/model/wallet';
import { type InitialRoute } from '@/navigation/initialRoute';
import Routes from '@/navigation/routesNames';
import { PerformanceReports, PerformanceTracking } from '@/performance/tracking';
import { initializeWallet } from '@/state/wallets/initializeWallet';

export function useApplicationSetup() {
  const [initialRoute, setInitialRoute] = useState<InitialRoute>(null);

  useEffect(() => {
    runSetup(setInitialRoute);
  }, [setInitialRoute]);

  return initialRoute;
}

async function runSetup(setInitialRoute: Dispatch<SetStateAction<InitialRoute>>): Promise<void> {
  const address = await loadAddress();

  initWalletConnectListeners().then(initWalletConnectPushNotifications);

  if (address) {
    void initializeWallet({ shouldRunMigrations: true });
    InteractionManager.runAfterInteractions(checkIdentifierOnLaunch);
  }

  const initialRoute = address ? Routes.SWIPE_LAYOUT : Routes.WELCOME_SCREEN;

  setInitialRoute(initialRoute);
  PerformanceTracking.addReportParams(PerformanceReports.appStartup, { initialRoute });
}
