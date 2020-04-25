import { omit } from 'lodash';
import React from 'react';
import ViewPagerAdapter from 'react-native-tab-view-viewpager-adapter';
import { createAppContainer } from 'react-navigation';
import { createMaterialTopTabNavigator } from 'react-navigation-tabs';
import { ExchangeModalNavigator } from '../../navigation';
import {
  backgroundPreset,
  emojiPreset,
  expandedPreset,
  overlayExpandedPreset,
  sheetPreset,
} from '../../navigation/transitions/effects';
import { deviceUtils } from '../../utils';
import AddCashSheet from '../AddCashSheet';
import AvatarBuilder from '../AvatarBuilder';
import ExampleScreen from '../ExampleScreen';
import ExpandedAssetScreenWithData from '../ExpandedAssetScreenWithData';
import ImportSeedPhraseSheetWithData from '../ImportSeedPhraseSheetWithData';
import ProfileScreen from '../ProfileScreen';
import QRScannerScreenWithData from '../QRScannerScreenWithData';
import ReceiveModal from '../ReceiveModal';
import SendSheet from '../SendSheet';
import SettingsModal from '../SettingsModal';
import TransactionConfirmationScreenWithData from '../TransactionConfirmationScreenWithData';
import WalletConnectConfirmationModal from '../WalletConnectConfirmationModal';
import WalletScreen from '../WalletScreen';
import {
  createStackNavigator,
  exchangePresetWithTransitions,
  expandedPresetWithTransitions,
  onTransitionStart,
  sheetPresetWithTransitions,
} from './helpers';
import { onNavigationStateChange } from './onNavigationStateChange';
import Routes from './routesNames';

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
  [Routes.CONFIRM_REQUEST]: {
    navigationOptions: sheetPresetWithTransitions,
    screen: TransactionConfirmationScreenWithData,
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
