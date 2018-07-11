import { Navigation, ScreenVisibilityListener } from 'react-native-navigation';
import POCScreen from './screens/POCScreen';
import QRScannerScreen from './screens/QRScannerScreen';
import SendScreen from './screens/SendScreen';
import TransactionScreen from './screens/TransactionScreen';
import SettingsScreenWithData from './settings/SettingsScreenWithData';
import WalletScreenWithData from './wallet/WalletScreenWithData';
ster all screens of the app (including internal ones)
export function registerScreens() {
  Navigation.registerComponent('BalanceWallet.POCScreen', () => POCScreen);
  Navigation.registerComponent('BalanceWallet.QRScannerScreen', () => QRScannerScreen);
  Navigation.registerComponent('BalanceWallet.SettingsScreen', () => SettingsScreenWithData);
  Navigation.registerComponent('BalanceWallet.TransactionScreen', () => TransactionScreen);
  Navigation.registerComponent('BalanceWallet.SendScreen', () => SendScreen);
  Navigation.registerComponent('BalanceWallet.WalletScreen', () => WalletScreenWithData);
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

export default function initializeScreens() {
  registerScreens();
  registerScreenVisibilityListener();
}
