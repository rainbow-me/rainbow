import { createSwitchNavigator, createStackNavigator } from 'react-navigation';
import IntroScreen from './IntroScreen';
import LoadingScreen from './LoadingScreen';
import SendScreen from './SendScreen';
import TransactionConfirmationScreenWithData from './TransactionConfirmationScreenWithData';
import QRScannerScreenWithData from './QRScannerScreenWithData';
import SettingsScreenWithData from './SettingsScreenWithData';
import WalletScreen from './WalletScreen';

import createSwipeNavigator from '../navigators/createSwipeNavigator';

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
});

const AppStack = createStackNavigator({
  ConfirmTransaction: {
    screen: TransactionConfirmationScreenWithData,
    mode: 'modal',
    navigationOptions: {
      gesturesEnabled: false,
    },
  },
  SwipeLayout: SwipeStack,
  SendScreen: {
    screen: SendScreen,
  },
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

