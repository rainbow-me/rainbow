import { createSwitchNavigator, createStackNavigator } from 'react-navigation';
import createSwipeNavigator from '../navigation/navigators/createSwipeNavigator';
import { buildTransitions, expanded, sheet } from '../navigation/transitions';
import ActivityScreen from './ActivityScreen';
import ExpandedAssetScreen from './ExpandedAssetScreen';
import IntroScreen from './IntroScreen';
import LoadingScreen from './LoadingScreen';
import QRScannerScreenWithData from './QRScannerScreenWithData';
import SendQRScannerScreenWithData from './SendQRScannerScreenWithData';
import SendScreenWithData from './SendScreenWithData';
import SettingsScreenWithData from './SettingsScreenWithData';
import TransactionConfirmationScreenWithData from './TransactionConfirmationScreenWithData';
import MessageSigningScreenWithData from './MessageSigningScreenWithData';
import WalletScreen from './WalletScreen';
import { deviceUtils } from '../utils';
import store from '../redux/store';
import { updateTransitionProps } from '../redux/navigation';

import Navigation from '../navigation';

const SwipeStack = createSwipeNavigator({
  SettingsScreen: {
    name: 'SettingsScreen',
    screen: SettingsScreenWithData,
    statusBarColor: 'dark-content',
  },
  WalletScreen: {
    name: 'WalletScreen',
    screen: WalletScreen,
    statusBarColor: 'dark-content',
  },
  QRScannerScreen: {
    name: 'QRScannerScreen',
    screen: QRScannerScreenWithData,
    statusBarColor: 'light-content',
  },
}, {
  headerMode: 'none',
  initialRouteName: 'WalletScreen',
  onSwipeStart: () => Navigation.pauseNavigationActions(),
  onSwipeEnd: (navigation) => Navigation.resumeNavigationActions(navigation),
});

const AppStack = createStackNavigator({
  ActivityScreen: {
    navigationOptions: {
      effect: 'sheet',
      gesturesEnabled: false // @NOTE: disabled the gesture for ActivityScreen due to conflict with the Notification Center gesture
    },
    screen: ActivityScreen,
  },
  ConfirmTransaction: TransactionConfirmationScreenWithData,
  SignMessage: MessageSigningScreenWithData,
  ExpandedAssetScreen: {
    navigationOptions: {
      effect: 'expanded',
      gestureResponseDistance: {
        vertical: deviceUtils.dimensions.height,
      },
    },
    screen: ExpandedAssetScreen,
  },
  SendScreen: SendScreenWithData,
  SendQRScannerScreen: SendQRScannerScreenWithData,
  SwipeLayout: SwipeStack,
}, {
  headerMode: 'none',
  initialRouteName: 'SwipeLayout',
  mode: 'modal',
  transitionConfig: buildTransitions(Navigation, { expanded, sheet }),
  cardStyle: {
    backgroundColor: 'transparent',
  },
  onTransitionStart() {
    store.dispatch(updateTransitionProps({ isTransitioning: true }));
  },
  onTransitionEnd() {
    store.dispatch(updateTransitionProps({ isTransitioning: false }));
  },
});

const IntroStack = createStackNavigator({
  IntroScreen,
}, {
  headerMode: 'none',
  mode: 'card', // Horizontal gestures
});

export default createSwitchNavigator(
  {
    App: AppStack,
    Intro: IntroStack,
    Loading: LoadingScreen,
  },
  {
    headerMode: 'none',
    initialRouteName: 'Loading',
    mode: 'modal',
  },
);

