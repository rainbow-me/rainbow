import { isNull } from 'lodash';
import { Alert } from 'react-native';
import { connect } from 'react-redux';
import { compose, withHandlers } from 'recompact';
import { getIsWalletEmpty } from '../handlers/commonStorage';
import { hasEthBalance } from '../handlers/web3';
import { withHideSplashScreen } from '../hoc';
import {
  dataClearState,
  dataLoadState, dataInit,
} from '../redux/data';
import { clearIsWalletEmpty, loadIsWalletEmpty } from '../redux/isWalletEmpty';
import { setIsWalletEthZero } from '../redux/isWalletEthZero';
import { nonceClearState } from '../redux/nonce';
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

export default Component => compose(
  connect(null, {
    clearIsWalletEmpty,
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
    clearAccountData: (ownProps) => async () => {
      // TODO
      try {
        ownProps.dataClearState();
        ownProps.clearIsWalletEmpty();
        ownProps.uniqueTokensClearState();
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
      }
    },
    loadAccountData: (ownProps) => async () => {
      try {
        await ownProps.settingsLoadState();
      } catch (error) {
      }
      try {
        await ownProps.dataLoadState();
      } catch (error) {
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
        return Promise.all([getUniswap, getUniqueTokens]);
      } catch (error) {
        throw error;
      }
    },
    checkEthBalance: (ownProps) => async (walletAddress) => {
      try {
        const ethBalance = await hasEthBalance(walletAddress);
        ownProps.setIsWalletEthZero(!ethBalance);
      } catch (error) {
        console.log('Error: Checking eth balance', error);
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
            ownProps.setIsWalletEthZero(isWalletEmpty) 
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
