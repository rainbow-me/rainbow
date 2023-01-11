import { captureException } from '@sentry/react-native';
import lang from 'i18n-js';
import qs from 'qs';
import URL from 'url-parse';
import { parseUri } from '@walletconnect/utils';
import { initialChartExpandedStateSheetHeight } from '../components/expanded-state/asset/ChartExpandedState';
import store from '../redux/store';
import {
  walletConnectOnSessionRequest,
  walletConnectRemovePendingRedirect,
  walletConnectSetPendingRedirect,
} from '../redux/walletconnect';
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
import { ETH_ADDRESS } from '@/references';
import Routes from '@/navigation/routesNames';
import { ethereumUtils } from '@/utils';
import { logger } from '@/logger';
import {
  pair as pairWalletConnect,
  setHasPendingDeeplinkPendingRedirect,
} from '@/utils/walletConnect';

// initial research into refactoring deep links
//                         eip      native deeplink  rainbow.me profiles
type supportedProtocols = 'ethereum:' | 'rainbow:' | 'https';
//                      walletconnect - expanded states - tophat updates
type supportedActions = 'wc' | 'token' | 'update-ios' | 'update-android';
// deeplink actions fall under 'host', http, native deeplink,
// EIP needs more research, cant get them to link on sim

export default async function handleDeeplink(
  url: any,
  initialRoute: any = null
) {
  if (!url) return;
  // We need to wait till the wallet is ready
  // to handle any deeplink
  while (store.getState().data.isLoadingAssets) {
    await delay(300);
  }
  const urlObj = new URL(url);
  if (urlObj.protocol === 'ethereum:') {
    ethereumUtils.parseEthereumUrl(url);
  } else if (urlObj.protocol === 'https:' || urlObj.protocol === 'rainbow:') {
    const action =
      urlObj.protocol === 'https:'
        ? urlObj.pathname.split('/')[1]
        : urlObj.host;
    switch (action) {
      case 'wc': {
        // @ts-expect-error ts-migrate(2722) FIXME: Cannot invoke an object which is possibly 'undefin... Remove this comment to see the full error message
        const { uri } = qs.parse(urlObj.query.substring(1));
        handleWalletConnect(uri);
        break;
      }
      case 'token': {
        const { dispatch } = store;
        // @ts-expect-error ts-migrate(2722) FIXME: Cannot invoke an object which is possibly 'undefin... Remove this comment to see the full error message
        const { addr } = qs.parse(urlObj.query?.substring(1));
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
            const action = (asset: any) => {
              Navigation.handleAction(Routes.EXPANDED_ASSET_SHEET, {
                asset,
                fromDiscover: true,
                longFormHeight: initialChartExpandedStateSheetHeight,
                type: 'token',
              });
            };

            if (asset) {
              action(asset);
            } else {
              dispatch(emitAssetRequest(address));
              dispatch(emitChartsRequest(address));
              scheduleActionOnAssetReceived(address, action);
            }
          }, 50);
        }
        break;
      }
      case 'update-ios': {
        const code = urlObj.pathname.split('/')[2];
        if (android) {
          Alert.alert(lang.t('deeplinks.tried_to_use_ios'));
        } else {
          setDeploymentKey(code);
        }

        break;
      }

      case 'update-android': {
        const code = urlObj.pathname.split('/')[2];
        if (ios) {
          Alert.alert(lang.t('deeplinks.tried_to_use_android'));
        } else {
          setDeploymentKey(code);
        }
        break;
      }

      default: {
        const addressOrENS = urlObj.pathname?.split('/')?.[1];
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
            const error = new Error('Invalid deeplink: ' + url);
            captureException(error);
            Alert.alert(lang.t('deeplinks.couldnt_recognize_url'));
          }
        }
      }
    }
    // Android uses normal deeplinks
  } else if (urlObj.protocol === 'wc:') {
    handleWalletConnect(url);
  }
}

function handleWalletConnect(uri: any) {
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
