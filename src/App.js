import './languages';
import * as Sentry from '@sentry/react-native';
import React, { Component } from 'react';
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
import { OfflineToast } from './components/toasts';
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
import {
  getCachedProviderForNetwork,
  isHardHat,
  isL2Network,
} from './handlers/web3';
import RainbowContextWrapper from './helpers/RainbowContext';
import isTestFlight from './helpers/isTestFlight';
import networkTypes from './helpers/networkTypes';
import * as keychain from '@/model/keychain';
import { loadAddress } from './model/wallet';
import { Navigation } from './navigation';
// eslint-disable-next-line import/no-unresolved
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
import store from './redux/store';
import { uniswapPairsInit } from './redux/uniswap';
import { walletConnectLoadState } from './redux/walletconnect';
import { rainbowTokenList } from './references';
import { userAssetsQueryKey } from '@/resources/assets/UserAssetsQuery';
import { MainThemeProvider } from './theme/ThemeContext';
import { ethereumUtils } from './utils';
import { branchListener } from './utils/branch';
import { addressKey } from './utils/keychainConstants';
import { SharedValuesProvider } from '@/helpers/SharedValuesContext';
import { InitialRouteContext } from '@/navigation/initialRoute';
import Routes from '@/navigation/routesNames';
import { Portal } from '@/react-native-cool-modals/Portal';
import { NotificationsHandler } from '@/notifications/NotificationsHandler';
import { initSentry, sentryRoutingInstrumentation } from '@/logger/sentry';
import { analyticsV2 } from '@/analytics';
import {
  getOrCreateDeviceId,
  securelyHashWalletAddress,
} from '@/analytics/utils';
import { logger, RainbowError } from '@/logger';
import * as ls from '@/storage';
import { migrate } from '@/migrations';
import { initListeners as initWalletConnectListeners } from '@/walletConnect';
import { saveFCMToken } from '@/notifications/tokens';
import branch from 'react-native-branch';
import { initializeReservoirClient } from '@/resources/nftOffers/utils';

if (__DEV__) {
  reactNativeDisableYellowBox && LogBox.ignoreAllLogs();
  (showNetworkRequests || showNetworkResponses) &&
    monitorNetwork(showNetworkRequests, showNetworkResponses);
}

enableScreens();

const containerStyle = { flex: 1 };

class OldApp extends Component {
  state = {
    appState: AppState.currentState,
    initialRoute: null,
    eventSubscription: null,
  };

  /**
   * There's a race condition in Branch's RN SDK. From a cold start, Branch
   * doesn't always handle an initial URL, so we need to check for it here and
   * then pass it to Branch to do its thing.
   *
   * @see https://github.com/BranchMetrics/react-native-branch-deep-linking-attribution/issues/673#issuecomment-1220974483
   */
  async setupDeeplinking() {
    const initialUrl = await Linking.getInitialURL();

    // main Branch handler
    this.branchListener = await branchListener(url => {
      logger.debug(
        `Branch: listener called`,
        {},
        logger.DebugContext.deeplinks
      );

      try {
        handleDeeplink(url, this.state.initialRoute);
      } catch (e) {
        logger.error(new RainbowError('Error opening deeplink'), {
          message: e.message,
          url,
        });
      }
    });

    // if we have an initial URL, pass it to Branch
    if (initialUrl) {
      logger.debug(`App: has initial URL, opening with Branch`, { initialUrl });
      branch.openURL(initialUrl);
    }
  }

  async componentDidMount() {
    if (!__DEV__ && isTestFlight) {
      logger.info(`Test flight usage - ${isTestFlight}`);
    }
    this.identifyFlow();
    InteractionManager.runAfterInteractions(() => {
      rainbowTokenList.update();
    });
    const eventSub = AppState?.addEventListener(
      'change',
      this?.handleAppStateChange
    );
    this.setState({ eventSubscription: eventSub });
    rainbowTokenList.on('update', this.handleTokenListUpdate);
    appEvents.on('transactionConfirmed', this.handleTransactionConfirmed);

    await this.setupDeeplinking();

    PerformanceTracking.finishMeasuring(
      PerformanceMetrics.loadRootAppComponent
    );
    analyticsV2.track(analyticsV2.event.applicationDidMount);

    /**
     * This must be saved in the store as early as possible
     */
    await saveFCMToken();

    /**
     * Needs to be called AFTER FCM token is loaded
     */
    initWalletConnectListeners();
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.walletReady && this.props.walletReady) {
      // Everything we need to do after the wallet is ready goes here
      logger.info('✅ Wallet ready!');
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
    this.state.eventSubscription.remove();
    rainbowTokenList.off('update', this.handleTokenListUpdate);
    this.branchListener();
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

    const provider = getCachedProviderForNetwork(network);
    const providerUrl = provider?.connection?.url;
    const connectedToHardhat = isHardHat(providerUrl);

    const updateBalancesAfter = (timeout, isL2, network) => {
      const { accountAddress, nativeCurrency } = store.getState().settings;
      setTimeout(() => {
        logger.debug('Reloading balances for network', network);
        if (isL2) {
          if (tx.internalType === TransactionType.trade) {
            store.dispatch(additionalDataUpdateL2AssetBalance(tx));
          } else if (tx.internalType !== TransactionType.authorize) {
            // for swaps, we don't want to trigger update balances on unlock txs
            queryClient.invalidateQueries({
              queryKey: userAssetsQueryKey({
                address: accountAddress,
                currency: nativeCurrency,
                connectedToHardhat,
              }),
            });
          }
        } else {
          queryClient.invalidateQueries({
            queryKey: userAssetsQueryKey({
              address: accountAddress,
              currency: nativeCurrency,
              connectedToHardhat,
            }),
          });
        }
      }, timeout);
    };
    logger.debug('reloading balances soon...');
    updateBalancesAfter(2000, isL2, network);
    updateBalancesAfter(isL2 ? 10000 : 5000, isL2, network);
  };

  handleSentryNavigationIntegration = () => {
    sentryRoutingInstrumentation?.registerNavigationContainer(
      this.navigatorRef
    );
  };

  render() {
    return (
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
        </View>
        <NotificationsHandler walletReady={this.props.walletReady} />
      </Portal>
    );
  }
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
        logger.info(`User opened application for the first time`);

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
        logger.debug(`Application initialized with Sentry and Segment`);

        // init complete, load the rest of the app
        setInitializing(false);
      })
      .catch(e => {
        logger.error(new RainbowError(`initializeApplication failed`));

        // for failure, continue to rest of the app for now
        setInitializing(false);
      });
    initializeReservoirClient();
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
const RootWithCodePush = codePush(RootWithSentry);

const PlaygroundWithReduxStore = () => (
  <ReduxProvider store={store}>
    <Playground />
  </ReduxProvider>
);

AppRegistry.registerComponent('Rainbow', () =>
  designSystemPlaygroundEnabled ? PlaygroundWithReduxStore : RootWithCodePush
);
