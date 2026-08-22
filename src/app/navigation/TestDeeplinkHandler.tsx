import { useEffect } from 'react';
import { Linking } from 'react-native';

import URL from 'url-parse';

import { useCashAccountStore } from '@/features/cash/stores/cashAccountStore';
import { MOCK_LINKED_CARD, useCashPaymentMethodStore } from '@/features/cash/stores/cashPaymentMethodStore';
import { type ExperimentalConfigKey } from '@/features/config/constants/experimental';
import { useExperimentalConfigStore } from '@/features/config/stores/experimentalConfigStore';
import { savePIN } from '@/features/local-auth/pinAuthentication';
import { useSandboxDiagnosticsStore } from '@/features/sandbox/data/stores/sandboxDiagnosticsStore';
import { logger, RainbowError } from '@/logger';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { initializeWallet } from '@/state/wallets/initializeWallet';

/**
 * Handles E2E test commands. See e2e/README.md:31 for usage.
 */
export function TestDeeplinkHandler() {
  useEffect(() => {
    Linking.getInitialURL()
      .then(handleTestDeeplink)
      .catch(error => {
        logger.error(new RainbowError('[TestDeeplinkHandler]: failed to read initial URL', error), {
          message: error instanceof Error ? error.message : String(error),
        });
      });

    const listener = Linking.addListener('url', ({ url }) => {
      void handleTestDeeplink(url);
    });
    return listener.remove;
  }, []);

  return null;
}

async function handleTestDeeplink(url: string | null): Promise<void> {
  if (!url) return;

  let action: string | undefined;
  try {
    const { protocol, host, pathname, query } = new URL(url, true);
    if (protocol !== 'rainbow:' || host !== 'e2e') {
      return;
    }

    action = pathname.split('/')[1];

    switch (action) {
      case 'import': {
        const privateKey = getQueryValue(query.privateKey);
        const name = getQueryValue(query.name);
        if (!privateKey || !name) {
          throw new RainbowError('[TestDeeplinkHandler]: missing import params');
        }

        await savePIN('1111');
        await initializeWallet({
          seedPhrase: privateKey,
          name,
          userPin: '1111',
        });
        Navigation.replace(Routes.SWIPE_LAYOUT, {
          screen: Routes.WALLET_SCREEN,
        });
        break;
      }
      case 'setExperimentalFlag': {
        const flag = getQueryValue(query.flag);
        if (!flag) throw new RainbowError('[TestDeeplinkHandler]: missing experimental flag');
        useExperimentalConfigStore.getState().setFlag(flag as ExperimentalConfigKey, getQueryValue(query.value) === 'true');
        break;
      }
      case 'setCashAccount':
        if (getQueryValue(query.value) === 'true') {
          useCashAccountStore.getState().setUserId('e2e-user-id');
        } else {
          useCashAccountStore.getState().clearUserId();
        }
        break;
      case 'setCashLinkedCard':
        if (getQueryValue(query.value) === 'true') {
          useCashPaymentMethodStore.getState().setLinkedCard(MOCK_LINKED_CARD);
        } else {
          useCashPaymentMethodStore.getState().clearLinkedCard();
        }
        break;
      case 'sandbox-test':
        useSandboxDiagnosticsStore.getState().open();
        break;
      default:
        logger.debug(`[TestDeeplinkHandler]: unknown path`, { action });
        break;
    }
  } catch (error) {
    logger.error(new RainbowError('[TestDeeplinkHandler]: command failed', error), {
      action,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

function getQueryValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
