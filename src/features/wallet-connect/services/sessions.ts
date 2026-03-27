import { logger, RainbowError } from '@/logger';
import type { SessionTypes } from '@walletconnect/types';
import { getSdkError } from '@walletconnect/utils';
import { getWalletKitClient } from './client';

/**
 * Returns all active settings in a type-safe manner.
 */
export async function getAllActiveSessions() {
  const client = await getWalletKitClient();
  return Object.values(client?.getActiveSessions() || {}) || [];
}

/**
 * Adds an account to an existing session
 */
export async function addAccountToSession(session: SessionTypes.Struct, { address }: { address?: string }) {
  try {
    const client = await getWalletKitClient();

    const namespaces: Parameters<typeof client.updateSession>[0]['namespaces'] = {};
    for (const [key, value] of Object.entries(session.namespaces)) {
      /**
       * The `namespace` that corresponds to the `requiredNamespace` that was
       * requested when connecting the session. The `requiredNamespace` does
       * not have `accounts`, since it merely requests chains and methods, so
       * we need to referernce the connected `namespace` for existing `account`
       * values.
       */
      const ns = session.namespaces[key];

      namespaces[key] = {
        ...ns,
        accounts: ns.accounts || [],
        methods: value.methods,
        events: value.events,
      };

      if (value.chains) {
        for (const chain of value.chains) {
          const chainId = parseInt(chain.split(`${key}:`)[1]);
          const account = `${key}:${chainId}:${address}`;

          /*
           * Add latest selected accounts to beginning of array so that our
           * switch wallet sheet shows that one as selected
           */
          if (!namespaces[key].accounts.includes(account)) {
            namespaces[key].accounts.unshift(account);
          } else {
            // remove and re-add to start of array
            namespaces[key].accounts.splice(namespaces[key].accounts.indexOf(account), 1);
            namespaces[key].accounts.unshift(account);
          }
        }
      } else {
        logger.error(new RainbowError(`[walletConnect]: namespace is missing chains prop when updating`), {
          requiredNamespaces: session.requiredNamespaces,
        });
      }
    }

    logger.debug(`[walletConnect]: updating session`, {
      namespaces,
    });

    await client.updateSession({
      topic: session.topic,
      namespaces,
    });
  } catch (e: any) {
    logger.error(new RainbowError(`[walletConnect]: error adding account to session`), {
      message: e.message,
    });
  }
}

export async function changeAccount(session: SessionTypes.Struct, { address }: { address?: string }) {
  try {
    const client = await getWalletKitClient();

    /*
     * Before we can effectively switch accounts, we need to add the account to
     * the session. Only then can we tell the dapp to use the new account.
     */
    await addAccountToSession(session, { address });

    for (const value of Object.values(session.namespaces)) {
      if (!value.chains) {
        logger.debug(`[walletConnect]: changeAccount, no chains found for namespace`);
        continue;
      }

      for (const chainId of value.chains) {
        logger.debug(`[walletConnect]: changeAccount, updating accounts for chainId`, {
          chainId,
        });

        // tell the dapp to use the new account
        await client.emitSessionEvent({
          topic: session.topic,
          event: {
            name: 'accountsChanged',
            data: [address],
          },
          chainId,
        });

        logger.debug(`[walletConnect]: changeAccount, updated accounts for chainId`, {
          chainId,
        });
      }
    }

    logger.debug(`[walletConnect]: changeAccount complete`);
    return true;
  } catch (e) {
    logger.error(new RainbowError(`[walletConnect]: error changing account`), {
      message: (e as Error).message,
    });
  }
  return false;
}

/**
 * Initiates a disconnect from the app-end of the connection. Disconnection
 * within a dapp is handled internally by WC v2.
 */
export async function disconnectSession(session: SessionTypes.Struct) {
  const client = await getWalletKitClient();

  await client.disconnectSession({
    topic: session.topic,
    reason: getSdkError('USER_DISCONNECTED'),
  });
}
