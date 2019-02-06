import {
  accountLoadState,
  settingsInitializeState,
  settingsUpdateAccountAddress,
} from 'balance-common';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Piwik from 'react-native-matomo';
import { AlertIOS, AppRegistry, AppState } from 'react-native';
import { StackActions } from 'react-navigation';
import CodePush from 'react-native-code-push';
import { connect, Provider } from 'react-redux';
import { compose, withProps } from 'recompact';
import { FlexItem } from './components/layout';
import OfflineBadge from './components/OfflineBadge';
import {
  withTrackingDate,
  withWalletConnectConnections,
} from './hoc';
import {
  addTransactionToApprove,
  transactionIfExists,
  transactionsToApproveInit,
} from './redux/transactionsToApprove';
import store from './redux/store';
import { walletInit } from './model/wallet';
import {
  saveFCMToken,
  registerTokenRefreshListener,
  registerNotificationListener,
  registerNotificationOpenedListener,
  getInitialNotification,
} from './model/firebase';
import Routes from './screens/Routes';
import Navigation from './navigation';

if (process.env.NODE_ENV === 'development') {
  console.log('process', process);
  console.disableYellowBox = true;
}

class App extends Component {
  static propTypes = {
    accountLoadState: PropTypes.func,
    addTransactionToApprove: PropTypes.func,
    getValidWalletConnectors: PropTypes.func,
    settingsInitializeState: PropTypes.func,
    settingsUpdateAccountAddress: PropTypes.func,
    walletConnectInitAllConnectors: PropTypes.func,
    sortedWalletConnectors: PropTypes.arrayOf(PropTypes.object),
    trackingDateInit: PropTypes.func,
    transactionIfExists: PropTypes.func,
    transactionsToApproveInit: PropTypes.func,
  }

  state = { appState: AppState.currentState }

  navigatorRef = null

  async componentDidMount() {
    Piwik.initTracker('https://matomo.balance.io/piwik.php', 2);

    AppState.addEventListener('change', this.handleAppStateChange);

    saveFCMToken();

    this.onTokenRefreshListener = registerTokenRefreshListener();

    this.notificationListener = registerNotificationListener();

    this.notificationOpenedListener = registerNotificationOpenedListener();
  }

  handleWalletConfig = async (seedPhrase) => {
    try {
      this.props.trackingDateInit();
      const walletAddress = await walletInit(seedPhrase);
      this.props.settingsInitializeState();
      this.props.settingsUpdateAccountAddress(walletAddress, 'BALANCEWALLET');
      this.props.accountLoadState();
      this.props.transactionsToApproveInit();
      this.props.walletConnectInitAllConnectors();
      const notificationOpen = await getInitialNotification();
      if (!notificationOpen) {
        // deleted fetchAllRequestsFromWalletConnectSessions()
      }
      return walletAddress;
    } catch (error) {
      AlertIOS.alert('Error: Failed to initialize wallet.');
      return null;
    }
  }

  handleAppStateChange = async (nextAppState) => {
    if (this.state.appState.match(/unknown|background/) && nextAppState === 'active') {
      Piwik.trackEvent('screen', 'view', 'app');
      // deleted fetchAllRequestsFromWalletConnectSessions()
    }
    this.setState({ appState: nextAppState });
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this.handleAppStateChange);
    this.notificationListener();
    this.notificationOpenedListener();
    this.onTokenRefreshListener();
  }

  handleNavigatorRef = (navigatorRef) => { this.navigatorRef = navigatorRef; }

  handleOpenConfirmTransactionModal = (transactionDetails, autoOpened) => {
    if (!this.navigatorRef) return;
    const action = StackActions.push({
      routeName: 'ConfirmRequest',
      params: { transactionDetails, autoOpened },
    });
    Navigation.handleAction(this.navigatorRef, action);
  }

  render = () => (
    <Provider store={store}>
      <FlexItem>
        <OfflineBadge />
        <Routes
          ref={this.handleNavigatorRef}
          screenProps={{ handleWalletConfig: this.handleWalletConfig }}
        />
      </FlexItem>
    </Provider>
  )
}

const AppWithRedux = compose(
  withProps({ store }),
  withTrackingDate,
  withWalletConnectConnections,
  connect(
    null,
    {
      accountLoadState,
      addTransactionToApprove,
      settingsInitializeState,
      settingsUpdateAccountAddress,
      transactionIfExists,
      transactionsToApproveInit,
    },
  ),
)(App);

const AppWithCodePush = CodePush({
  checkFrequency: CodePush.CheckFrequency.ON_APP_RESUME,
  installMode: CodePush.InstallMode.ON_NEXT_RESUME,
})(AppWithRedux);

AppRegistry.registerComponent('BalanceWallet', () => AppWithCodePush);
