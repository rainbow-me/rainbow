import { createSwitchNavigator, createStackNavigator } from 'react-navigation';
import { FluidNavigator } from 'react-navigation-fluid-transitions';
import IntroScreen from './IntroScreen';
import LoadingScreen from './LoadingScreen';
import QRScannerScreen from './QRScannerScreen';
import SettingsScreenWithData from './SettingsScreenWithData';
import TransactionConfirmationScreen from './TransactionConfirmationScreen';
import WalletScreen from './WalletScreen';

const AppStack = FluidNavigator({
  QRScannerScreen: {
    screen: QRScannerScreen,
  },
  SettingsScreen: {
    navigationOptions: {
      gestureDirection: 'inverted',
    },
    screen: SettingsScreenWithData,
  },
  WalletScreen: {
    screen: WalletScreen,
  },
}, {
  initialRouteName: 'WalletScreen',
  mode: 'card', // Horizontal gestures
  navigationOptions: { gesturesEnabled: true },
});

const IntroStack = createStackNavigator({
  IntroScreen,
}, {
  headerMode: 'none',
});

const ConfirmTransactionStack = createStackNavigator({
  TransactionConfirmationScreen,
}, {
  mode: 'modal',
  headerMode: 'none',
});

export default createSwitchNavigator(
  {
    Loading: LoadingScreen,
    App: AppStack,
    Intro: IntroStack,
    ConfirmTransaction: ConfirmTransactionStack,
  },
  {
    initialRouteName: 'Loading',
  },
);

