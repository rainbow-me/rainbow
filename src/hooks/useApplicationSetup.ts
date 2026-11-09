import { useEffect, useState } from 'react';
import { InteractionManager } from 'react-native';

import * as Sentry from '@sentry/react-native';
import { useListen } from '@storesjs/stores';

import { analytics } from '@/analytics';
import { getWalletContext } from '@/analytics/getWalletContext';
import { getDeviceId } from '@/analytics/utils';
import { checkIdentifierOnLaunch } from '@/features/backup/backup';
import {
  initListeners as initWalletConnectListeners,
  initWalletConnectPushNotifications,
} from '@/features/wallet-connect/handlers/listeners';
import { walletListTogglesActions } from '@/features/wallet/data/walletScreen/base/walletListTogglesStore';
import { time } from '@/framework/core/utils/time';
import { logger, RainbowError } from '@/logger';
import runMigrations from '@/model/migrations';
import { type InitialRoute } from '@/navigation/initialRoute';
import Routes from '@/navigation/routesNames';
import { saveFCMToken } from '@/notifications/tokens';
import { PerformanceReports, PerformanceTracking } from '@/performance/tracking';
import { loadGlobalLateData } from '@/state/settings/loadGlobalLateData';
import { checkKeychainIntegrity, getSelectedWallet, loadWallets, useWalletsStore } from '@/state/wallets/walletsStore';
import { shallowEqual } from '@/worklets/comparisons';

/**
 * Admits saved wallets before navigation and connects the live selection to application effects.
 */
export function useApplicationSetup(): InitialRoute | null {
  const [initialRoute, setInitialRoute] = useState<InitialRoute | null>(null);

  useListen(
    useWalletsStore,
    state => [state.accountAddress, state.selectedWalletId, state.getSelectedWallet()?.type] as const,
    ([address, , type]) => {
      walletListTogglesActions.setToggle('smallBalances', false);
      const context = getWalletContext(address, type);
      analytics.setWalletContext(context);
      analytics.identify();
      Sentry.setUser({ id: getDeviceId(), ...context });
    },
    { equalityFn: shallowEqual, fireImmediately: true }
  );

  useEffect(() => {
    void runSetup(setInitialRoute);
  }, []);

  return initialRoute;
}

async function runSetup(setInitialRoute: (route: InitialRoute) => void): Promise<void> {
  try {
    await loadWallets();
    await runMigrations();
  } catch (error) {
    logger.error(new RainbowError('[useApplicationSetup]: Failed to load saved wallets', error));
  }

  const initialRoute = getSelectedWallet() ? Routes.SWIPE_LAYOUT : Routes.WELCOME_SCREEN;
  setInitialRoute(initialRoute);
  PerformanceTracking.addReportParams(PerformanceReports.appStartup, { initialRoute });

  void Promise.all([initWalletConnectListeners(), saveFCMToken()]).then(initWalletConnectPushNotifications);
  requestIdleCallback(() => void loadGlobalLateData());
  if (initialRoute === Routes.SWIPE_LAYOUT) {
    InteractionManager.runAfterInteractions(checkIdentifierOnLaunch);
    setTimeout(checkKeychainIntegrity, time.seconds(2.5));
  }
}
