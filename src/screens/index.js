import { Navigation, ScreenVisibilityListener } from 'react-native-navigation';
import POCScreen from './POCScreen';
import QRScannerScreen from './QRScannerScreen';
import SendScreen from './SendScreen';
import SettingsScreen from './SettingsScreen';
import TransactionScreen from './TransactionScreen';
import WalletScreen from './WalletScreen';

// register all screens of the app (including internal ones)
export function registerScreens() {
  Navigation.registerComponent('BalanceWallet.POCScreen', () => POCScreen);
  Navigation.registerComponent('BalanceWallet.QRScannerScreen', () => QRScannerScreen);
  Navigation.registerComponent('BalanceWallet.SettingsScreen', () => SettingsScreen);
  Navigation.registerComponent('BalanceWallet.TransactionScreen', () => TransactionScreen);
  Navigation.registerComponent('BalanceWallet.WalletScreen', () => WalletScreen);
  Navigation.registerComponent('BalanceWallet.SendScreen', () => SendScreen);
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
