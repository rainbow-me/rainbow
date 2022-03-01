import { toLower } from 'lodash';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'qs'.... Remove this comment to see the full error message
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
        const address = toLower(addr);
        if (address && address.length > 0) {
          // @ts-expect-error FIXME: Property 'assets' does not exist on type...
          const { assets: allAssets, genericAssets } = store.getState().data;
          const asset =
            Object.values(genericAssets).find(
              (asset: any) => address === toLower(asset.address)
            ) ||
            (address !== ETH_ADDRESS &&
              allAssets.find(
                (asset: any) => address === toLower(asset.address)
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
      default: {
        const addressOrENS = urlObj.pathname?.split('/')?.[1];
        if (addressOrENS) {
          const isValid = await checkIsValidAddressOrDomain(addressOrENS);
          if (isValid) {
            return Navigation.handleAction(Routes.SHOWCASE_SHEET, {
              address: addressOrENS,
            });
          } else {
            Alert.alert('Uh oh! We couldn’t recognize this URL!');
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
