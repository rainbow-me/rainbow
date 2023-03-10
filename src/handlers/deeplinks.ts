import lang from 'i18n-js';
import URL from 'url-parse';

import { parseUri } from '@walletconnect/utils';
import { initialChartExpandedStateSheetHeight } from '@/components/expanded-state/asset/ChartExpandedState';
import store from '@/redux/store';
import {
  walletConnectOnSessionRequest,
  walletConnectRemovePendingRedirect,
  walletConnectSetPendingRedirect,
} from '@/redux/walletconnect';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { fetchReverseRecordWithRetry } from '@/utils/profileUtils';
import {
  defaultConfig,
  getExperimetalFlag,
  WC_V2,
} from '@/config/experimental';
import { PROFILES } from '@/config/experimentalHooks';
import { setDeploymentKey } from '@/handlers/fedora';
import { delay } from '@/helpers/utilities';
import {
  checkIsValidAddressOrDomain,
  isENSAddressFormat,
} from '@/helpers/validators';
import { Navigation } from '@/navigation';
import { scheduleActionOnAssetReceived } from '@/redux/data';
import { emitAssetRequest, emitChartsRequest } from '@/redux/explorer';
import Routes from '@/navigation/routesNames';
import { ethereumUtils } from '@/utils';
import { logger } from '@/logger';
import {
  pair as pairWalletConnect,
  setHasPendingDeeplinkPendingRedirect,
} from '@/utils/walletConnect';
import { analyticsV2 } from '@/analytics';
import { FiatProviderName } from '@/entities/f2c';

export default async function handleDeeplink(
  url: string,
  initialRoute: any = null
) {
  if (!url) {
    logger.warn(`handleDeeplink: No url provided`);
    return;
  }

  /**
   * We need to wait till the wallet is ready to handle any deeplink
   */
  while (store.getState().data.isLoadingAssets) {
      logger.info(`handleDeeplink: Waiting for wallet to be ready`);
    await delay(50);
  }

  const { protocol, host, pathname, query } = new URL(url);

  logger.info(`handleDeeplink: handling url`, {
    url,
    protocol,
    host,
    pathname,
    query,
  });

  if (protocol === 'ethereum:') {
    /**
     * Handling EIP deep links
     *
     * TODO apparently not working on sim, needs more research
     */
    logger.info(`handleDeeplink: ethereum:// protocol`);
    ethereumUtils.parseEthereumUrl(url);
  } else if (protocol === 'https:' || protocol === 'rainbow:') {
    /**
     * Any native iOS deep link OR universal links via HTTPS
     */
    logger.info(`handleDeeplink: https:// or rainbow:// protocol`);

    /**
     * The first path following the host (universal link) or protocol
     * (deeplink) e.g. `https://rainbow.me/foo` or `rainbow://foo` where `foo`
     * is the action.
     */
    const action = protocol === 'https:' ? pathname.split('/')[1] : host;

    switch (action) {
      /**
       * Universal links from WC e.g. when initiating a pairing on mobile, you
       * tap "Rainbow" in Web3Modal and it hits this handler
       */
      case 'wc': {
        logger.info(`handleDeeplink: wc`);
        handleWalletConnect(query.uri as string);
        break;
      }

      /**
       * Links from website to an individual token
       */
      case 'token': {
        logger.info(`handleDeeplink: token`);

        const { dispatch } = store;
        const { addr } = query;
        const address = (addr as string)?.toLowerCase() ?? '';

        if (address && address.length > 0) {
          const asset = ethereumUtils.getAssetFromAllAssets(address);

          // First go back to home to dismiss any open shit
          // and prevent a weird crash
          if (initialRoute !== Routes.WELCOME_SCREEN) {
            // @ts-expect-error FIXME: Expected 2-3 arguments, but got 1.
            Navigation.handleAction(Routes.WALLET_SCREEN);
          }

          setTimeout(() => {
            const _action = (asset: any) => {
              Navigation.handleAction(Routes.EXPANDED_ASSET_SHEET, {
                asset,
                fromDiscover: true,
                longFormHeight: initialChartExpandedStateSheetHeight,
                type: 'token',
              });
            };

            if (asset) {
              _action(asset);
            } else {
              dispatch(emitAssetRequest(address));
              dispatch(emitChartsRequest(address));
              scheduleActionOnAssetReceived(address, _action);
            }
          }, 50);
        }
        break;
      }

      /**
       * Top Hat stuff
       */
      case 'update-ios': {
        logger.info(`handleDeeplink: update-ios`);

        const code = pathname.split('/')[2];

        if (android) {
          Alert.alert(lang.t('deeplinks.tried_to_use_ios'));
        } else {
          setDeploymentKey(code);
        }

        break;
      }

      /**
       * Top Hat stuff
       */
      case 'update-android': {
        logger.info(`handleDeeplink: update-android`);

        const code = pathname.split('/')[2];

        if (ios) {
          Alert.alert(lang.t('deeplinks.tried_to_use_android'));
        } else {
          setDeploymentKey(code);
        }

        break;
      }

      /**
       * Handle redirects after user completes an fiat onramp flow. This URL
       * should contain metadata about the transaction, if we have it.
       */
      case 'f2c': {
        logger.info(`handleDeeplink: f2c`);

        const { provider, sessionId } = query;

        if (!provider || !sessionId) {
          logger.warn('Received FWC deeplink with invalid params', {
            url,
            query,
          });
        }

        analyticsV2.track(analyticsV2.event.f2cProviderFlowCompleted, {
          provider: provider as FiatProviderName,
          sessionId: sessionId as string,
        });

        break;
      }

      /**
       * Handles redirects from Plaid OAuth flow, which originates (atm) within
       * Ratio's onramp SDK.
       */
      case 'plaid': {
        logger.log('handleDeeplink: handling Plaid redirect', { url });
        break;
      }

      default: {
        const addressOrENS = pathname?.split('/')?.[1];

        /**
         * This handles ENS profile links on mobile i.e.
         * `https://rainbow.me/0x123...` which is why it's in the default case
         * here.
         */
        if (addressOrENS) {
          const isValid = await checkIsValidAddressOrDomain(addressOrENS);

          if (isValid) {
            const profilesEnabled = defaultConfig?.[PROFILES]?.value;
            const ensName = isENSAddressFormat(addressOrENS)
              ? addressOrENS
              : await fetchReverseRecordWithRetry(addressOrENS);
            return Navigation.handleAction(
              profilesEnabled ? Routes.PROFILE_SHEET : Routes.SHOWCASE_SHEET,
              {
                address: ensName || addressOrENS,
                fromRoute: 'Deeplink',
              }
            );
          } else {
            logger.warn(`handleDeeplink: invalid address or ENS provided`, {
              url,
              protocol,
              host,
              pathname,
              query,
              addressOrENS,
            });
          }
        } else {
          /**
           * This is a catch-all for any other deep links that we don't handle
           */
          logger.warn(`handleDeeplink: invalid or unknown deeplink`, {
            url,
            protocol,
            host,
            pathname,
            query,
          });
        }
      }
    }
    // Android uses normal deeplinks
  } else if (protocol === 'wc:') {
    logger.info(`handleDeeplink: wc:// protocol`);
    handleWalletConnect(url);
  }
}

function handleWalletConnect(uri: string) {
  const { query } = new URL(uri);
  const parsedUri = uri ? parseUri(uri) : null;

  logger.debug(`handleWalletConnect`, { uri, query, parsedUri });

  if (uri && query && parsedUri && parsedUri.version === 1) {
    store.dispatch(walletConnectSetPendingRedirect());
    store.dispatch(
      walletConnectOnSessionRequest(uri, (status: any, dappScheme: any) => {
        logger.debug(`walletConnectOnSessionRequest callback`, {
          status,
          dappScheme,
        });
        const type = status === 'approved' ? 'connect' : status;
        store.dispatch(walletConnectRemovePendingRedirect(type, dappScheme));
      })
    );
  } else if (
    uri &&
    query &&
    parsedUri &&
    parsedUri.version === 2 &&
    getExperimetalFlag(WC_V2)
  ) {
    setHasPendingDeeplinkPendingRedirect(true);
    pairWalletConnect({ uri });
  } else {
    // This is when we get focused by WC due to a signing request
    store.dispatch(walletConnectSetPendingRedirect());
  }
}
