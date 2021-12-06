// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'qs'.... Remove this comment to see the full error message
import qs from 'qs';
import { Alert } from 'react-native';
import URL from 'url-parse';
import store from '../redux/store';
import {
  walletConnectOnSessionRequest,
  walletConnectRemovePendingRedirect,
  walletConnectSetPendingRedirect,
} from '../redux/walletconnect';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/utilities'... Remove this comment to see the full error message
import { delay } from '@rainbow-me/helpers/utilities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/validators... Remove this comment to see the full error message
import { checkIsValidAddressOrDomain } from '@rainbow-me/helpers/validators';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { Navigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { ethereumUtils } from '@rainbow-me/utils';

export default async function handleDeeplink(url: any) {
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
