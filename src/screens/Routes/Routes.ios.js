import { omit } from 'lodash';
import React from 'react';
import { StatusBar } from 'react-native';
import createNativeStackNavigator from 'react-native-cool-modals/createNativeStackNavigator';
import { createAppContainer } from 'react-navigation';
import { createMaterialTopTabNavigator } from 'react-navigation-tabs-v1';
import isNativeStackAvailable from '../../helpers/isNativeStackAvailable';
import { ExchangeModalNavigator, SavingModalNavigator } from '../../navigation';
import { onDidPop, onWillPop } from '../../navigation/Navigation';
import {
  backgroundPreset,
  emojiPreset,
  overlayExpandedPreset,
  savingsPreset,
  sheetPreset,
} from '../../navigation/transitions/effects';
import { deviceUtils } from '../../utils';
import AddCashSheet from '../AddCashSheet';
import AvatarBuilder from '../AvatarBuilder';
import ChangeWalletModal from '../ChangeWalletModal';
import ExampleScreen from '../ExampleScreen';
import ImportSeedPhraseSheetWithData from '../ImportSeedPhraseSheetWithData';
import ModalScreen from '../ModalScreen';
import ProfileScreen from '../ProfileScreen';
import QRScannerScreenWithData from '../QRScannerScreenWithData';
import ReceiveModal from '../ReceiveModal';
import SavingsSheet from '../SavingsSheet';
import SendSheet from '../SendSheet';
import SettingsModal from '../SettingsModal';
import TransactionConfirmationScreen from '../TransactionConfirmationScreen';
import WalletConnectConfirmationModal from '../WalletConnectConfirmationModal';
import WalletScreen from '../WalletScreen';
import WithdrawModal from '../WithdrawModal';
import {
  createStackNavigator,
  exchangePresetWithTransitions,
  expandedPresetWithTransitions,
  expandedReversePresetWithTransitions,
  onTransitionEnd,
  onTransitionStart,
  sheetPresetWithTransitions,
} from './helpers';
import {
  AddCashSheetWrapper,
  appearListener,
  ExpandedAssetSheetWrapper,
  ImportSeedPhraseSheetWrapper,
  SendSheetWrapper,
} from './nativeStackWrappers';
import { onNavigationStateChange } from './onNavigationStateChange.ios';
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
  tabBarComponent: null,
});

const importSeedPhraseFlowRoutes = {
  [Routes.IMPORT_SEED_PHRASE_SHEET]: {
    navigationOptions: sheetPresetWithTransitions,
    screen: ImportSeedPhraseSheetWrapper,
  },
  [Routes.MODAL_SCREEN]: {
    navigationOptions: overlayExpandedPreset,
    screen: ModalScreen,
  },
};

const sendFlowRoutes = {
  [Routes.MODAL_SCREEN]: {
    navigationOptions: overlayExpandedPreset,
    screen: ModalScreen,
  },
  [Routes.SEND_SHEET]: {
    navigationOptions: sheetPresetWithTransitions,
    screen: SendSheetWrapper,
  },
};

const SendFlowNavigator = createStackNavigator(sendFlowRoutes, {
  initialRouteName: Routes.SEND_SHEET,
});

const ImportSeedPhraseFlowNavigator = createStackNavigator(
  importSeedPhraseFlowRoutes,
  {
    initialRouteName: Routes.IMPORT_SEED_PHRASE_SHEET,
  }
);

const routesForAddCash = {
  [Routes.ADD_CASH_SHEET]: {
    navigationOptions: sheetPresetWithTransitions,
    screen: AddCashSheetWrapper,
  },
  [Routes.SUPPORTED_COUNTRIES_MODAL_SCREEN]: {
    navigationOptions: overlayExpandedPreset,
    screen: ModalScreen,
  },
};

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
  [Routes.EXAMPLE_SCREEN]: {
    navigationOptions: expandedPresetWithTransitions,
    screen: ExampleScreen,
  },
  [Routes.EXCHANGE_MODAL]: {
    navigationOptions: exchangePresetWithTransitions,
    params: {
      isGestureBlocked: false,
    },
    screen: ExchangeModalNavigator,
  },
  [Routes.SAVINGS_SHEET]: {
    navigationOptions: savingsPreset,
    screen: SavingsSheet,
  },
  [Routes.SWIPE_LAYOUT]: {
    navigationOptions: backgroundPreset,
    screen: SwipeStack,
  },
  [Routes.WALLET_CONNECT_CONFIRMATION_MODAL]: {
    navigationOptions: expandedPresetWithTransitions,
    screen: WalletConnectConfirmationModal,
  },
  ...(isNativeStackAvailable && {
    [Routes.MODAL_SCREEN]: {
      navigationOptions: overlayExpandedPreset,
      screen: ModalScreen,
    },
  }),
};

const MainNavigator = createStackNavigator(routesForMainNavigator);

const routesForSavingsModals = {
  [Routes.SAVINGS_DEPOSIT_MODAL]: {
    navigationOptions: exchangePresetWithTransitions,
    params: {
      isGestureBlocked: false,
    },
    screen: SavingModalNavigator,
  },
  [Routes.SAVINGS_WITHDRAW_MODAL]: {
    navigationOptions: exchangePresetWithTransitions,
    params: {
      isGestureBlocked: false,
    },
    screen: WithdrawModal,
  },
};

const AddCashFlowNavigator = createStackNavigator(routesForAddCash, {
  initialRouteName: Routes.ADD_CASH_SHEET,
});

const routesForNativeStack = {
  [Routes.IMPORT_SEED_PHRASE_SHEET_NAVIGATOR]: ImportSeedPhraseFlowNavigator,
  [Routes.SEND_SHEET_NAVIGATOR]: SendFlowNavigator,
  [Routes.ADD_CASH_SCREEN_NAVIGATOR]: AddCashFlowNavigator,
};

const routesForMainNavigatorWrapper = {
  [Routes.MAIN_NAVIGATOR]: MainNavigator,
  ...routesForSavingsModals,
};

const MainNavigationWrapper = createStackNavigator(
  routesForMainNavigatorWrapper,
  {
    initialRouteName: Routes.MAIN_NAVIGATOR,
  }
);

const routesForNativeStackFallback = {
  [Routes.ADD_CASH_SHEET]: {
    navigationOptions: sheetPresetWithTransitions,
    screen: AddCashSheet,
  },
  [Routes.IMPORT_SEED_PHRASE_SHEET]: {
    navigationOptions: {
      ...sheetPreset,
      onTransitionStart: () => {
        StatusBar.setBarStyle('light-content');
      },
    },
    screen: ImportSeedPhraseSheetWithData,
  },
  [Routes.MAIN_NAVIGATOR]: MainNavigator,
  [Routes.MODAL_SCREEN]: {
    navigationOptions: overlayExpandedPreset,
    screen: ModalScreen,
  },
  [Routes.SEND_SHEET]: {
    navigationOptions: {
      ...omit(sheetPreset, 'gestureResponseDistance'),
      onTransitionStart: () => {
        StatusBar.setBarStyle('light-content');
        onTransitionStart();
      },
    },
    screen: SendSheet,
  },
  [Routes.SUPPORTED_COUNTRIES_MODAL_SCREEN]: {
    navigationOptions: overlayExpandedPreset,
    screen: ModalScreen,
  },
  ...routesForSavingsModals,
};

const NativeStackFallback = createStackNavigator(routesForNativeStackFallback, {
  defaultNavigationOptions: {
    onTransitionEnd,
    onTransitionStart,
  },
  headerMode: 'none',
  initialRouteName: Routes.MAIN_NAVIGATOR,
  mode: 'modal',
});

const Stack = isNativeStackAvailable
  ? MainNavigationWrapper
  : NativeStackFallback;

const withCustomStack = screen => ({
  navigationOptions: { customStack: true, onAppear: null },
  screen,
});

const routesForBottomSheetStack = {
  [Routes.STACK]: Stack,
  [Routes.RECEIVE_MODAL]: withCustomStack(ReceiveModal),
  [Routes.SETTINGS_MODAL]: withCustomStack(SettingsModal),
  [Routes.EXPANDED_ASSET_SHEET]: {
    navigationOptions: {
      allowsDragToDismiss: true,
      allowsTapToDismiss: true,
      backgroundOpacity: 0.7,
      blocksBackgroundTouches: true,
      cornerRadius: 24,
      customStack: true,
      gestureEnabled: true,
      headerHeight: 50,
      onAppear: null,
      scrollEnabled: true,
      springDamping: 0.8755,
      topOffset: 0,
      transitionDuration: 0.42,
    },
    screen: ExpandedAssetSheetWrapper,
  },
  ...(isNativeStackAvailable && routesForNativeStack),
};

const MainNativeBottomSheetNavigation = createNativeStackNavigator(
  routesForBottomSheetStack,
  {
    defaultNavigationOptions: {
      onAppear: () => appearListener.current && appearListener.current(),
      onDismissed: onDidPop,
      onWillDismiss: () => {
        onWillPop();
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
