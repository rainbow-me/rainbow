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
  mode: 'card', // Horizontal gestures
});

export default createSwitchNavigator(
  {
    App: AppStack,
    ConfirmTransaction: TransactionConfirmationScreen,
    Intro: IntroStack,
    Loading: LoadingScreen,
  },
  {
    headerMode: 'none',
    initialRouteName: 'Loading',
    mode: 'modal',
  },
);

