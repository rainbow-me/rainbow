import { get, isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import {
  accountLoadState,
  settingsInitializeState,
  settingsUpdateAccountAddress,
} from '@rainbow-me/rainbow-common';
import React, { Component } from 'react';
import { Alert, AppRegistry, AppState } from 'react-native';
import CodePush from 'react-native-code-push';
import { StackActions } from 'react-navigation';
import firebase from 'react-native-firebase';
import { useScreens } from 'react-native-screens';
import { connect, Provider } from 'react-redux';
import { compose, withProps } from 'recompact';
import { FlexItem } from './components/layout';
import OfflineBadge from './components/OfflineBadge';
import {
  withAccountRefresh,
  withHideSplashScreen,
  withRequestsInit,
  withWalletConnectConnections,
} from './hoc';
import store from './redux/store';
import { walletInit } from './model/wallet';
import {
  saveFCMToken,
  registerTokenRefreshListener,
  registerNotificationListener,
  registerNotificationOpenedListener,
} from './model/firebase';
import Routes from './screens/Routes';
import Navigation from './navigation';

if (process.env.NODE_ENV === 'development') {
  console.disableYellowBox = true;
}

useScreens();

class App extends Component {
  static propTypes = {
    accountLoadState: PropTypes.func,
    getValidWalletConnectors: PropTypes.func,
    onHideSplashScreen: PropTypes.func,
    refreshAccount: PropTypes.func,
    settingsInitializeState: PropTypes.func,
    settingsUpdateAccountAddress: PropTypes.func,
    walletConnectInitAllConnectors: PropTypes.func,
    sortedWalletConnectors: PropTypes.arrayOf(PropTypes.object),
    transactionsToApproveInit: PropTypes.func,
  }

  state = { appState: AppState.currentState }

  navigatorRef = null

  async componentDidMount() {
    await this.handleWalletConfig();
    this.props.onHideSplashScreen();
    await this.props.refreshAccount();

    saveFCMToken();
    this.onTokenRefreshListener = registerTokenRefreshListener();

    //this.notificationListener = registerNotificationListener();

    //this.notificationOpenedListener = registerNotificationOpenedListener();

    this.notificationListener = firebase.notifications().onNotification(notification => {
      const navState = get(this.navigatorRef, 'state.nav');
      const route = Navigation.getActiveRouteName(navState);
      const { callId, sessionId } = notification.data;
      if (route === 'ConfirmRequest') {
        this.fetchAndAddWalletConnectRequest(callId, sessionId)
          .then(transaction => {
            const localNotification = new firebase.notifications.Notification()
              .setTitle(notification.title)
              .setBody(notification.body)
              .setData(notification.data);

            firebase.notifications().displayNotification(localNotification);
          });
      } else {
        this.onPushNotificationOpened(callId, sessionId, true);
      }
    });

    this.notificationOpenedListener = firebase.notifications().onNotificationOpened(notificationOpen => {
      const { callId, sessionId } = notificationOpen.notification.data;
      this.onPushNotificationOpened(callId, sessionId, false);
    });
  }

  handleWalletConfig = async (seedPhrase) => {
    try {
      const { isWalletBrandNew, walletAddress } = await walletInit(seedPhrase);
      this.props.settingsUpdateAccountAddress(walletAddress, 'RAINBOWWALLET');
      if (isWalletBrandNew) {
        return walletAddress;
      }
      this.props.settingsInitializeState();
      this.props.accountLoadState();
      this.props.walletConnectInitAllConnectors();
      this.props.transactionsToApproveInit();
        /*
      const notificationOpen = await firebase.notifications().getInitialNotification();
      if (notificationOpen) {
        const { callId, sessionId } = notificationOpen.notification.data;
        this.onPushNotificationOpened(callId, sessionId, false);
      }
      */
      return walletAddress;
    } catch (error) {
      Alert.alert('Error: Failed to initialize wallet.');
      return null;
    }
  }

  componentWillUnmount() {
    this.notificationListener();
    this.notificationOpenedListener();
    this.onTokenRefreshListener();
  }

  handleNavigatorRef = (navigatorRef) => Navigation.setTopLevelNavigator(navigatorRef)

  handleOpenConfirmTransactionModal = (transactionDetails, autoOpened) => {
    if (!this.navigatorRef) return;
    const action = StackActions.push({
      params: { autoOpened, transactionDetails },
      routeName: 'ConfirmRequest',
    });
    Navigation.handleAction(this.navigatorRef, action);
  }

  onPushNotificationOpened = async (callId, sessionId, autoOpened) => {
    const transaction = await this.fetchAndAddWalletConnectRequest(callId, sessionId);
    if (transaction) {
      this.handleOpenConfirmTransactionModal(transaction, autoOpened);
    } else {
      const fetchedTransaction = null; //this.props.transactionIfExists(callId);
      if (fetchedTransaction) {
        this.handleOpenConfirmTransactionModal(fetchedTransaction, autoOpened);
      } else {
        Alert.alert('This request has expired.');
      }
    }
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
  withAccountRefresh,
  withRequestsInit,
  withHideSplashScreen,
  withWalletConnectConnections,
  connect(
    null,
    {
      accountLoadState,
      settingsInitializeState,
      settingsUpdateAccountAddress,
    },
  ),
)(App);

const AppWithCodePush = CodePush({
  checkFrequency: CodePush.CheckFrequency.ON_APP_RESUME,
  installMode: CodePush.InstallMode.ON_NEXT_RESUME,
})(AppWithRedux);

AppRegistry.registerComponent('Rainbow', () => AppWithCodePush);
