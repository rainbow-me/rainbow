import { captureException } from '@sentry/react-native';
import delay from 'delay';
import { isNil } from 'lodash';
import { Alert } from 'react-native';
import { connect } from 'react-redux';
import { compose, withHandlers } from 'recompact';
import {
  getIsWalletEmpty,
  getAccountInfo,
} from '../handlers/localstorage/accountLocal';
import { hasEthBalance } from '../handlers/web3';
import networkTypes from '../helpers/networkTypes';
import { walletInit } from '../model/wallet';
import {
  dataClearState,
  dataLoadState,
  dataTokenOverridesInit,
} from '../redux/data';
import { explorerClearState, explorerInit } from '../redux/explorer';
import { gasPricesStartPolling } from '../redux/gas';
import { clearIsWalletEmpty } from '../redux/isWalletEmpty';
import { setIsWalletEthZero } from '../redux/isWalletEthZero';
import { nonceClearState } from '../redux/nonce';
import { contactsLoadState } from '../redux/contacts';
import {
  clearOpenStateSettings,
  openStateSettingsLoadState,
} from '../redux/openStateSettings';
import { requestsLoadState, requestsClearState } from '../redux/requests';
import {
  settingsLoadNetwork,
  settingsLoadState,
  settingsUpdateAccountAddress,
  settingsUpdateAccountName,
  settingsUpdateAccountColor,
} from '../redux/settings';
import {
  uniswapLoadState,
  uniswapClearState,
  uniswapPairsInit,
  uniswapUpdateState,
} from '../redux/uniswap';
import {
  uniqueTokensClearState,
  uniqueTokensLoadState,
  uniqueTokensRefreshState,
} from '../redux/uniqueTokens';
import {
  walletConnectLoadState,
  walletConnectClearState,
} from '../redux/walletconnect';

import { promiseUtils, sentryUtils } from '../utils';
import withHideSplashScreen from './withHideSplashScreen';
import store from '../redux/store';

export default Component =>
  compose(
    connect(null, {
      clearIsWalletEmpty,
      clearOpenStateSettings,
      contactsLoadState,
      dataClearState,
      dataLoadState,
      dataTokenOverridesInit,
      explorerClearState,
      explorerInit,
      gasPricesStartPolling,
      nonceClearState,
      openStateSettingsLoadState,
      requestsClearState,
      requestsLoadState,
      setIsWalletEthZero,
      settingsLoadNetwork,
      settingsLoadState,
      settingsUpdateAccountAddress,
      uniqueTokensClearState,
      uniqueTokensLoadState,
      uniqueTokensRefreshState,
      uniswapClearState,
      uniswapLoadState,
      uniswapPairsInit,
      uniswapUpdateState,
      walletConnectClearState,
      walletConnectLoadState,
    }),
    withHideSplashScreen,
    withHandlers({
      checkEthBalance: ownProps => async walletAddress => {
        try {
          const ethBalance = await hasEthBalance(walletAddress);
          ownProps.setIsWalletEthZero(!ethBalance);
        } catch (error) {
          console.log('Error: Checking eth balance', error);
        }
      },
      clearAccountData: ownProps => async () => {
        const p0 = ownProps.explorerClearState();
        const p1 = ownProps.dataClearState();
        const p2 = ownProps.clearIsWalletEmpty();
        const p3 = ownProps.uniqueTokensClearState();
        const p4 = ownProps.clearOpenStateSettings();
        const p5 = ownProps.walletConnectClearState();
        const p6 = ownProps.nonceClearState();
        const p7 = ownProps.requestsClearState();
        const p8 = ownProps.uniswapClearState();
        return promiseUtils.PromiseAllWithFails([
          p0,
          p1,
          p2,
          p3,
          p4,
          p5,
          p6,
          p7,
          p8,
        ]);
      },
      initializeAccountData: ownProps => async () => {
        try {
          // await ownProps.dataTokenOverridesInit();
          sentryUtils.addInfoBreadcrumb('Initialize account data');
          console.log('Initialize account data for ', ownProps.network);
          ownProps.explorerInit();
          ownProps.uniswapPairsInit();
          await ownProps.uniqueTokensRefreshState();
        } catch (error) {
          // TODO error state
          console.log('Error initializing account data: ', error);
          captureException(error);
        }
      },
      loadAccountData: ownProps => async () => {
        sentryUtils.addInfoBreadcrumb('Load wallet data');
        await ownProps.openStateSettingsLoadState();
        const promises = [];
        const p1 = ownProps.settingsLoadState();
        promises.push(p1);
        if (ownProps.network === networkTypes.mainnet) {
          const p2 = ownProps.dataLoadState();
          promises.push(p2);
          const p3 = ownProps.uniqueTokensLoadState();
          promises.push(p3);
          const p4 = ownProps.walletConnectLoadState();
          promises.push(p4);
          const p5 = ownProps.requestsLoadState();
          promises.push(p5);
        }

        const p6 = ownProps.uniswapLoadState();
        promises.push(p6);
        const p7 = ownProps.contactsLoadState();
        promises.push(p7);

        return promiseUtils.PromiseAllWithFails(promises);
      },
      refreshAccountData: ownProps => async () => {
        // Nothing to refresh for testnets
        if (ownProps.network !== networkTypes.mainnet) {
          return Promise.all([delay(1250)]);
        }

        try {
          const getUniswap = ownProps.uniswapUpdateState();
          const getUniqueTokens = ownProps.uniqueTokensRefreshState();

          return Promise.all([
            delay(1250), // minimum duration we want the "Pull to Refresh" animation to last
            getUniswap,
            getUniqueTokens,
          ]);
        } catch (error) {
          console.log('Error refreshing data', error);
          captureException(error);
          throw error;
        }
      },
    }),
    withHandlers({
      initializeWallet: ownProps => async seedPhrase => {
        try {
          sentryUtils.addInfoBreadcrumb('Start wallet setup');
          // Load the network first
          await ownProps.settingsLoadNetwork();

          const { isImported, isNew, walletAddress } = await walletInit(
            seedPhrase
          );
          const info = await getAccountInfo(walletAddress, ownProps.network);
          if (info.name && info.color) {
            store.dispatch(settingsUpdateAccountName(info.name));
            store.dispatch(settingsUpdateAccountColor(info.color));
          }
          if (isNil(walletAddress)) {
            Alert.alert(
              'Import failed due to an invalid private key. Please try again.'
            );
            return null;
          }
          if (isImported) {
            await ownProps.clearAccountData();
          }
          ownProps.settingsUpdateAccountAddress(walletAddress);
          if (isNew) {
            ownProps.setIsWalletEthZero(true);
          } else if (isImported) {
            try {
              await ownProps.checkEthBalance(walletAddress);
              // eslint-disable-next-line no-empty
            } catch (error) {}
          } else {
            const isWalletEmpty = await getIsWalletEmpty(
              walletAddress,
              ownProps.network
            );
            if (isNil(isWalletEmpty)) {
              ownProps.checkEthBalance(walletAddress);
            } else {
              ownProps.setIsWalletEthZero(isWalletEmpty);
            }
            await ownProps.loadAccountData();
          }
          ownProps.onHideSplashScreen();
          sentryUtils.addInfoBreadcrumb('Hide splash screen');
          ownProps.initializeAccountData();
          return walletAddress;
        } catch (error) {
          // TODO specify error states more granular
          ownProps.onHideSplashScreen();
          captureException(error);
          Alert.alert(
            'Import failed due to an invalid private key. Please try again.'
          );
          return null;
        }
      },
    })
  )(Component);
