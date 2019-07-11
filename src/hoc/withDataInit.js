import { Alert } from 'react-native';
import { connect } from 'react-redux';
import { compose, withHandlers } from 'recompact';
import { hasEthBalance } from '../handlers/web3';
import {
  dataClearState,
  dataLoadState,
  dataInit,
} from '../redux/data';
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
  withHandlers({
    clearAccountData: (ownProps) => async () => {
      try {
        ownProps.dataClearState();
        ownProps.uniqueTokensClearState();
        ownProps.walletConnectClearState();
        ownProps.nonceClearState();
        ownProps.requestsClearState();
        ownProps.uniswapClearState();
      } catch (error) {
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
        await ownProps.uniqueTokensLoadState();
      } catch (error) {
      }
      try {
        await ownProps.dataLoadState();
      } catch (error) {
      }
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
  }),
  withHandlers({
    initializeWallet: (ownProps) => async (seedPhrase) => {
      try {
        const { isWalletBrandNew, walletAddress } = await walletInit(seedPhrase);
        ownProps.settingsUpdateAccountAddress(walletAddress, 'RAINBOWWALLET');
        try {
          const ethBalance = await hasEthBalance(walletAddress);
          this.props.setIsWalletEthZero(!ethBalance);
        } catch (error) {
        }
        if (!isWalletBrandNew) {
          await ownProps.loadAccountData();
        }
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
