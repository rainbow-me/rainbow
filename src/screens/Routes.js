import analytics from '@segment/analytics-react-native';
import { get } from 'lodash';
import React from 'react';
import Animated from 'react-native-reanimated';
import {
  createAppContainer,
  createMaterialTopTabNavigator,
  createStackNavigator,
} from 'react-navigation';
import { ExchangeModalNavigator, Navigation } from '../navigation';
import { buildTransitions, expanded, sheet } from '../navigation/transitions';
import { updateStackTransitionProps } from '../redux/navigation';
import store from '../redux/store';
import { colors } from '../styles';
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

const onTransitionEnd = () => store.dispatch(updateStackTransitionProps({ isTransitioning: false }));
const onTransitionStart = () => store.dispatch(updateStackTransitionProps({ isTransitioning: true }));

const SwipeStack = createMaterialTopTabNavigator({
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
}, {
  headerMode: 'none',
  initialLayout: deviceUtils.dimensions,
  initialRouteName: 'WalletScreen',
  mode: 'modal',
  springConfig: {
    damping: 16,
    mass: 0.3,
    overshootClamping: false,
    restDisplacementThreshold: 1,
    restSpeedThreshold: 1,
    stiffness: 140,
  },
  swipeDistanceThreshold: 30,
  swipeVelocityThreshold: 10,
  tabBarComponent: null,
});

const MainNavigator = createStackNavigator({
  ConfirmRequest: TransactionConfirmationScreenWithData,
  ExampleScreen,
  ExchangeModal: {
    navigationOptions: {
      effect: 'expanded',
      gestureResponseDistance: {
        vertical: deviceUtils.dimensions.height,
      },
    },
    params: {
      isGestureBlocked: false,
    },
    screen: ExchangeModalNavigator,
  },
  ExpandedAssetScreen: {
    navigationOptions: {
      effect: 'expanded',
      gestureResponseDistance: {
        vertical: deviceUtils.dimensions.height,
      },
    },
    screen: ExpandedAssetScreenWithData,
  },
  ImportSeedPhraseSheet: ImportSeedPhraseSheetWithData,
  ReceiveModal: {
    navigationOptions: {
      effect: 'expanded',
      gestureResponseDistance: {
        vertical: deviceUtils.dimensions.height,
      },
    },
    screen: ReceiveModal,
  },
  SendSheet: SendSheetWithData,
  SettingsModal: {
    navigationOptions: {
      effect: 'expanded',
      gesturesEnabled: false,
    },
    screen: SettingsModal,
    transparentCard: true,

  },
  SwipeLayout: SwipeStack,
  WalletConnectConfirmationModal: {
    navigationOptions: {
      effect: 'expanded',
      gestureResponseDistance: {
        vertical: deviceUtils.dimensions.height,
      },
    },
    screen: WalletConnectConfirmationModal,
  },
}, {
  headerMode: 'none',
  initialRouteName: 'SwipeLayout',
  keyboardDismissMode: 'none', // true?
  mode: 'modal',
  onTransitionEnd,
  onTransitionStart,
  transitionConfig: buildTransitions(Navigation, { expanded, sheet }),
  transparentCard: true,
});

const AppContainer = createAppContainer(MainNavigator);

// eslint-disable-next-line react/prop-types
const AppContainerWithAnalytics = ({ ref, screenProps }) => (
  <AppContainer
    onNavigationStateChange={(prevState, currentState, action) => {
      const { params, routeName } = Navigation.getActiveRoute(currentState);
      const prevRouteName = Navigation.getActiveRouteName(prevState);

      if (routeName === 'SettingsModal') {
        let subRoute = get(params, 'section.title');
        if (subRoute === 'Settings') subRoute = null;
        return analytics.screen(`${routeName}${subRoute ? `>${subRoute}` : ''}`);
      }

      if (routeName !== prevRouteName) {
        let paramsToTrack = null;

        if (prevRouteName === 'MainExchangeScreen' && routeName === 'WalletScreen') {
          store.dispatch(updateStackTransitionProps({ blurColor: null }));
        } else if (prevRouteName === 'WalletScreen' && routeName === 'MainExchangeScreen') {
          store.dispatch(updateStackTransitionProps({ blurColor: colors.alpha(colors.black, 0.9) }));
        }

        if (routeName === 'ExpandedAssetScreen') {
          const { asset, type } = params;
          paramsToTrack = {
            assetContractAddress: asset.address || get(asset, 'asset_contract.address'),
            assetName: asset.name,
            assetSymbol: asset.symbol || get(asset, 'asset_contract.symbol'),
            assetType: type,
          };
        }

        return analytics.screen(routeName, paramsToTrack);
      }
    }}
    ref={ref}
    screenProps={screenProps}
  />
);

export default React.memo(AppContainerWithAnalytics);
