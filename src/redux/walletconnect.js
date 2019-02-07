import { isFuture } from 'date-fns';
import {
  omitBy, pickBy, forEach, mapValues, values,
} from 'lodash';
import { commonStorage } from 'balance-common';
import { AlertIOS } from 'react-native';
import lang from 'i18n-js';
import WalletConnect from '@walletconnect/react-native';
import { DEVICE_LANGUAGE } from '../helpers/constants';
import { getFCMToken, checkPushNotificationPermissions } from '../model/firebase';
import { addTransactionToApprove } from './transactionsToApprove';
import Navigation from '../navigation';

// -- Constants --------------------------------------- //

const WALLETCONNECT_NEW_SESSION = 'walletconnect/WALLETCONNECT_NEW_SESSION';

// -- Actions ---------------------------------------- //

const getNativeOptions = async () => {
  const language = DEVICE_LANGUAGE.replace(/[-_](\w?)+/gi, '').toLowerCase();
  const token = await getFCMToken();

  const nativeOptions = {
    clientMeta: {
      description: 'Store and secure all your ERC-20 tokens in one place',
      url: 'https://balance.io',
      icons: ['https://avatars0.githubusercontent.com/u/19879255?s=200&v=4'],
      name: 'Balance Wallet',
      ssl: true,
    },
    push: {
      url: 'https://us-central1-balance-424a3.cloudfunctions.net',
      type: 'fcm',
      token,
      peerMeta: true,
      language,
    },
  };

  return nativeOptions;
};

export const walletConnectInitNewSession = (uriString) => async (dispatch, getState) => {
  const { accountAddress, chainId } = getState().settings;
  let result = null;
  try {
    const nativeOptions = await getNativeOptions();
    try {
      const walletConnector = new WalletConnect(
        {
          uri: uriString,
        },
        nativeOptions,
      );
      await walletConnector.approveSession({ chainId, accounts: [accountAddress] });
      await commonStorage.saveWalletConnectSession(walletConnector.peerId, walletConnector.session);
      result = walletConnector;
    } catch (error) {
      console.log(error);
      AlertIOS.alert(lang.t('wallet.wallet_connect.error'));
    }
  } catch (error) {
    AlertIOS.alert(lang.t('wallet.wallet_connect.missing_fcm'));
  }
  if (result) {
    await checkPushNotificationPermissions();
    dispatch(addWalletConnector(result));
  }
};

export const walletConnectInitAllConnectors = () => async dispatch => {
  let allConnectors = {};
  try {
    const allSessions = await commonStorage.getAllValidWalletConnectSessions();

    const nativeOptions = getNativeOptions();

    allConnectors = mapValues(allSessions, session => {
      const walletConnector = new WalletConnect(
        {
          session,
        },
        nativeOptions,
      );
      return walletConnector;
    });
  } catch (error) {
    AlertIOS.alert('Unable to retrieve all WalletConnect sessions.');
    allConnectors = {};
  }
  if (allConnectors) {
    dispatch(setWalletConnectors(allConnectors));
  }
};

export const walletConnectDisconnectAllByDappName = dappName => async dispatch => {
  const validSessions = dispatch(getValidWalletConnectors());
  const walletConnectors = values(pickBy(validSessions, session => session.dappName === dappName));
  try {
    const peerIds = values(mapValues(walletConnectors, walletConnector => walletConnector.peerId));
    await commonStorage.removeWalletConnectSessions(peerIds);
    forEach(walletConnectors, walletConnector => walletConnector.killSession());
    dispatch(removeWalletConnectorByDapp(dappName));
  } catch (error) {
    AlertIOS.alert('Failed to disconnect all WalletConnect sessions');
  }
};

export const walletConnectSendStatus = (peerId, requestId, result) => async (dispatch, getState) => {
  const walletConnector = getState().walletconnect.walletConnectors[peerId];
  if (walletConnector) {
    try {
      if (result) {
        await walletConnector.approveCallRequest(requestId, { result });
      } else {
        await walletConnector.rejectCallRequest(requestId);
      }
    } catch (error) {
      AlertIOS.alert('Failed to send request status to WalletConnect.');
    }
  } else {
    AlertIOS.alert('WalletConnect session has expired while trying to send request status. Please reconnect.');
  }
};

export const addWalletConnector = walletConnector => (dispatch, getState) => {
  if (walletConnector) {
    walletConnector.on('wc_sessionRequest', (error, payload) => {
      if (error) {
        throw error;
      }

      // Display Session Request Modal
    });

    walletConnector.on('call_request', (error, payload) => {
      if (error) {
        throw error;
      }

      const { peerId } = walletConnector;
      const requestId = payload.id;
      const dappName = walletConnector.peerMeta.name;
      const autoOpened = true;

      const transactionDetails = dispatch(addTransactionToApprove(peerId, requestId, payload, dappName));

      if (transactionDetails) {
        const action = {
          routeName: 'ConfirmRequest',
          params: { transactionDetails, autoOpened },
        };
        Navigation.handleAction(action);
      } else {
        AlertIOS.alert('This request has expired.');
      }
    });

    walletConnector.on('disconnect', (error, payload) => {
      if (error) {
        throw error;
      }

      // disconnect walletConnector
      dispatch(walletConnectDisconnectAllByDappName(walletConnector.peerMeta.name))
    });

    const { walletConnectors } = getState().walletconnect;
    const updatedWalletConnectors = { ...walletConnectors, [walletConnector.peerId]: walletConnector };
    dispatch({ payload: updatedWalletConnectors, type: WALLETCONNECT_NEW_SESSION });
  }
};

export const getValidWalletConnectors = () => (dispatch, getState) => {
  const { walletConnectors } = getState().walletconnect;
  const validConnectors = pickBy(walletConnectors, ({ expires }) => isFuture(expires));
  dispatch({ payload: validConnectors, type: WALLETCONNECT_NEW_SESSION });
  return validConnectors;
};

export const removeWalletConnectorByDapp = dappName => (dispatch, getState) => {
  const { walletConnectors } = getState().walletconnect;
  dispatch({
    payload: omitBy(walletConnectors, ({ dappName: _dappName }) => _dappName === dappName),
    type: WALLETCONNECT_NEW_SESSION,
  });
};

export const setWalletConnectors = walletConnectors => dispatch => dispatch({
  payload: walletConnectors,
  type: WALLETCONNECT_NEW_SESSION,
});

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  walletConnectors: {},
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case WALLETCONNECT_NEW_SESSION:
      return { ...state, walletConnectors: action.payload };
    default:
      return state;
  }
};
