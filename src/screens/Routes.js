import analytics from '@segment/analytics-react-native';
import { get } from 'lodash';
import React from 'react';
import {
  createAppContainer,
  createMaterialTopTabNavigator,
} from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import Navigation from '../navigation';
// import { buildTransitions, expanded, sheet } from '../navigation/transitions';
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

import Animated from 'react-native-reanimated';
const { call, block, concat, interpolate, color } = Animated;

const cardStyleInterpolator = props => {
  const { progress } = props;

  const {
    progress: { current },
    layouts: { screen },
  } = props;

  const translateY = interpolate(current, {
    inputRange: [0, 1],
    outputRange: [screen.height, 0],
  });

  store.dispatch(updateTransitionProps({
    effect: 'expanded',
    position: progress.current,
  }));

  return {
    cardStyle: {
      transform: [{ translateY }],
    },
    containerStyle: {
      backgroundColor: 'rgba(0,0,0,0.3)',
    },
  };
};

const onTransitionEnd = () => {
  console.log('onTransitionEnd');
  store.dispatch(updateTransitionProps({ isTransitioning: false }));
};

const onTransitionStart = () => {
  console.log('onTransitionStart');
  store.dispatch(updateTransitionProps({ isTransitioning: true }));
};

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
  ExpandedAssetScreen: {
    navigationOptions: {
      cardTransparent: true,
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
      cardTransparent: true,
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
      cardTransparent: true,
      effect: 'expanded',
      gesturesEnabled: false,
    },
    screen: SettingsModal,
  },
  SwipeLayout: SwipeStack,
  WalletConnectConfirmationModal: {
    navigationOptions: {
      cardTransparent: true,
      effect: 'expanded',
      gestureResponseDistance: {
        vertical: deviceUtils.dimensions.height,
      },
    },
    screen: WalletConnectConfirmationModal,
  },
}, {
  cardStyleInterpolator,
  headerMode: 'none',
  initialRouteName: 'SwipeLayout',
  mode: 'modal',
  wip: {
    open: () => {
      store.dispatch(updateTransitionProps({ isExpanded: true }));
    },
    close: () => {
      store.dispatch(updateTransitionProps({ isExpanded: false }));
      onTransitionEnd();
    },
  },
  onTransitionStart,
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
