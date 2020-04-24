import analytics from '@segment/analytics-react-native';
import { get, omit } from 'lodash';
import React from 'react';
import { StatusBar } from 'react-native';
import createBottomSheetStackNavigator from 'react-native-cool-modals/createNativeStackNavigator';
// eslint-disable-next-line import/no-unresolved
import { enableScreens } from 'react-native-screens';
import createNativeStackNavigator from 'react-native-screens/createNativeStackNavigator';
import { createAppContainer, NavigationActions } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import { createMaterialTopTabNavigator } from 'react-navigation-tabs-v1';
import isNativeStackAvailable from '../../helpers/isNativeStackAvailable';
import {
  ExchangeModalNavigator,
  Navigation,
  SavingModalNavigator,
} from '../../navigation';
import {
  backgroundPreset,
  emojiPreset,
  exchangePreset,
  expandedPreset,
  overlayExpandedPreset,
  savingsPreset,
  sheetPreset,
} from '../../navigation/transitions/effects';
import { updateTransitionProps } from '../../redux/navigation';
import store from '../../redux/store';
import { deviceUtils, sentryUtils } from '../../utils';
import AddCashSheet from '../AddCashSheet';
import AvatarBuilder from '../AvatarBuilder';
import ExampleScreen from '../ExampleScreen';
import ExpandedAssetScreenWithData from '../ExpandedAssetScreenWithData';
import ImportSeedPhraseSheetWithData from '../ImportSeedPhraseSheetWithData';
import ProfileScreenWithData from '../ProfileScreenWithData';
import QRScannerScreenWithData from '../QRScannerScreenWithData';
import ReceiveModal from '../ReceiveModal';
import SavingsSheet from '../SavingsSheet';
import SendSheetWithData from '../SendSheetWithData';
import SettingsModal from '../SettingsModal';
import TransactionConfirmationScreenWithData from '../TransactionConfirmationScreenWithData';
import WalletConnectConfirmationModal from '../WalletConnectConfirmationModal';
import WalletScreen from '../WalletScreen';
import WithdrawModal from '../WithdrawModal';

enableScreens();

const onTransitionEnd = () =>
  store.dispatch(
    updateTransitionProps({ date: Date.now(), isTransitioning: false })
  );
const onTransitionStart = () =>
  store.dispatch(
    updateTransitionProps({ date: Date.now(), isTransitioning: true })
  );

const SwipeStack = createMaterialTopTabNavigator(
  {
    ProfileScreen: {
      name: 'ProfileScreen',
      screen: ProfileScreenWithData,
    },
    WalletScreen: {
      name: 'WalletScreen',
      screen: WalletScreen,
    },
    // eslint-disable-next-line sort-keys
    QRScannerScreen: {
      name: 'QRScannerScreen',
      screen: QRScannerScreenWithData,
    },
  },
  {
    headerMode: 'none',
    initialLayout: deviceUtils.dimensions,
    initialRouteName: 'WalletScreen',
    tabBarComponent: null,
  }
);

const sendFlowRoutes = {
  OverlayExpandedAssetScreen: {
    navigationOptions: overlayExpandedPreset,
    screen: ExpandedAssetScreenWithData,
  },
  SendSheet: {
    navigationOptions: {
      ...sheetPreset,
      onTransitionStart: props => {
        expandedPreset.onTransitionStart(props);
        onTransitionStart();
      },
    },
    screen: function SendSheetWrapper(...props) {
      return <SendSheetWithData {...props} setAppearListener={setListener} />;
    },
  },
};

const addCashFlowRoutes = {
  AddCashSheet: {
    navigationOptions: {
      ...sheetPreset,
      onTransitionStart: props => {
        expandedPreset.onTransitionStart(props);
        onTransitionStart();
      },
    },
    screen: function AddCashSheetWrapper(...props) {
      return <AddCashSheet {...props} setAppearListener={setListener} />;
    },
  },
  OverlayExpandedSupportedCountries: {
    navigationOptions: overlayExpandedPreset,
    screen: ExpandedAssetScreenWithData,
  },
};

const MainNavigator = createStackNavigator(
  {
    AvatarBuilder: {
      navigationOptions: {
        ...emojiPreset,
      },
      screen: AvatarBuilder,
      transparentCard: true,
    },
    ConfirmRequest: {
      navigationOptions: {
        ...sheetPreset,
        onTransitionStart: props => {
          sheetPreset.onTransitionStart(props);
          onTransitionStart();
        },
      },
      screen: TransactionConfirmationScreenWithData,
    },
    ExampleScreen: {
      navigationOptions: {
        ...expandedPreset,
        onTransitionStart: props => {
          expandedPreset.onTransitionStart(props);
          onTransitionStart();
        },
      },
      screen: ExampleScreen,
    },
    ExchangeModal: {
      navigationOptions: {
        ...exchangePreset,
        onTransitionEnd,
        onTransitionStart: props => {
          expandedPreset.onTransitionStart(props);
          onTransitionStart();
        },
      },
      params: {
        isGestureBlocked: false,
      },
      screen: ExchangeModalNavigator,
    },
    ExpandedAssetScreen: {
      navigationOptions: {
        ...expandedPreset,
        // onTransitionStart: props => {
        //   expandedPreset.onTransitionStart(props);
        //   onTransitionStart();
        // },
      },
      screen: ExpandedAssetScreenWithData,
    },
    SavingsSheet: {
      navigationOptions: {
        ...savingsPreset,
      },
      screen: SavingsSheet,
    },
    SwipeLayout: {
      navigationOptions: {
        ...backgroundPreset,
      },
      screen: SwipeStack,
    },
    WalletConnectConfirmationModal: {
      navigationOptions: {
        ...expandedPreset,
        onTransitionStart: props => {
          expandedPreset.onTransitionStart(props);
          onTransitionStart();
        },
      },
      screen: WalletConnectConfirmationModal,
    },
    ...(isNativeStackAvailable
      ? {}
      : {
          OverlayExpandedAssetScreen: {
            navigationOptions: overlayExpandedPreset,
            screen: ExpandedAssetScreenWithData,
          },
        }),
  },
  {
    defaultNavigationOptions: {
      onTransitionEnd,
      onTransitionStart,
    },
    headerMode: 'none',
    initialRouteName: 'SwipeLayout',
    mode: 'modal',
  }
);

const MainNativeNavigation = createBottomSheetStackNavigator(
  {
    MainNavigator,
    ReceiveModal,
    SettingsModal,
  },
  {
    defaultNavigationOptions: {
      customStack: true,
      onWillDismiss: () => {
        sheetPreset.onTransitionStart({ closing: true });
      },
      showDragIndicator: false,
      springDamping: 0.8,
      transitionDuration: 0.35,
    },
    mode: 'modal',
  }
);

let appearListener = null;
const setListener = listener => (appearListener = listener);

const savingsModalsRoutes = {
  SavingsDepositModal: {
    navigationOptions: {
      ...exchangePreset,
      onTransitionEnd,
      onTransitionStart: props => {
        expandedPreset.onTransitionStart(props);
        onTransitionStart();
      },
    },
    params: {
      isGestureBlocked: false,
    },
    screen: SavingModalNavigator,
  },
  SavingsWithdrawModal: {
    navigationOptions: {
      ...exchangePreset,
      onTransitionEnd,
      onTransitionStart: props => {
        expandedPreset.onTransitionStart(props);
        onTransitionStart();
      },
    },
    params: {
      isGestureBlocked: false,
    },
    screen: WithdrawModal,
  },
};

const nativeStackWrapperRoutes = {
  NativeStack: createNativeStackNavigator(
    {
      AddCashSheetNavigator: isNativeStackAvailable
        ? createStackNavigator(addCashFlowRoutes, {
            defaultNavigationOptions: {
              onTransitionEnd,
              onTransitionStart,
            },
            headerMode: 'none',
            initialRouteName: 'AddCashSheet',
            mode: 'modal',
          })
        : () => null,
      ImportSeedPhraseSheet: function ImportSeedPhraseSheetWrapper(...props) {
        return (
          <ImportSeedPhraseSheetWithData
            {...props}
            setAppearListener={setListener}
          />
        );
      },
      MainNativeNavigation,
      SendSheetNavigator: isNativeStackAvailable
        ? createStackNavigator(sendFlowRoutes, {
            defaultNavigationOptions: {
              onTransitionEnd,
              onTransitionStart,
            },
            headerMode: 'none',
            initialRouteName: 'SendSheet',
            mode: 'modal',
          })
        : () => null,
    },
    {
      defaultNavigationOptions: {
        onAppear: () => appearListener && appearListener(),
      },
      headerMode: 'none',
      initialRouteName: 'MainNativeNavigation',
      mode: 'modal',
    }
  ),
  ...savingsModalsRoutes,
};

const NativeStackWrapper = createStackNavigator(nativeStackWrapperRoutes, {
  defaultNavigationOptions: {
    onTransitionEnd,
    onTransitionStart,
  },
  headerMode: 'none',
  initialRouteName: 'NativeStack',
  mode: 'modal',
});

const routesWithNativeStack = {
  AddCashSheet: {
    navigationOptions: {
      ...sheetPreset,
      onTransitionStart: props => {
        StatusBar.setBarStyle('light-content');
        onTransitionStart(props);
        sheetPreset.onTransitionStart(props);
      },
    },
    screen: AddCashSheet,
  },
  ImportSeedPhraseSheet: {
    navigationOptions: {
      ...sheetPreset,
      onTransitionStart: () => {
        StatusBar.setBarStyle('light-content');
      },
    },
    screen: ImportSeedPhraseSheetWithData,
  },
  MainNavigator,
  OverlayExpandedAssetScreen: {
    navigationOptions: overlayExpandedPreset,
    screen: ExpandedAssetScreenWithData,
  },
  OverlayExpandedSupportedCountries: {
    navigationOptions: overlayExpandedPreset,
    screen: ExpandedAssetScreenWithData,
  },
  SendSheet: {
    navigationOptions: {
      ...omit(sheetPreset, 'gestureResponseDistance'),
      onTransitionStart: () => {
        StatusBar.setBarStyle('light-content');
        onTransitionStart();
      },
    },
    screen: SendSheetWithData,
  },
  ...savingsModalsRoutes,
};

const NativeStackFallback = createStackNavigator(routesWithNativeStack, {
  defaultNavigationOptions: {
    onTransitionEnd,
    onTransitionStart,
  },
  headerMode: 'none',
  initialRouteName: 'MainNavigator',
  mode: 'modal',
});

const Stack = isNativeStackAvailable ? NativeStackWrapper : NativeStackFallback;

const AppContainer = createAppContainer(Stack);

// eslint-disable-next-line react/display-name
const AppContainerWithAnalytics = React.forwardRef((props, ref) => (
  <AppContainer
    onNavigationStateChange={(prevState, currentState) => {
      const { params, routeName } = Navigation.getActiveRoute(currentState);
      const prevRouteName = Navigation.getActiveRouteName(prevState);
      // native stack rn does not support onTransitionEnd and onTransitionStart
      // Set focus manually on route changes

      if (
        prevRouteName !== routeName &&
        isNativeStackAvailable &&
        (routesWithNativeStack[prevRouteName] ||
          routesWithNativeStack[routeName])
      ) {
        Navigation.handleAction(
          NavigationActions.setParams({
            key: routeName,
            params: { focused: true },
          })
        );

        Navigation.handleAction(
          NavigationActions.setParams({
            key: prevRouteName,
            params: { focused: false },
          })
        );
      }

      const oldMainStack = prevState.routes[prevState.index];
      const newMainStack = currentState.routes[currentState.index];
      const oldIndex = get(
        oldMainStack,
        `routes[${oldMainStack.index}].index`,
        null
      );
      const newIndex = get(
        newMainStack,
        `routes[${newMainStack.index}].index`,
        null
      );

      if (oldIndex !== newIndex) {
        expandedPreset.onTransitionStart({ closing: !newIndex });
      }

      if (
        prevRouteName !== 'QRScannerScreen' &&
        routeName === 'QRScannerScreen'
      ) {
        StatusBar.setBarStyle('light-content', true);
      }

      if (
        prevRouteName === 'QRScannerScreen' &&
        routeName !== 'QRScannerScreen'
      ) {
        StatusBar.setBarStyle('dark-content', true);
      }

      if (
        prevRouteName === 'ImportSeedPhraseSheet' &&
        (routeName === 'ProfileScreen' || routeName === 'WalletScreen')
      ) {
        StatusBar.setBarStyle('dark-content', true);
      }

      if (prevRouteName === 'WalletScreen' && routeName === 'SendSheet') {
        StatusBar.setBarStyle('light-content', true);
      }

      if (
        prevRouteName === 'SendSheet' &&
        (routeName === 'ProfileScreen' || routeName === 'WalletScreen')
      ) {
        StatusBar.setBarStyle('dark-content', true);
      }

      if (
        prevRouteName === 'AddCashSheet' &&
        (routeName === 'ProfileScreen' || routeName === 'WalletScreen')
      ) {
        StatusBar.setBarStyle('dark-content', true);
      }

      if (routeName === 'SettingsModal') {
        let subRoute = get(params, 'section.title');
        if (subRoute === 'Settings') subRoute = null;
        return analytics.screen(
          `${routeName}${subRoute ? `>${subRoute}` : ''}`
        );
      }

      if (routeName !== prevRouteName) {
        let paramsToTrack = null;

        if (
          prevRouteName === 'MainExchangeScreen' &&
          routeName === 'WalletScreen'
        ) {
          // store.dispatch(updateTransitionProps({ blurColor: null }));
        } else if (
          prevRouteName === 'WalletScreen' &&
          routeName === 'MainExchangeScreen'
        ) {
          // store.dispatch(
          //   updateTransitionProps({
          //     blurColor: colors.alpha(colors.black, 0.9),
          //   })
          // );
        }

        if (routeName === 'ExpandedAssetScreen') {
          const { asset, type } = params;
          paramsToTrack = {
            assetContractAddress:
              asset.address || get(asset, 'asset_contract.address'),
            assetName: asset.name,
            assetSymbol: asset.symbol || get(asset, 'asset_contract.symbol'),
            assetType: type,
          };
        }
        sentryUtils.addNavBreadcrumb(prevRouteName, routeName, paramsToTrack);
        return analytics.screen(routeName, paramsToTrack);
      }
    }}
    ref={ref}
  />
));

export default React.memo(AppContainerWithAnalytics);
