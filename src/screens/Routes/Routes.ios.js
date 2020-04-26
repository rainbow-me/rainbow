import { omit } from 'lodash';
import React from 'react';
import { StatusBar } from 'react-native';
import createBottomSheetStackNavigator from 'react-native-cool-modals/createNativeStackNavigator';
import createNativeStackNavigator from 'react-native-screens/createNativeStackNavigator';
import { createAppContainer } from 'react-navigation';
import { createMaterialTopTabNavigator } from 'react-navigation-tabs-v1';
import isNativeStackAvailable from '../../helpers/isNativeStackAvailable';
import { ExchangeModalNavigator, SavingModalNavigator } from '../../navigation';
import {
  backgroundPreset,
  emojiPreset,
  expandedPreset,
  overlayExpandedPreset,
  savingsPreset,
  sheetPreset,
} from '../../navigation/transitions/effects';
import { deviceUtils } from '../../utils';
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
import {
  createStackNavigator,
  exchangePresetWithTransitions,
  expandedPresetWithTransitions,
  onTransitionEnd,
  onTransitionStart,
  sheetPresetWithTransitions,
} from './helpers';
import {
  AddCashSheetWrapper,
  appearListener,
  ImportSeedPhraseSheetWrapper,
  SendSheetWrapper,
} from './nativeStackWrappers';
import { onNavigationStateChange } from './onNavigationStateChange.ios';
import ROUTES from './routesNames';

const routesForSwipeStack = {
  [ROUTES.PROFILE_SCREEN]: ProfileScreenWithData,
  [ROUTES.WALLET_SCREEN]: WalletScreen,
  [ROUTES.QR_SCANNER_SCREEN]: QRScannerScreenWithData,
};

const SwipeStack = createMaterialTopTabNavigator(routesForSwipeStack, {
  headerMode: 'none',
  initialLayout: deviceUtils.dimensions,
  initialRouteName: ROUTES.WALLET_SCREEN,
  tabBarComponent: null,
});

const sendFlowRoutes = {
  [ROUTES.OVERLAY_EXPANDED_ASSET_SCREEN]: {
    navigationOptions: overlayExpandedPreset,
    screen: ExpandedAssetScreenWithData,
  },
  [ROUTES.SEND_SHEET]: {
    navigationOptions: sheetPresetWithTransitions,
    screen: SendSheetWrapper,
  },
};

const SendFlowNavigator = createStackNavigator(sendFlowRoutes, {
  initialRouteName: ROUTES.SEND_SHEET,
});

const routesForAddCash = {
  [ROUTES.ADD_CASH_SHEET]: {
    navigationOptions: sheetPresetWithTransitions,
    screen: AddCashSheetWrapper,
  },
  [ROUTES.OVERLAY_EXPANDED_SUPPORTED_COUNTRIES]: {
    navigationOptions: overlayExpandedPreset,
    screen: ExpandedAssetScreenWithData,
  },
};

const routesForMainNavigator = {
  [ROUTES.AVATAR_BUILDER]: {
    navigationOptions: emojiPreset,
    screen: AvatarBuilder,
    transparentCard: true,
  },
  [ROUTES.CONFIRM_REQUEST]: {
    navigationOptions: sheetPresetWithTransitions,
    screen: TransactionConfirmationScreenWithData,
  },
  [ROUTES.EXAMPLE_SCREEN]: {
    navigationOptions: expandedPresetWithTransitions,
    screen: ExampleScreen,
  },
  [ROUTES.EXCHANGE_MODAL]: {
    navigationOptions: exchangePresetWithTransitions,
    params: {
      isGestureBlocked: false,
    },
    screen: ExchangeModalNavigator,
  },
  [ROUTES.EXPANDED_ASSET_SCREEN]: {
    navigationOptions: expandedPreset,
    screen: ExpandedAssetScreenWithData,
  },
  [ROUTES.SAVINGS_SHEET]: {
    navigationOptions: savingsPreset,
    screen: SavingsSheet,
  },
  [ROUTES.SWIPE_LAYOUT]: {
    navigationOptions: backgroundPreset,
    screen: SwipeStack,
  },
  [ROUTES.WALLET_CONNECT_CONFIRMATION_MODAL]: {
    navigationOptions: expandedPresetWithTransitions,
    screen: WalletConnectConfirmationModal,
  },
  ...(isNativeStackAvailable && {
    [ROUTES.OVERLAY_EXPANDED_ASSET_SCREEN]: {
      navigationOptions: overlayExpandedPreset,
      screen: ExpandedAssetScreenWithData,
    },
  }),
};

const MainNavigator = createStackNavigator(routesForMainNavigator);

const routesForSavingsModals = {
  [ROUTES.SAVINGS_DEPOSIT_MODAL]: {
    navigationOptions: expandedPresetWithTransitions,
    params: {
      isGestureBlocked: false,
    },
    screen: SavingModalNavigator,
  },
  [ROUTES.SAVINGS_DEPOSIT_MODAL]: {
    navigationOptions: expandedPresetWithTransitions,
    params: {
      isGestureBlocked: false,
    },
    screen: WithdrawModal,
  },
};

const AddCashFlowNavigator = createStackNavigator(routesForAddCash, {
  initialRouteName: ROUTES.ADD_CASH_SHEET,
});

const routesForNativeStack = {
  [ROUTES.MAIN_NAVIGATOR]: MainNavigator,
  [ROUTES.IMPORT_SEED_PHRASE_SHEET]: ImportSeedPhraseSheetWrapper,
  ...(isNativeStackAvailable && {
    [ROUTES.SEND_SHEET_NAVIGATOR]: SendFlowNavigator,
    [ROUTES.ADD_CASH_SCREEN_NAVIGATOR]: AddCashFlowNavigator,
  }),
};

const NativeStack = createNativeStackNavigator(routesForNativeStack, {
  defaultNavigationOptions: {
    onAppear: () => appearListener.current && appearListener.current(),
  },
  headerMode: 'none',
  initialRouteName: ROUTES.MAIN_NAVIGATOR,
  mode: 'modal',
});

const routesForNativeStackWrapper = {
  [ROUTES.NATIVE_STACK]: NativeStack,
  ...routesForSavingsModals,
};

const NativeStackWrapper = createStackNavigator(routesForNativeStackWrapper, {
  initialRouteName: ROUTES.NATIVE_STACK,
});

const routesForNativeStackFallback = {
  [ROUTES.ADD_CASH_SHEET]: {
    navigationOptions: sheetPresetWithTransitions,
    screen: AddCashSheet,
  },
  [ROUTES.IMPORT_SEED_PHRASE_SHEET]: {
    navigationOptions: {
      ...sheetPreset,
      onTransitionStart: () => {
        StatusBar.setBarStyle('light-content');
      },
    },
    screen: ImportSeedPhraseSheetWithData,
  },
  [ROUTES.MAIN_NAVIGATOR]: MainNavigator,
  [ROUTES.OVERLAY_EXPANDED_ASSET_SCREEN]: {
    navigationOptions: overlayExpandedPreset,
    screen: ExpandedAssetScreenWithData,
  },
  [ROUTES.OVERLAY_EXPANDED_SUPPORTED_COUNTRIES]: {
    navigationOptions: overlayExpandedPreset,
    screen: ExpandedAssetScreenWithData,
  },
  [ROUTES.SEND_SHEET]: {
    navigationOptions: {
      ...omit(sheetPreset, 'gestureResponseDistance'),
      onTransitionStart: () => {
        StatusBar.setBarStyle('light-content');
        onTransitionStart();
      },
    },
    screen: SendSheetWithData,
  },
  ...routesForSavingsModals,
};

const NativeStackFallback = createStackNavigator(routesForNativeStackFallback, {
  defaultNavigationOptions: {
    onTransitionEnd,
    onTransitionStart,
  },
  headerMode: 'none',
  initialRouteName: ROUTES.MAIN_NAVIGATOR,
  mode: 'modal',
});

const Stack = isNativeStackAvailable ? NativeStackWrapper : NativeStackFallback;

const routesForBottomSheetStack = {
  [ROUTES.STACK]: Stack,
  [ROUTES.RECEIVE_MODAL]: ReceiveModal,
  [ROUTES.SETTINGS_MODAL]: SettingsModal,
};

const MainNativeBottomSheetNavigation = createBottomSheetStackNavigator(
  routesForBottomSheetStack,
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

const AppContainer = createAppContainer(MainNativeBottomSheetNavigation);

const AppContainerWithAnalytics = React.forwardRef((props, ref) => (
  <AppContainer ref={ref} onNavigationStateChange={onNavigationStateChange} />
));

AppContainerWithAnalytics.displayName = 'AppContainerWithAnalytics';

export default React.memo(AppContainerWithAnalytics);
