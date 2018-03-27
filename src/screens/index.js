import { Navigation, ScreenVisibilityListener } from 'react-native-navigation';

import POCScreen from './POCScreen';
import QRScannerScreen from './QRScannerScreen';
import TransactionScreen from './TransactionScreen';

// register all screens of the app (including internal ones)
export function registerScreens() {
    Navigation.registerComponent('BalanceWallet.POCScreen', () => POCScreen);
    Navigation.registerComponent('BalanceWallet.QRScannerScreen', () => QRScannerScreen);
    Navigation.registerComponent('BalanceWallet.TransactionScreen', () => TransactionScreen);
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
