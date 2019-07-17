import delay from 'delay';
import { isNull } from 'lodash';
import { Alert } from 'react-native';
import { connect } from 'react-redux';
import { compose, withHandlers } from 'recompact';
import { getIsWalletEmpty } from '../handlers/commonStorage';
import { hasEthBalance } from '../handlers/web3';
import {
  dataClearState,
  dataLoadState,
  dataInit,
} from '../redux/data';
import { clearIsWalletEmpty, loadIsWalletEmpty } from '../redux/isWalletEmpty';
import { setIsWalletEthZero } from '../redux/isWalletEthZero';
import { nonceClearState } from '../redux/nonce';
import { clearOpenFamilyTab } from '../redux/openFamilyTabs';
import {
  requestsLoadState,
  requestsClearState,
} from '../redux/requests';
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
import { walletInit } from '../model/wallet';
import {
  walletConnectLoadState,
  walletConnectClearState,
} from '../redux/walletconnect';
import withHideSplashScreen from './withHideSplashScreen';

export default Component => compose(
  connect(null, {
    clearIsWalletEmpty,
    clearOpenFamilyTab,
    dataClearState,
    dataInit,
    dataLoadState,
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
  }),
  withHideSplashScreen,
  withHandlers({
    checkEthBalance: (ownProps) => async (walletAddress) => {
      try {
        const ethBalance = await hasEthBalance(walletAddress);
        ownProps.setIsWalletEthZero(!ethBalance);
      } catch (error) {
        console.log('Error: Checking eth balance', error);
      }
    },
    clearAccountData: (ownProps) => async () => {
      // TODO
      try {
        ownProps.dataClearState();
        ownProps.clearIsWalletEmpty();
        ownProps.uniqueTokensClearState();
        ownProps.clearOpenFamilyTab();
        ownProps.walletConnectClearState();
        ownProps.nonceClearState();
        ownProps.requestsClearState();
        ownProps.uniswapClearState();
      } catch (error) {
        console.log('ERROR', error);
      }
    },
    initializeAccountData: (ownProps) => async () => {
      ownProps.dataInit();
      try {
        await ownProps.uniqueTokensRefreshState();
      } catch (error) {
        // TODO
      }
    },
    loadAccountData: (ownProps) => async () => {
      try {
        await ownProps.settingsLoadState();
      } catch (error) {
        // TODO
      }
      try {
        await ownProps.dataLoadState();
      } catch (error) {
        // TODO
      }
      ownProps.uniqueTokensLoadState();
      ownProps.walletConnectLoadState();
      ownProps.uniswapLoadState();
      ownProps.requestsLoadState();
    },
    refreshAccountData: (ownProps) => async () => {
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
    initializeWallet: (ownProps) => async (seedPhrase) => {
      try {
        const { isImported, isNew, walletAddress } = await walletInit(seedPhrase);
        ownProps.settingsUpdateAccountAddress(walletAddress, 'RAINBOWWALLET');
        if (isNew) {
          ownProps.setIsWalletEthZero(true);
        } else if (isImported) {
          await ownProps.checkEthBalance(walletAddress);
        } else {
          const isWalletEmpty = await getIsWalletEmpty(walletAddress, 'mainnet');
          if (isNull(isWalletEmpty)) {
            await ownProps.checkEthBalance(walletAddress);
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
        Alert.alert('Import failed due to an invalid seed phrase. Please try again.');
        return null;
      }
    },
  }),
)(Component);
