// import { Keyboard } from 'react-native';
import { createSwitchNavigator, createStackNavigator } from 'react-navigation';
import { FluidNavigator } from 'react-navigation-fluid-transitions';
import IntroScreen from '../onboarding/IntroScreen';
import LoadingScreen from '../onboarding/LoadingScreen';
import SettingsScreenWithData from '../settings/SettingsScreenWithData';
import WalletScreen from '../wallet/WalletScreen';
import QRScannerScreen from './QRScannerScreen';

// const handleDismissKeyboard = () => Keyboard.dismiss();

const AppStack = FluidNavigator({
  QRScannerScreen: {
    navigationOptions: { gesturesEnabled: true },
    screen: QRScannerScreen,
  },
  SettingsScreen: {
    navigationOptions: {
      gestureDirection: 'inverted',
      gesturesEnabled: true,
    },
    screen: SettingsScreenWithData,
  },
  WalletScreen: {
    navigationOptions: { gesturesEnabled: true },
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

export default createSwitchNavigator(
  {
    Loading: LoadingScreen,
    App: AppStack,
    Intro: IntroStack,
  },
  {
    initialRouteName: 'Loading',
  },
);

