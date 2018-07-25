import { createSwitchNavigator, createStackNavigator } from 'react-navigation';
import { FluidNavigator } from 'react-navigation-fluid-transitions';
import IntroScreen from './IntroScreen';
import LoadingScreen from './LoadingScreen';
import QRScannerScreenWithData from './QRScannerScreenWithData';
import SettingsScreenWithData from './SettingsScreenWithData';
import TransactionConfirmationScreenWithData from './TransactionConfirmationScreenWithData';
import WalletScreen from './WalletScreen';

const AppStack = FluidNavigator({
  ConfirmTransaction: {
    screen: TransactionConfirmationScreenWithData,
    mode: 'modal',
    navigationOptions: {
      gesturesEnabled: false,
    },
  },
  QRScannerScreen: {
    screen: QRScannerScreenWithData,
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
    Intro: IntroStack,
    Loading: LoadingScreen,
  },
  {
    headerMode: 'none',
    initialRouteName: 'Loading',
    mode: 'modal',
  },
);

