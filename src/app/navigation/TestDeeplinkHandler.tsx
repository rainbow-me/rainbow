import { useEffect } from 'react';
import { Linking } from 'react-native';

import URL from 'url-parse';

import { type CashDepositSetupStatus } from '@/features/cash/stores/cashDepositSetupStatus';
import { useCashDepositSetupStore } from '@/features/cash/stores/cashDepositSetupStore';
import { type ExperimentalConfigKey } from '@/features/config/constants/experimental';
import { useExperimentalConfigStore } from '@/features/config/stores/experimentalConfigStore';
import { savePIN } from '@/features/local-auth/pinAuthentication';
import { useSandboxDiagnosticsStore } from '@/features/sandbox/data/stores/sandboxDiagnosticsStore';
import { logger } from '@/logger';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { initializeWallet } from '@/state/wallets/initializeWallet';

/**
 * Handles E2E test commands. See e2e/README.md:31 for usage.
 */
export function TestDeeplinkHandler() {
  useEffect(() => {
    const listener = Linking.addListener('url', async ({ url }) => {
      const { protocol, host, pathname, query } = new URL(url, true);
      if (protocol !== 'rainbow:' || host !== 'e2e') {
        return;
      }

      const action = pathname.split('/')[1];

      switch (action) {
        case 'import':
          await savePIN('1111');
          await initializeWallet({
            seedPhrase: query.privateKey,
            name: query.name,
            userPin: '1111',
          });
          Navigation.replace(Routes.SWIPE_LAYOUT, {
            screen: Routes.WALLET_SCREEN,
          });
          break;
        case 'setExperimentalFlag':
          useExperimentalConfigStore.getState().setFlag(query.flag as ExperimentalConfigKey, query.value === 'true');
          break;
        case 'setCashDepositSetupStatus':
          useCashDepositSetupStore.getState().setStatus(query.status as CashDepositSetupStatus);
          break;
        case 'sandbox-test':
          useSandboxDiagnosticsStore.getState().open();
          break;
        default:
          logger.debug(`[TestDeeplinkHandler]: unknown path`, { url });
          break;
      }
    });
    return listener.remove;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
