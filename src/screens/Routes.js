import { createSwitchNavigator, createStackNavigator } from 'react-navigation';
import createSwipeNavigator from '../navigators/createSwipeNavigator';
import IntroScreen from './IntroScreen';
import LoadingScreen from './LoadingScreen';
import SendScreen from './SendScreen';
import TransactionConfirmationScreenWithData from './TransactionConfirmationScreenWithData';
import QRScannerScreenWithData from './QRScannerScreenWithData';
import SettingsScreenWithData from './SettingsScreenWithData';
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
  ConfirmTransaction: TransactionConfirmationScreenWithData,
  SendScreen,
  SwipeLayout: SwipeStack,
}, {
  headerMode: 'none',
  initialRouteName: 'SwipeLayout',
  mode: 'modal',
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

