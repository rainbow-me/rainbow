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
  bottomSheetPreset,
  emojiPreset,
  exchangePreset,
  expandedPreset,
  overlayExpandedPreset,
  sheetPreset,
} from '../../navigation/transitions/effects';
import { deviceUtils } from '../../utils';
import AddCashSheet from '../AddCashSheet';
import AvatarBuilder from '../AvatarBuilder';
import ChangeWalletSheet from '../ChangeWalletSheet';
import ExampleScreen from '../ExampleScreen';
import ImportScreen from '../ImportScreen';
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
    navigationOptions: sheetPreset,
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
    navigationOptions: sheetPreset,
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
    navigationOptions: sheetPreset,
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
  [Routes.EXAMPLE_SCREEN]: {
    navigationOptions: expandedPreset,
    screen: ExampleScreen,
  },
  [Routes.EXCHANGE_MODAL]: {
    navigationOptions: exchangePreset,
    params: {
      isGestureBlocked: false,
    },
    screen: ExchangeModalNavigator,
  },
  [Routes.SAVINGS_SHEET]: {
    navigationOptions: bottomSheetPreset,
    screen: SavingsSheet,
  },
  [Routes.SWIPE_LAYOUT]: {
    navigationOptions: backgroundPreset,
    screen: SwipeStack,
  },
  [Routes.IMPORT_SCREEN]: {
    navigationOptions: backgroundPreset,
    screen: ImportScreen,
  },
  [Routes.WALLET_CONNECT_APPROVAL_SHEET]: {
    navigationOptions: expandedPreset,
    screen: WalletConnectApprovalSheet,
  },
  [Routes.WALLET_CONNECT_REDIRECT_SHEET]: {
    navigationOptions: bottomSheetPreset,
    screen: WalletConnectRedirectSheet,
  },
  ...(isNativeStackAvailable && {
    [Routes.MODAL_SCREEN]: {
      navigationOptions: overlayExpandedPreset,
      screen: ModalScreen,
    },
  }),
};

const MainNavigator = createStackNavigator(routesForMainNavigator, {
  initialRouteName: Routes.IMPORT_SCREEN,
});

const routesForSavingsModals = {
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
    navigationOptions: sheetPreset,
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
  [Routes.CHANGE_WALLET_SHEET]: {
    navigationOptions: {
      backgroundOpacity: 0.6,
      cornerRadius: 0,
      customStack: true,
      headerHeight: 58,
      springDamping: 1,
      topOffset: 128,
      transitionDuration: 0.25,
    },
    screen: ChangeWalletSheet,
  },
  [Routes.CONFIRM_REQUEST]: {
    navigationOptions: {
      backgroundOpacity: 1,
      customStack: true,
      springDamping: 1,
      transitionDuration: 0.25,
    },
    screen: TransactionConfirmationScreen,
  },
  [Routes.EXPANDED_ASSET_SHEET]: {
    navigationOptions: {
      backgroundOpacity: 0.7,
      cornerRadius: 24,
      customStack: true,
      headerHeight: 50,
      onAppear: null,
      scrollEnabled: true,
      springDamping: 0.8755,
      topOffset: 0,
      transitionDuration: 0.42,
    },
    screen: ExpandedAssetSheetWrapper,
  },
  [Routes.RECEIVE_MODAL]: withCustomStack(ReceiveModal),
  [Routes.SETTINGS_MODAL]: withCustomStack(SettingsModal),
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
