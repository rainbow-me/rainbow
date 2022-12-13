import './languages';
import * as Sentry from '@sentry/react-native';
import React, { Component, createRef } from 'react';
import {
  AppRegistry,
  AppState,
  Dimensions,
  InteractionManager,
  Linking,
  LogBox,
  View,
} from 'react-native';

// eslint-disable-next-line import/default
import codePush from 'react-native-code-push';
import { IS_TESTING } from 'react-native-dotenv';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import { connect, Provider as ReduxProvider } from 'react-redux';
import { RecoilRoot } from 'recoil';
import { runCampaignChecks } from './campaigns/campaignChecks';
import PortalConsumer from './components/PortalConsumer';
import ErrorBoundary from './components/error-boundary/ErrorBoundary';
import { FedoraToast, OfflineToast } from './components/toasts';
import {
  designSystemPlaygroundEnabled,
  reactNativeDisableYellowBox,
  showNetworkRequests,
  showNetworkResponses,
} from './config/debug';
import monitorNetwork from './debugging/network';
import { Playground } from './design-system/playground/Playground';
import { TransactionType } from './entities';
import appEvents from './handlers/appEvents';
import handleDeeplink from './handlers/deeplinks';
import {
  runFeatureAndCampaignChecks,
  runWalletBackupStatusChecks,
} from './handlers/walletReadyEvents';
import { isL2Network } from './handlers/web3';
import RainbowContextWrapper from './helpers/RainbowContext';
import isTestFlight from './helpers/isTestFlight';
import networkTypes from './helpers/networkTypes';
import * as keychain from '@/model/keychain';
import { loadAddress } from './model/wallet';
import { Navigation } from './navigation';
import RoutesComponent from './navigation/Routes';
import { PerformanceContextMap } from './performance/PerformanceContextMap';
import { PerformanceTracking } from './performance/tracking';
import { PerformanceMetrics } from './performance/tracking/types/PerformanceMetrics';
import {
  PersistQueryClientProvider,
  persistOptions,
  queryClient,
} from './react-query';
import { additionalDataUpdateL2AssetBalance } from './redux/additionalAssetsData';
import { explorerInitL2 } from './redux/explorer';
import { fetchOnchainBalances } from './redux/fallbackExplorer';
import store from './redux/store';
import { uniswapPairsInit } from './redux/uniswap';
import { walletConnectLoadState } from './redux/walletconnect';
import { rainbowTokenList } from './references';
import { MainThemeProvider } from './theme/ThemeContext';
import { ethereumUtils } from './utils';
import { branchListener } from './utils/branch';
import { addressKey } from './utils/keychainConstants';
import { CODE_PUSH_DEPLOYMENT_KEY, isCustomBuild } from '@/handlers/fedora';
import { SharedValuesProvider } from '@/helpers/SharedValuesContext';
import { InitialRouteContext } from '@/navigation/initialRoute';
import Routes from '@/navigation/routesNames';
import logger from '@/utils/logger';
import { Portal } from '@/react-native-cool-modals/Portal';
import { NotificationsHandler } from '@/notifications/NotificationsHandler';
import { initSentry, sentryRoutingInstrumentation } from '@/logger/sentry';
import { analyticsV2 } from '@/analytics';
import {
  getOrCreateDeviceId,
  securelyHashWalletAddress,
} from '@/analytics/utils';
import { logger as loggr, RainbowError } from '@/logger';
import * as ls from '@/storage';
import { migrate } from '@/migrations';

const FedoraToastRef = createRef();

if (__DEV__) {
  reactNativeDisableYellowBox && LogBox.ignoreAllLogs();
  (showNetworkRequests || showNetworkResponses) &&
    monitorNetwork(showNetworkRequests, showNetworkResponses);
} else {
  // eslint-disable-next-line no-inner-declarations
  async function checkForFedoraMode() {
    try {
      const config = await codePush.getCurrentPackage();
      if (!config || config.deploymentKey === CODE_PUSH_DEPLOYMENT_KEY) {
        codePush.sync({
          deploymentKey: CODE_PUSH_DEPLOYMENT_KEY,
          installMode: codePush.InstallMode.ON_NEXT_RESTART,
        });
      } else {
        isCustomBuild.value = true;
        setTimeout(() => FedoraToastRef?.current?.show(), 300);
      }
    } catch (e) {
      logger.log('error initiating codepush settings', e);
    }
  }

  checkForFedoraMode();
}

enableScreens();

const containerStyle = { flex: 1 };

class OldApp extends Component {
  state = { appState: AppState.currentState, initialRoute: null };

  async componentDidMount() {
    if (!__DEV__ && isTestFlight) {
      logger.sentry(`Test flight usage - ${isTestFlight}`);
    }
    this.identifyFlow();
    InteractionManager.runAfterInteractions(() => {
      rainbowTokenList.update();
    });
    AppState.addEventListener('change', this.handleAppStateChange);
    rainbowTokenList.on('update', this.handleTokenListUpdate);
    appEvents.on('transactionConfirmed', this.handleTransactionConfirmed);
    this.branchListener = branchListener(this.handleOpenLinkingURL);
    // Walletconnect uses direct deeplinks
    if (android) {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          this.handleOpenLinkingURL(initialUrl);
        }
      } catch (e) {
        logger.log('Error opening deeplink', e);
      }
      Linking.addEventListener('url', ({ url }) => {
        this.handleOpenLinkingURL(url);
      });
    }

    PerformanceTracking.finishMeasuring(
      PerformanceMetrics.loadRootAppComponent
    );
    analyticsV2.track(analyticsV2.event.applicationDidMount);
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.walletReady && this.props.walletReady) {
      // Everything we need to do after the wallet is ready goes here
      logger.sentry('✅ Wallet ready!');
      runWalletBackupStatusChecks();

      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          if (IS_TESTING === 'true') {
            return;
          }
          runFeatureAndCampaignChecks();
        }, 2000);
      });
    }
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this.handleAppStateChange);
    rainbowTokenList?.off?.('update', this.handleTokenListUpdate);
    this.branchListener?.();
  }

  identifyFlow = async () => {
    const address = await loadAddress();
    const initialRoute = address ? Routes.SWIPE_LAYOUT : Routes.WELCOME_SCREEN;
    this.setState({ initialRoute });
    PerformanceContextMap.set('initialRoute', initialRoute);
  };

  async handleTokenListUpdate() {
    store.dispatch(uniswapPairsInit());
  }

  handleOpenLinkingURL = url => {
    handleDeeplink(url, this.state.initialRoute);
  };

  handleAppStateChange = async nextAppState => {
    // Restore WC connectors when going from BG => FG
    if (this.state.appState === 'background' && nextAppState === 'active') {
      store.dispatch(walletConnectLoadState());
      InteractionManager.runAfterInteractions(() => {
        rainbowTokenList.update();
      });
    }
    this.setState({ appState: nextAppState });

    analyticsV2.track(analyticsV2.event.appStateChange, {
      category: 'app state',
      label: nextAppState,
    });
  };

  handleNavigatorRef = navigatorRef => {
    this.navigatorRef = navigatorRef;
    Navigation.setTopLevelNavigator(navigatorRef);
  };

  handleTransactionConfirmed = tx => {
    const network = tx.chainId
      ? ethereumUtils.getNetworkFromChainId(tx.chainId)
      : tx.network || networkTypes.mainnet;
    const isL2 = isL2Network(network);
    const updateBalancesAfter = (timeout, isL2, network) => {
      setTimeout(() => {
        logger.log('Reloading balances for network', network);
        if (isL2) {
          if (tx.internalType === TransactionType.trade) {
            store.dispatch(additionalDataUpdateL2AssetBalance(tx));
          } else if (tx.internalType !== TransactionType.authorize) {
            // for swaps, we don't want to trigger update balances on unlock txs
            store.dispatch(explorerInitL2(network));
          }
        } else {
          store.dispatch(
            fetchOnchainBalances({ keepPolling: false, withPrices: false })
          );
        }
      }, timeout);
    };
    logger.log('reloading balances soon...');
    updateBalancesAfter(2000, isL2, network);
    updateBalancesAfter(isL2 ? 10000 : 5000, isL2, network);
  };

  handleSentryNavigationIntegration = () => {
    sentryRoutingInstrumentation?.registerNavigationContainer(
      this.navigatorRef
    );
  };

  render = () => (
    <Portal>
      <View style={containerStyle}>
        {this.state.initialRoute && (
          <InitialRouteContext.Provider value={this.state.initialRoute}>
            <RoutesComponent
              onReady={this.handleSentryNavigationIntegration}
              ref={this.handleNavigatorRef}
            />
            <PortalConsumer />
          </InitialRouteContext.Provider>
        )}
        <OfflineToast />
        <FedoraToast ref={FedoraToastRef} />
      </View>
      <NotificationsHandler walletReady={this.props.walletReady} />
    </Portal>
  );
}

const OldAppWithRedux = connect(state => ({
  walletReady: state.appState.walletReady,
}))(OldApp);

function App() {
  return <OldAppWithRedux />;
}

function Root() {
  const [initializing, setInitializing] = React.useState(true);

  React.useEffect(() => {
    async function initializeApplication() {
      await initSentry(); // must be set up immediately

      // must happen immediately, but after Sentry
      await migrate();

      const isReturningUser = ls.device.get(['isReturningUser']);
      const [deviceId, deviceIdWasJustCreated] = await getOrCreateDeviceId();
      const currentWalletAddress = await keychain.loadString(addressKey);
      const currentWalletAddressHash =
        typeof currentWalletAddress === 'string'
          ? securelyHashWalletAddress(currentWalletAddress)
          : undefined;

      Sentry.setUser({
        id: deviceId,
        currentWalletAddress: currentWalletAddressHash,
      });

      /**
       * Add helpful values to `analyticsV2` instance
       */
      analyticsV2.setDeviceId(deviceId);
      if (currentWalletAddressHash) {
        analyticsV2.setCurrentWalletAddressHash(currentWalletAddressHash);
      }

      /**
       * `analyticsv2` has all it needs to function.
       */
      analyticsV2.identify({});

      /**
       * We previously relied on the existence of a deviceId on keychain to
       * determine if a user was new or not. For backwards compat, we do this
       * still with `deviceIdWasJustCreated`, but we also set a new value on
       * local storage `isReturningUser` so that other parts of the app can
       * read from that, if necessary.
       *
       * This block of code will only run once.
       */
      if (deviceIdWasJustCreated && !isReturningUser) {
        // on very first open, set some default data and fire event
        loggr.info(`User opened application for the first time`);

        const {
          width: screenWidth,
          height: screenHeight,
          scale: screenScale,
        } = Dimensions.get('screen');

        analyticsV2.identify({ screenHeight, screenWidth, screenScale });
        analyticsV2.track(analyticsV2.event.firstAppOpen);
      }

      /**
       * Always set this — we may have just migrated deviceId with
       * `getOrCreateDeviceId`, which would mean `deviceIdWasJustCreated` would
       * be false and the new-user block of code above won't run.
       *
       * But by this point in the `initializeApplication`, we've handled new
       * user events and migrations, so we need to make sure this is set to
       * `true`.
       */
      ls.device.set(['isReturningUser'], true);
    }

    initializeApplication()
      .then(() => {
        loggr.debug(`Application initialized with Sentry and Segment`);

        // init complete, load the rest of the app
        setInitializing(false);
      })
      .catch(e => {
        loggr.error(new RainbowError(`initializeApplication failed`));

        // for failure, continue to rest of the app for now
        setInitializing(false);
      });
  }, [setInitializing]);

  return initializing ? null : (
    <ReduxProvider store={store}>
      <RecoilRoot>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={persistOptions}
        >
          <SafeAreaProvider>
            <MainThemeProvider>
              <RainbowContextWrapper>
                <SharedValuesProvider>
                  <ErrorBoundary>
                    <App />
                  </ErrorBoundary>
                </SharedValuesProvider>
              </RainbowContextWrapper>
            </MainThemeProvider>
          </SafeAreaProvider>
        </PersistQueryClientProvider>
      </RecoilRoot>
    </ReduxProvider>
  );
}

const RootWithSentry = Sentry.wrap(Root);
const RootWithCodePush = codePush({
  checkFrequency: codePush.CheckFrequency.MANUAL,
})(RootWithSentry);

const PlaygroundWithReduxStore = () => (
  <ReduxProvider store={store}>
    <Playground />
  </ReduxProvider>
);

AppRegistry.registerComponent('Rainbow', () =>
  designSystemPlaygroundEnabled ? PlaygroundWithReduxStore : RootWithCodePush
);
