import analytics from '@segment/analytics-react-native';
import { get, omit } from 'lodash';
import React from 'react';
import { createAppContainer } from 'react-navigation';
import { createMaterialTopTabNavigator } from 'react-navigation-tabs-v1';
import { createStackNavigator } from 'react-navigation-stack';
import { ExchangeModalNavigator, Navigation } from '../navigation';
import { updateTransitionProps } from '../redux/navigation';
import store from '../redux/store';
import { deviceUtils } from '../utils';
import ExpandedAssetScreenWithData from './ExpandedAssetScreenWithData';
import ImportSeedPhraseSheetWithData from './ImportSeedPhraseSheetWithData';
import ProfileScreenWithData from './ProfileScreenWithData';
import QRScannerScreenWithData from './QRScannerScreenWithData';
import ReceiveModal from './ReceiveModal';
import ExampleScreen from './ExampleScreen';
import WalletConnectConfirmationModal from './WalletConnectConfirmationModal';
import SendSheetWithData from './SendSheetWithData';
import SettingsModal from './SettingsModal';
import TransactionConfirmationScreenWithData from './TransactionConfirmationScreenWithData';
import WalletScreen from './WalletScreen';
import {
  exchangePreset,
  expandedPreset,
  sheetPreset,
  backgroundPreset,
  overlayExpandedPreset,
} from '../navigation/transitions/effects';

const onTransitionEnd = () =>
  store.dispatch(updateTransitionProps({ isTransitioning: false }));
const onTransitionStart = () =>
  store.dispatch(updateTransitionProps({ isTransitioning: true }));

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

const MainNavigator = createStackNavigator(
  {
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
    ExampleScreen,
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
    ImportSeedPhraseSheet: {
      navigationOptions: {
        ...sheetPreset,
        onTransitionStart: props => {
          sheetPreset.onTransitionStart(props);
          onTransitionStart();
        },
      },
      screen: ImportSeedPhraseSheetWithData,
    },
    OverlayExpandedAssetScreen: {
      navigationOptions: overlayExpandedPreset,
      screen: ExpandedAssetScreenWithData,
    },
    ReceiveModal: {
      navigationOptions: {
        ...expandedPreset,
        onTransitionStart: props => {
          expandedPreset.onTransitionStart(props);
          onTransitionStart();
        },
      },
      screen: ReceiveModal,
    },
    SendSheet: {
      navigationOptions: {
        ...omit(sheetPreset, 'gestureResponseDistance'),
        onTransitionStart: props => {
          onTransitionStart(props);
          sheetPreset.onTransitionStart(props);
        },
      },
      screen: SendSheetWithData,
    },
    SettingsModal: {
      navigationOptions: {
        ...expandedPreset,
        gesturesEnabled: false,
        onTransitionStart: props => {
          expandedPreset.onTransitionStart(props);
          onTransitionStart();
        },
      },
      screen: SettingsModal,
      transparentCard: true,
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

const AppContainer = createAppContainer(MainNavigator);

// eslint-disable-next-line react/display-name
const AppContainerWithAnalytics = React.forwardRef((props, ref) => (
  <AppContainer
    onNavigationStateChange={(prevState, currentState) => {
      const { params, routeName } = Navigation.getActiveRoute(currentState);
      const prevRouteName = Navigation.getActiveRouteName(prevState);

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

        return analytics.screen(routeName, paramsToTrack);
      }
    }}
    ref={ref}
  />
));

export default React.memo(AppContainerWithAnalytics);
