import { Navigation, ScreenVisibilityListener } from 'react-native-navigation';

import QRScannerScreen from './QRScannerScreen';
import SettingsScreenWithData from './SettingsScreenWithData';
import TransactionConfirmationScreen from './TransactionConfirmationScreen';
import WalletScreen from './WalletScreen';

// register all screens of the app (including internal ones)
export function registerScreens(store, Provider) {
  Navigation.registerComponent('BalanceWallet.QRScannerScreen', () => QRScannerScreen, store, Provider);
  Navigation.registerComponent('BalanceWallet.SettingsScreen', () => SettingsScreenWithData, store, Provider);
  Navigation.registerComponent('BalanceWallet.TransactionConfirmationScreen', () => TransactionConfirmationScreen, store, Provider);
  Navigation.registerComponent('BalanceWallet.WalletScreen', () => WalletScreen, store, Provider);
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
