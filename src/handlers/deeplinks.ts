import { captureException } from '@sentry/react-native';
import lang from 'i18n-js';
import qs from 'qs';
import { Alert } from 'react-native';
import URL from 'url-parse';
import { initialChartExpandedStateSheetHeight } from '../components/expanded-state/asset/ChartExpandedState';
import store from '../redux/store';
import {
  walletConnectOnSessionRequest,
  walletConnectRemovePendingRedirect,
  walletConnectSetPendingRedirect,
} from '../redux/walletconnect';
import { defaultConfig } from '@rainbow-me/config/experimental';
import { PROFILES } from '@rainbow-me/config/experimentalHooks';
import { setDeploymentKey } from '@rainbow-me/handlers/fedora';
import { delay } from '@rainbow-me/helpers/utilities';
import { checkIsValidAddressOrDomain } from '@rainbow-me/helpers/validators';
import { Navigation } from '@rainbow-me/navigation';
import { scheduleActionOnAssetReceived } from '@rainbow-me/redux/data';
import {
  emitAssetRequest,
  emitChartsRequest,
} from '@rainbow-me/redux/explorer';
import { ETH_ADDRESS } from '@rainbow-me/references';
import Routes from '@rainbow-me/routes';
import { ethereumUtils } from '@rainbow-me/utils';

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
  } else if (urlObj.protocol === 'https:') {
    const action = urlObj.pathname.split('/')[1];
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
          // @ts-expect-error FIXME: Property 'assets' does not exist on type...
          const { assets: allAssets, genericAssets } = store.getState().data;
          const asset =
            Object.values(genericAssets).find(
              (asset: any) => address === asset.address.toLowerCase()
            ) ||
            (address !== ETH_ADDRESS &&
              allAssets.find(
                (asset: any) => address === asset.address.toLowerCase()
              ));

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
            return Navigation.handleAction(
              profilesEnabled ? Routes.PROFILE_SHEET : Routes.SHOWCASE_SHEET,
              {
                address: addressOrENS,
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
  const { dispatch } = store;
  dispatch(walletConnectSetPendingRedirect());
  const { query } = new URL(uri);
  if (uri && query) {
    dispatch(
      walletConnectOnSessionRequest(uri, (status: any, dappScheme: any) => {
        const type = status === 'approved' ? 'connect' : status;
        dispatch(walletConnectRemovePendingRedirect(type, dappScheme));
      })
    );
  } else {
    // This is when we get focused by WC due to a signing request
  }
}
