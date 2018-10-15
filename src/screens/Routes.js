import { createSwitchNavigator, createStackNavigator } from 'react-navigation';
import createSwipeNavigator from '../navigation/navigators/createSwipeNavigator';
import sheetTransition from '../navigation/transitions/sheet';
import ActivityScreen from './ActivityScreen';
import IntroScreen from './IntroScreen';
import LoadingScreen from './LoadingScreen';
import QRScannerScreenWithData from './QRScannerScreenWithData';
import SendScreenWithData from './SendScreenWithData';
import SettingsScreenWithData from './SettingsScreenWithData';
import TransactionConfirmationScreenWithData from './TransactionConfirmationScreenWithData';
import WalletScreen from './WalletScreen';

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
      gesturesEnabled: false,
      effect: 'sheet',
    },
    screen: ActivityScreen,
  },
  ConfirmTransaction: TransactionConfirmationScreenWithData,
  SendScreen: {
    navigationOptions: {
      effect: 'sheet',
    },
    screen: SendScreenWithData,
  },
  SwipeLayout: SwipeStack,
}, {
  headerMode: 'none',
  initialRouteName: 'SwipeLayout',
  mode: 'modal',
  transitionConfig: sheetTransition,
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

