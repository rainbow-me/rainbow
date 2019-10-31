import delay from 'delay';
import { isNil } from 'lodash';
import { Alert } from 'react-native';
import { connect } from 'react-redux';
import { compose, withHandlers } from 'recompact';
import { getIsWalletEmpty } from '../handlers/localstorage/accountLocal';
import { hasEthBalance } from '../handlers/web3';
import { dataClearState, dataLoadState } from '../redux/data';
import { explorerClearState, explorerInit } from '../redux/explorer';
import { gasClearState, gasPricesInit } from '../redux/gas';
import { clearIsWalletEmpty } from '../redux/isWalletEmpty';
import { setIsWalletEthZero } from '../redux/isWalletEthZero';
import { nonceClearState } from '../redux/nonce';
import { clearOpenFamilyTab } from '../redux/openFamilyTabs';
import { requestsLoadState, requestsClearState } from '../redux/requests';
import {
  settingsLoadState,
  settingsUpdateAccountAddress,
} from '../redux/settings';
import {
  uniswapLoadState,
  uniswapClearState,
  uniswapUpdateState,
} from '../redux/uniswap';
import {
  uniqueTokensClearState,
  uniqueTokensLoadState,
  uniqueTokensRefreshState,
} from '../redux/uniqueTokens';
import {
  web3ListenerClearState,
  web3ListenerInit,
} from '../redux/web3listener';
import { walletInit } from '../model/wallet';
import {
  walletConnectLoadState,
  walletConnectClearState,
} from '../redux/walletconnect';
import { promiseUtils } from '../utils';
import withHideSplashScreen from './withHideSplashScreen';

export default Component =>
  compose(
    connect(
      null,
      {
        clearIsWalletEmpty,
        clearOpenFamilyTab,
        dataClearState,
        dataLoadState,
        explorerClearState,
        explorerInit,
        gasClearState,
        gasPricesInit,
        nonceClearState,
        requestsClearState,
        requestsLoadState,
        setIsWalletEthZero,
        settingsLoadState,
        settingsUpdateAccountAddress,
        uniqueTokensClearState,
        uniqueTokensLoadState,
        uniqueTokensRefreshState,
        uniswapClearState,
        uniswapLoadState,
        uniswapUpdateState,
        walletConnectClearState,
        walletConnectLoadState,
        web3ListenerInit,
      }
    ),
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
        web3ListenerClearState();
        const p0 = ownProps.explorerClearState();
        const p1 = ownProps.dataClearState();
        const p2 = ownProps.clearIsWalletEmpty();
        const p3 = ownProps.uniqueTokensClearState();
        const p4 = ownProps.clearOpenFamilyTab();
        const p5 = ownProps.walletConnectClearState();
        const p6 = ownProps.nonceClearState();
        const p7 = ownProps.requestsClearState();
        const p8 = ownProps.uniswapClearState();
        const p9 = ownProps.gasClearState();
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
          p9,
        ]);
      },
      initializeAccountData: ownProps => async () => {
        try {
          ownProps.explorerInit();
          ownProps.gasPricesInit();
          ownProps.web3ListenerInit();
          await ownProps.uniqueTokensRefreshState();
        } catch (error) {
          // TODO error state
          console.log('Error initializing account data: ', error);
        }
      },
      loadAccountData: ownProps => async () => {
        const p1 = ownProps.settingsLoadState();
        const p2 = ownProps.dataLoadState();
        const p3 = ownProps.uniqueTokensLoadState();
        const p4 = ownProps.walletConnectLoadState();
        const p5 = ownProps.uniswapLoadState();
        const p6 = ownProps.requestsLoadState();
        return promiseUtils.PromiseAllWithFails([p1, p2, p3, p4, p5, p6]);
      },
      refreshAccountData: ownProps => async () => {
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
          throw error;
        }
      },
    }),
    withHandlers({
      initializeWallet: ownProps => async seedPhrase => {
        try {
          const { isImported, isNew, walletAddress } = await walletInit(
            seedPhrase
          );
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
            await ownProps.checkEthBalance(walletAddress);
          } else {
            const isWalletEmpty = await getIsWalletEmpty(
              walletAddress,
              'mainnet'
            );
            if (isNil(isWalletEmpty)) {
              ownProps.checkEthBalance(walletAddress);
            } else {
              ownProps.setIsWalletEthZero(isWalletEmpty);
            }
          }
          if (!(isImported || isNew)) {
            await ownProps.loadAccountData();
          }
          ownProps.onHideSplashScreen();
          ownProps.initializeAccountData();
          return walletAddress;
        } catch (error) {
          // TODO specify error states more granular
          ownProps.onHideSplashScreen();
          Alert.alert(
            'Import failed due to an invalid private key. Please try again.'
          );
          return null;
        }
      },
    })
  )(Component);
