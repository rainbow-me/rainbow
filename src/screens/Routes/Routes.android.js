import { omit } from 'lodash';
import React from 'react';
import ViewPagerAdapter from 'react-native-tab-view-viewpager-adapter';
import { createAppContainer } from 'react-navigation';
import { createMaterialTopTabNavigator } from 'react-navigation-tabs';
import { ExchangeModalNavigator, SavingModalNavigator } from '../../navigation';
import {
  backgroundPreset,
  bottomSheetPreset,
  emojiPreset,
  exchangePreset,
  expandedPreset,
  onTransitionStart,
  overlayExpandedPreset,
  sheetPreset,
} from '../../navigation/transitions/effects';
import { deviceUtils } from '../../utils';
import AddCashSheet from '../AddCashSheet';
import AvatarBuilder from '../AvatarBuilder';
import ChangeWalletSheet from '../ChangeWalletSheet';
import ExampleScreen from '../ExampleScreen';
import ExpandedAssetSheet from '../ExpandedAssetSheet';
import ImportSeedPhraseSheetWithData from '../ImportSeedPhraseSheetWithData';
import ModalScreen from '../ModalScreen';
import ProfileScreen from '../ProfileScreen';
import QRScannerScreenWithData from '../QRScannerScreenWithData';
import ReceiveModal from '../ReceiveModal';
import SavingsSheet from '../SavingsSheet';
import SendSheet from '../SendSheet';
import SettingsModal from '../SettingsModal';
import TransactionConfirmationScreen from '../TransactionConfirmationScreen';
import WalletConnectApprovalSheet from '../WalletConnectApprovalSheet';
import WalletConnectRedirectSheet from '../WalletConnectRedirectSheet';
import WalletScreen from '../WalletScreen';
import WithdrawModal from '../WithdrawModal';
import { createStackNavigator } from './helpers';
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
  [Routes.CHANGE_WALLET_SHEET]: {
    navigationOptions: bottomSheetPreset,
    screen: ChangeWalletSheet,
  },
  [Routes.CONFIRM_REQUEST]: {
    navigationOptions: sheetPreset,
    screen: TransactionConfirmationScreen,
  },
  [Routes.EXAMPLE_SCREEN]: ExampleScreen,
  [Routes.EXCHANGE_MODAL]: {
    navigationOptions: exchangePreset,
    params: {
      isGestureBlocked: false,
    },
    screen: ExchangeModalNavigator,
  },
  [Routes.EXPANDED_ASSET_SHEET]: {
    navigationOptions: expandedPreset,
    screen: ExpandedAssetSheet,
  },
  [Routes.RECEIVE_MODAL]: {
    navigationOptions: expandedPreset,
    screen: ReceiveModal,
  },
  [Routes.SAVINGS_SHEET]: {
    navigationOptions: bottomSheetPreset,
    screen: SavingsSheet,
  },
  [Routes.SETTINGS_MODAL]: {
    navigationOptions: expandedPreset,
    screen: SettingsModal,
    transparentCard: true,
  },
  [Routes.SWIPE_LAYOUT]: {
    navigationOptions: backgroundPreset,
    screen: SwipeStack,
  },
  [Routes.WALLET_CONNECT_APPROVAL_SHEET]: {
    navigationOptions: expandedPreset,
    screen: WalletConnectApprovalSheet,
  },
  [Routes.WALLET_CONNECT_REDIRECT_SHEET]: {
    navigationOptions: bottomSheetPreset,
    screen: WalletConnectRedirectSheet,
  },
};

const MainNavigator = createStackNavigator(routesForMainNavigator);

const routesForStack = {
  [Routes.ADD_CASH_SHEET]: {
    navigationOptions: {
      ...sheetPreset,
      onTransitionStart: props => {
        onTransitionStart(props);
        sheetPreset.onTransitionStart(props);
      },
    },
    screen: AddCashSheet,
  },
  [Routes.IMPORT_SEED_PHRASE_SHEET]: {
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
  [Routes.MODAL_SCREEN]: {
    navigationOptions: overlayExpandedPreset,
    screen: ModalScreen,
  },
  [Routes.SAVINGS_DEPOSIT_MODAL]: {
    navigationOptions: exchangePreset,
    params: {
      isGestureBlocked: false,
    },
    screen: SavingModalNavigator,
  },
  [Routes.SAVINGS_WITHDRAW_MODAL]: {
    navigationOptions: exchangePreset,
    params: {
      isGestureBlocked: false,
    },
    screen: WithdrawModal,
  },
  [Routes.SEND_SHEET]: {
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
