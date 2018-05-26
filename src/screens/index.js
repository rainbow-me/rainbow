import { Navigation, ScreenVisibilityListener } from 'react-native-navigation';

import POCScreen from './POCScreen';
import QRScannerScreen from './QRScannerScreen';
import SettingsScreen from './SettingsScreen';
import TransactionScreen from './TransactionScreen';
import DemoTransactionScreen from './DemoTransactionScreen';
import WalletScreen from './WalletScreen';

// register all screens of the app (including internal ones)
export function registerScreens() {
  Navigation.registerComponent('BalanceWallet.POCScreen', () => POCScreen);
  Navigation.registerComponent('BalanceWallet.QRScannerScreen', () => QRScannerScreen);
  Navigation.registerComponent('BalanceWallet.SettingsScreen', () => SettingsScreen);
  Navigation.registerComponent('BalanceWallet.TransactionScreen', () => TransactionScreen);
  Navigation.registerComponent('BalanceWallet.DemoTransactionScreen', () => DemoTransactionScreen);
  Navigation.registerComponent('BalanceWallet.WalletScreen', () => WalletScreen);
}

export function registerScreenVisibilityListener() {
  new ScreenVisibilityListener({
    willAppear: ({ screen }) => console.log(`Displaying screen ${screen}`),
    didAppear: ({
      screen, startTime, endTime, commandType,
    }) =>
      console.log('screenVisibility', `Screen ${screen} displayed in ${endTime - startTime} millis [${commandType}]`),
    willDisappear: ({ screen }) => console.log(`Screen will disappear ${screen}`),
    didDisappear: ({ screen }) => console.log(`Screen disappeared ${screen}`),
  }).register();
}
