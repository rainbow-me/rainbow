import { omit } from 'lodash';
import React from 'react';
import ViewPagerAdapter from 'react-native-tab-view-viewpager-adapter';
import { createAppContainer } from 'react-navigation';
import { createMaterialTopTabNavigator } from 'react-navigation-tabs';
import AddCashSheet from '../screens/AddCashSheet';
import AvatarBuilder from '../screens/AvatarBuilder';
import ChangeWalletModal from '../screens/ChangeWalletModal';
import ExampleScreen from '../screens/ExampleScreen';
import ExpandedAssetScreenWithData from '../screens/ExpandedAssetScreenWithData';
import ImportSeedPhraseSheetWithData from '../screens/ImportSeedPhraseSheetWithData';
import ProfileScreen from '../screens/ProfileScreen';
import QRScannerScreenWithData from '../screens/QRScannerScreenWithData';
import ReceiveModal from '../screens/ReceiveModal';
import SendSheet from '../screens/SendSheet';
import SettingsModal from '../screens/SettingsModal';
import TransactionConfirmationScreen from '../screens/TransactionConfirmationScreen';
import WalletConnectConfirmationModal from '../screens/WalletConnectConfirmationModal';
import WalletScreen from '../screens/WalletScreen';
import { deviceUtils } from '../utils';
import {
  backgroundPreset,
  emojiPreset,
  expandedPreset,
  overlayExpandedPreset,
  sheetPreset,
} from './effects';
import {
  createStackNavigator,
  exchangePresetWithTransitions,
  expandedPresetWithTransitions,
  expandedReversePresetWithTransitions,
  onTransitionStart,
  sheetPresetWithTransitions,
} from './helpers';
import { onNavigationStateChange } from './onNavigationStateChange';
import Routes from './routesNames';
import { ExchangeModalNavigator } from './index';

const routesForSwipeStack = {
  [Routes.PROFILE_SCREEN]: ProfileScreen,
  [Routes.WALLET_SCREEN]: WalletScreen,
  [Routes.QR_SCANNER_SCREEN]: QRScannerScreenWithData,
};

const SwipeStack = createMaterialTopTabNavigator(routesForSwipeStack, {
  headerMode: 'none',
  initialLayout: deviceUtils.dimensions,
  initialRouteName: Routes.WALLET_SCREEN,
  pagerComponent: ViewPagerAdapter,
  swipeEnabled: true,
  tabBarComponent: null,
});

const routesForMainNavigator = {
  [Routes.AVATAR_BUILDER]: {
    navigationOptions: emojiPreset,
    screen: AvatarBuilder,
    transparentCard: true,
  },
  [Routes.CHANGE_WALLET_MODAL]: {
    navigationOptions: expandedReversePresetWithTransitions,
    screen: ChangeWalletModal,
  },
  [Routes.CONFIRM_REQUEST]: {
    navigationOptions: sheetPresetWithTransitions,
    screen: TransactionConfirmationScreen,
  },
  [Routes.EXAMPLE_SCREEN]: ExampleScreen,
  [Routes.EXCHANGE_MODAL]: {
    navigationOptions: exchangePresetWithTransitions,
    params: {
      isGestureBlocked: false,
    },
    screen: ExchangeModalNavigator,
  },
  [Routes.EXPANDED_ASSET_SCREEN]: {
    navigationOptions: expandedPreset,
    screen: ExpandedAssetScreenWithData,
  },
  [Routes.OVERLAY_EXPANDED_ASSET_SCREEN]: {
    navigationOptions: overlayExpandedPreset,
    screen: ExpandedAssetScreenWithData,
  },
  [Routes.RECEIVE_MODAL]: {
    navigationOptions: expandedPresetWithTransitions,
    screen: ReceiveModal,
  },
  [Routes.SETTINGS_MODAL]: {
    navigationOptions: expandedPresetWithTransitions,
    screen: SettingsModal,
    transparentCard: true,
  },
  SwipeLayout: {
    navigationOptions: backgroundPreset,
    screen: SwipeStack,
  },
  WalletConnectConfirmationModal: {
    navigationOptions: expandedPresetWithTransitions,
    screen: WalletConnectConfirmationModal,
  },
};

const MainNavigator = createStackNavigator(routesForMainNavigator);

const routesForStack = {
  AddCashSheet: {
    navigationOptions: {
      ...sheetPreset,
      onTransitionStart: props => {
        onTransitionStart(props);
        sheetPreset.onTransitionStart(props);
      },
    },
    screen: AddCashSheet,
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
  MainNavigator,
  SendSheet: {
    navigationOptions: {
      ...omit(sheetPreset, 'gestureResponseDistance'),
      onTransitionStart: props => {
        onTransitionStart(props);
        sheetPreset.onTransitionStart(props);
      },
    },
    screen: SendSheet,
  },
};
const Stack = createStackNavigator(routesForStack, {
  initialRouteName: 'MainNavigator',
});

const AppContainer = createAppContainer(Stack);

// eslint-disable-next-line react/display-name
const AppContainerWithAnalytics = React.forwardRef((props, ref) => (
  <AppContainer onNavigationStateChange={onNavigationStateChange} ref={ref} />
));

export default React.memo(AppContainerWithAnalytics);
