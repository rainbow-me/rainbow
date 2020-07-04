import { EventEmitter } from 'events';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import messaging from '@react-native-firebase/messaging';
import analytics from '@segment/analytics-react-native';
import { init as initSentry, setRelease } from '@sentry/react-native';
import { get } from 'lodash';
import nanoid from 'nanoid/non-secure';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { AppRegistry, AppState, unstable_enableLogBox } from 'react-native';
import branch from 'react-native-branch';
// eslint-disable-next-line import/default
import CodePush from 'react-native-code-push';

import {
  REACT_APP_SEGMENT_API_WRITE_KEY,
  SENTRY_ENDPOINT,
  SENTRY_ENVIRONMENT,
} from 'react-native-dotenv';
// eslint-disable-next-line import/default
import RNIOS11DeviceCheck from 'react-native-ios11-devicecheck';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import VersionNumber from 'react-native-version-number';
import { connect, Provider } from 'react-redux';
import { compose, withProps } from 'recompact';
import { FlexItem } from './components/layout';
import { OfflineToast, TestnetToast } from './components/toasts';
import {
  reactNativeDisableYellowBox,
  reactNativeEnableLogbox,
  showNetworkRequests,
  showNetworkResponses,
} from './config/debug';
import { InitialRouteContext } from './context/initialRoute';
import monitorNetwork from './debugging/network';
import handleDeeplink from './handlers/deeplinks';
import {
  getUserBackupState,
  saveUserBackupState,
} from './handlers/localstorage/globalSettings';
import DevContextWrapper from './helpers/DevContext';
import BackupStateTypes from './helpers/backupStateTypes';
import { withAccountSettings } from './hoc';
import { registerTokenRefreshListener, saveFCMToken } from './model/firebase';
import * as keychain from './model/keychain';
import { loadAddress } from './model/wallet';
import { Navigation } from './navigation';
import RoutesComponent from './navigation/Routes';
import Routes from './navigation/routesNames';
import { addNewSubscriber } from './redux/data';
import { requestsForTopic } from './redux/requests';
import store from './redux/store';
import { walletConnectLoadState } from './redux/walletconnect';
import { logger } from 'logger';
import { Portal } from 'react-native-cool-modals/Portal';

const WALLETCONNECT_SYNC_DELAY = 500;

if (__DEV__) {
  console.disableYellowBox = reactNativeDisableYellowBox;
  reactNativeEnableLogbox && unstable_enableLogBox();
  (showNetworkRequests || showNetworkResponses) &&
    monitorNetwork(showNetworkRequests, showNetworkResponses);
} else {
  initSentry({ dsn: SENTRY_ENDPOINT, environment: SENTRY_ENVIRONMENT });
}

CodePush.getUpdateMetadata().then(update => {
  if (update) {
    setRelease(`me.rainbow-${update.appVersion}-codepush:${update.label}`);
  } else {
    setRelease(`me.rainbow-${VersionNumber.appVersion}`);
  }
});

enableScreens();

class App extends Component {
  static propTypes = {
    requestsForTopic: PropTypes.func,
  };

  state = { appState: AppState.currentState, initialRoute: null };

  async componentDidMount() {
    this.identifyFlow();
    AppState.addEventListener('change', this.handleAppStateChange);
    await this.handleInitializeAnalytics();
    saveFCMToken();
    this.onTokenRefreshListener = registerTokenRefreshListener();

    this.foregroundNotificationListener = messaging().onMessage(
      this.onRemoteNotification
    );

    this.backgroundNotificationListener = messaging().onNotificationOpenedApp(
      remoteMessage => {
        setTimeout(() => {
          const topic = get(remoteMessage, 'data.topic');
          this.onPushNotificationOpened(topic);
        }, WALLETCONNECT_SYNC_DELAY);
      }
    );

    this.branchListener = branch.subscribe(({ error, params, uri }) => {
      if (error) {
        logger.error('Error from Branch: ' + error);
      }

      if (params['+non_branch_link']) {
        const nonBranchUrl = params['+non_branch_link'];
        handleDeeplink(nonBranchUrl);
        return;
      } else if (!params['+clicked_branch_link']) {
        // Indicates initialization success and some other conditions.
        // No link was opened.
        return;
      } else if (uri) {
        handleDeeplink(uri);
      }
    });
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this.handleAppStateChange);
    this.onTokenRefreshListener();
    this.foregroundNotificationListener();
    this.backgroundNotificationListener();
    this.branchListener();
  }

  identifyFlow = async () => {
    const address = await loadAddress();
    if (address) {
      this.setState({ initialRoute: Routes.SWIPE_LAYOUT });
      // We need to wait until the wallet initializes
      // otherwise the backup flag might not be set yet
      setTimeout(() => {
        this.setupIncomingNotificationListeners();
      }, 5000);
    } else {
      this.setState({ initialRoute: Routes.WELCOME_SCREEN });
    }
  };

  setupIncomingNotificationListeners = async () => {
    // Previously existing users should see the backup sheet right after app launch
    // Uncomment the line below to get in the existing user state(before icloud)
    // await saveUserBackupState(BackupStateTypes.immediate);
    const backupState = await getUserBackupState();
    if (backupState === BackupStateTypes.immediate) {
      setTimeout(() => {
        Navigation.handleAction(Routes.BACKUP_SHEET, {
          option: 'existing_user',
        });
      }, 1000);
      // New users who are now get an incoming tx
      // now need to go through the backup flow
    } else if (backupState === BackupStateTypes.ready) {
      const incomingTxListener = new EventEmitter();
      incomingTxListener.on('incoming_transaction', async type => {
        await saveUserBackupState(BackupStateTypes.pending);
        setTimeout(
          () => {
            Navigation.handleAction(Routes.BACKUP_SHEET);
          },
          type === 'appended' ? 30000 : 1000
        );
        incomingTxListener.removeAllListeners();
      });
      // Incoming handles new transactions during runtime
      store.dispatch(addNewSubscriber(incomingTxListener, 'appended'));
      // Received will trigger when there's incoming transactions
      // during startup
      // store.dispatch(addNewSubscriber(incomingTxListener, 'received'));
    } else if (backupState === BackupStateTypes.pending) {
      setTimeout(() => {
        Navigation.handleAction(Routes.BACKUP_SHEET);
      }, 1000);
    }
  };

  onRemoteNotification = notification => {
    const topic = get(notification, 'data.topic');
    setTimeout(() => {
      this.onPushNotificationOpened(topic);
    }, WALLETCONNECT_SYNC_DELAY);
  };

  handleOpenLinkingURL = url => {
    handleDeeplink(url);
  };

  onPushNotificationOpened = topic => {
    const { requestsForTopic } = this.props;
    const requests = requestsForTopic(topic);
    if (requests) {
      // WC requests will open automatically
      return false;
    }
    // In the future, here  is where we should
    // handle all other kinds of push notifications
    // For ex. incoming txs, etc.
  };

  handleInitializeAnalytics = async () => {
    // Comment the line below to debug analytics
    if (__DEV__) return false;
    const storedIdentifier = await keychain.loadString(
      'analyticsUserIdentifier'
    );

    if (!storedIdentifier) {
      const identifier = await RNIOS11DeviceCheck.getToken()
        .then(deviceId => deviceId)
        .catch(() => nanoid());
      await keychain.saveString('analyticsUserIdentifier', identifier);
      analytics.identify(identifier);
    }

    await analytics.setup(REACT_APP_SEGMENT_API_WRITE_KEY, {
      ios: {
        trackDeepLinks: true,
      },
      trackAppLifecycleEvents: true,
      trackAttributionData: true,
    });
  };

  handleAppStateChange = async nextAppState => {
    if (nextAppState === 'active') {
      PushNotificationIOS.removeAllDeliveredNotifications();
    }

    // Restore WC connectors when going from BG => FG
    if (this.state.appState === 'background' && nextAppState === 'active') {
      store.dispatch(walletConnectLoadState());
    }

    this.setState({ appState: nextAppState });

    analytics.track('State change', {
      category: 'app state',
      label: nextAppState,
    });
  };

  handleNavigatorRef = navigatorRef =>
    Navigation.setTopLevelNavigator(navigatorRef);

  render = () => (
    <DevContextWrapper>
      <Portal>
        <SafeAreaProvider>
          <Provider store={store}>
            <FlexItem>
              {this.state.initialRoute && (
                <InitialRouteContext.Provider value={this.state.initialRoute}>
                  <RoutesComponent ref={this.handleNavigatorRef} />
                </InitialRouteContext.Provider>
              )}
              <OfflineToast />
              <TestnetToast network={this.props.network} />
            </FlexItem>
          </Provider>
        </SafeAreaProvider>
      </Portal>
    </DevContextWrapper>
  );
}

const AppWithRedux = compose(
  withProps({ store }),
  withAccountSettings,
  connect(null, {
    requestsForTopic,
  })
)(App);

const AppWithCodePush = CodePush({
  checkFrequency: CodePush.CheckFrequency.ON_APP_RESUME,
  installMode: CodePush.InstallMode.ON_NEXT_RESUME,
})(AppWithRedux);

AppRegistry.registerComponent('Rainbow', () => AppWithCodePush);
