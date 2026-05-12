import { InteractionManager, Platform } from 'react-native';

import { parseUri } from '@walletconnect/utils';
import Minimizer from 'react-native-minimizer';

import { logger } from '@/logger';

import { getWalletKitClient } from './client';

/**
 * Indicates that the app should redirect or go back after the next action
 * completes
 *
 * This is a hack to get around having to muddy the scopes of our event
 * listeners. BE CAREFUL WITH THIS.
 */
let hasDeeplinkPendingRedirect = false;

/**
 * Set `hasDeeplinkPendingRedirect` to a boolean, indicating that the app
 * should redirect or go back after the next action completes
 *
 * This is a hack to get around having to muddy the scopes of our event
 * listeners. BE CAREFUL WITH THIS.
 */
export function setHasPendingDeeplinkPendingRedirect(value: boolean) {
  logger.debug(`[walletConnect]: setHasPendingDeeplinkPendingRedirect`, { value });
  hasDeeplinkPendingRedirect = value;
}

/**
 * Called in case we're on mobile and have a pending redirect
 */
export function maybeGoBackAndClearHasPendingRedirect({ delay = 0 }: { delay?: number } = {}) {
  if (hasDeeplinkPendingRedirect) {
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        setHasPendingDeeplinkPendingRedirect(false);

        if (Platform.OS !== 'ios') {
          Minimizer.goBack();
        }
      }, delay);
    });
  }
}

/**
 * MAY BE UNDEFINED if WC v2 hasn't been instantiated yet
 */
export let lastConnector: string | undefined = undefined;

export async function pair({ uri, connector }: { uri: string; connector?: string }) {
  logger.debug(`[walletConnect]: pair`, { uri }, logger.DebugContext.walletconnect);
  lastConnector = connector;
  /**
   * Make sure this is cleared if we get multiple pairings in rapid succession
   */

  const { topic, ...rest } = parseUri(uri);
  const client = await getWalletKitClient();

  logger.debug(`[walletConnect]: pair: parsed uri`, { topic, rest });

  // init pairing
  await client.pair({ uri });
}
