import { get, isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import {
  accountLoadState,
  settingsInitializeState,
  settingsUpdateAccountAddress,
} from '@rainbow-me/rainbow-common';
import React, { Component } from 'react';
import {
  Alert,
  AppRegistry,
  AppState,
  Linking,
} from 'react-native';
import CodePush from 'react-native-code-push';
import firebase from 'react-native-firebase';
import { useScreens } from 'react-native-screens';
import { StackActions } from 'react-navigation';
import { connect, Provider } from 'react-redux';
import { compose, withProps } from 'recompact';
import {
  saveFCMToken,
  registerTokenRefreshListener,
  registerNotificationListener,
  registerNotificationOpenedListener,
} from './model/firebase';
import {
  withAccountRefresh,
  withHideSplashScreen,
  withRequestsInit,
  withWalletConnectConnections,
  withWalletConnectOnSessionRequest,
} from './hoc';
import { FlexItem } from './components/layout';
import Navigation from './navigation';
import OfflineBadge from './components/OfflineBadge';
import Routes from './screens/Routes';
import store from './redux/store';
import { parseQueryParams } from './utils';
import { walletInit } from './model/wallet';

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
    sortedWalletConnectors: PropTypes.arrayOf(PropTypes.object),
    transactionsToApproveInit: PropTypes.func,
    walletConnectInitAllConnectors: PropTypes.func,
    walletConnectOnSessionRequest: PropTypes.func,
  }

  state = { appState: AppState.currentState }

  navigatorRef = null

  handleOpenLinkingURL = ({ url }) => {
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        const { uri, redirectUrl } = parseQueryParams(url);

        const redirect = () => Linking.openURL(redirectUrl);
        this.props.walletConnectOnSessionRequest(uri, redirect);
      }
    });
	}

  async componentDidMount() {
    Linking.addEventListener('url', handleOpenLinkingURL);
    await this.handleWalletConfig();
    this.props.onHideSplashScreen();
    await this.props.refreshAccount();

    saveFCMToken();
    this.onTokenRefreshListener = registerTokenRefreshListener();
    this.onLinkingListener = this.registerLinkingListener();

    /*
    this.notificationListener = registerNotificationListener();

    this.notificationOpenedListener = registerNotificationOpenedListener();

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
    */
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
      return walletAddress;
    } catch (error) {
      Alert.alert('Error: Failed to initialize wallet.');
      return null;
    }
  }

  componentWillUnmount() {
    Linking.removeEventListener('url', this._handleOpenLinkingURL);
    this.notificationListener();
    this.notificationOpenedListener();
    this.onTokenRefreshListener();
  }

  registerLinkingListener = () => {
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('Initial url is: ' + url);
      }
    }).catch(err => console.error('An error occurred', err));
  };

  handleNavigatorRef = (navigatorRef) => Navigation.setTopLevelNavigator(navigatorRef)

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
  withWalletConnectOnSessionRequest,
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
