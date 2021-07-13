import qs from 'qs';
import { Alert } from 'react-native';
import URL from 'url-parse';
import store from '../redux/store';
import {
  walletConnectOnSessionRequest,
  walletConnectRemovePendingRedirect,
  walletConnectSetPendingRedirect,
} from '../redux/walletconnect';
import { checkIsValidAddressOrDomain } from '@rainbow-me/helpers/validators';
import { Navigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';

export default function handleDeeplink(url) {
  const urlObj = new URL(url);
  // iOS uses universal links
  if (urlObj.protocol === 'https:') {
    const action = urlObj.pathname.split('/')[1];
    switch (action) {
      case 'wc': {
        const { uri } = qs.parse(urlObj.query.substring(1));
        handleWalletConnect(uri);
        break;
      }
      default: {
        const addressOrENS = urlObj.pathname?.split('/')?.[1] || '';
        if (checkIsValidAddressOrDomain(addressOrENS)) {
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
        if (status === 'reject') {
          dispatch(walletConnectRemovePendingRedirect('reject', dappScheme));
        } else {
          dispatch(walletConnectRemovePendingRedirect('connect', dappScheme));
        }
      })
    );
  } else {
    // This is when we get focused by WC due to a signing request
  }
}
