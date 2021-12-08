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
import Routes from '@rainbow-me/routes';
import { ethereumUtils } from '@rainbow-me/utils';

export default async function handleDeeplink(url) {
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
        const { uri } = qs.parse(urlObj.query.substring(1));
        handleWalletConnect(uri);
        break;
      }
      case 'token': {
        const { dispatch } = store;
        const { addr } = qs.parse(urlObj.query?.substring(1));
        const address = toLower(addr);
        if (address && address.length > 0) {
          const { assets: allAssets, genericAssets } = store.getState().data;
          const asset =
            Object.values(genericAssets).find(
              asset => address === asset.address.toLowerCase()
            ) ||
            (address !== ETH_ADDRESS &&
              allAssets.find(asset => address === asset.address.toLowerCase()));

          const action = asset => {
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
        }
        break;
      }
      default: {
        const addressOrENS = urlObj.pathname?.split('/')?.[1] || '';
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
    // Android uses normal deeplinks
  } else if (urlObj.protocol === 'wc:') {
    handleWalletConnect(url);
  }
}

function handleWalletConnect(uri) {
  const { dispatch } = store;
  dispatch(walletConnectSetPendingRedirect());
  const { query } = new URL(uri);
  if (uri && query) {
    dispatch(
      walletConnectOnSessionRequest(uri, (status, dappScheme) => {
        const type = status === 'approved' ? 'connect' : status;
        dispatch(walletConnectRemovePendingRedirect(type, dappScheme));
      })
    );
  } else {
    // This is when we get focused by WC due to a signing request
  }
}
