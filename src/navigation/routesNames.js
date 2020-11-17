import isNativeStackAvailable from '../helpers/isNativeStackAvailable';

const Routes = {
  ADD_CASH_SCREEN_NAVIGATOR: 'AddCashSheetNavigator',
  ADD_CASH_SHEET: 'AddCashSheet',
  AVATAR_BUILDER: 'AvatarBuilder',
  BACKUP_SCREEN: 'BackupScreen',
  BACKUP_SHEET: 'BackupSheet',
  CHANGE_WALLET_SHEET: 'ChangeWalletSheet',
  CHANGE_WALLET_SHEET_NAVIGATOR: 'ChangeWalletSheetNavigator',
  CONFIRM_REQUEST: 'ConfirmRequest',
  CURRENCY_SELECT_SCREEN: 'CurrencySelectScreen',
  EXAMPLE_SCREEN: 'ExampleScreen',
  EXCHANGE_MODAL: 'ExchangeModal',
  EXPANDED_ASSET_SCREEN: 'ExpandedAssetScreen',
  EXPANDED_ASSET_SHEET: 'ExpandedAssetSheet',
  IMPORT_SCREEN: 'ImportScreen',
  IMPORT_SEED_PHRASE_SHEET: 'ImportSeedPhraseSheet',
  IMPORT_SEED_PHRASE_SHEET_NAVIGATOR: 'ImportSeedPhraseSheetNavigator',
  MAIN_EXCHANGE_NAVIGATOR: 'MainExchangeNavigator',
  MAIN_EXCHANGE_SCREEN: 'MainExchangeScreen',
  MAIN_NATIVE_BOTTOM_SHEET_NAVIGATOR: 'MainNativeBottomSheetNavigation',
  MAIN_NAVIGATOR: 'MainNavigator',
  MAIN_NAVIGATOR_WRAPPER: 'MainNavigatorWrapper',
  MODAL_SCREEN: 'ModalScreen',
  NATIVE_STACK: 'NativeStack',
  PIN_AUTHENTICATION_SCREEN: 'PinAuthenticationScreen',
  PROFILE_SCREEN: 'ProfileScreen',
  QR_SCANNER_SCREEN: 'QRScannerScreen',
  RECEIVE_MODAL: 'ReceiveModal',
  RESTORE_SHEET: 'RestoreSheet',
  SAVINGS_DEPOSIT_MODAL: 'SavingsDepositModal',
  SAVINGS_SHEET: 'SavingsSheet',
  SAVINGS_WITHDRAW_MODAL: 'SavingsWithdrawModal',
  SEND_SHEET: 'SendSheet',
  SEND_SHEET_NAVIGATOR: 'SendSheetNavigator',
  SETTINGS_MODAL: 'SettingsModal',
  STACK: 'Stack',
  SUPPORTED_COUNTRIES_MODAL_SCREEN: 'SupportedCountriesModalScreen',
  SWAP_DETAILS_SCREEN: 'SwapDetailsScreen',
  SWIPE_LAYOUT: 'SwipeLayout',
  WALLET_CONNECT_APPROVAL_SHEET: 'WalletConnectApprovalSheet',
  WALLET_CONNECT_REDIRECT_SHEET: 'WalletConnectRedirectSheet',
  WALLET_SCREEN: 'WalletScreen',
  WELCOME_SCREEN: 'WelcomeScreen',
  WYRE_WEBVIEW: 'WyreWebview',
};

export const NATIVE_ROUTES = [
  Routes.RECEIVE_MODAL,
  Routes.SETTINGS_MODAL,
  Routes.EXCHANGE_MODAL,
  Routes.EXPANDED_ASSET_SHEET,
  Routes.CHANGE_WALLET_SHEET,
  Routes.MODAL_SCREEN,
  Routes.SAVINGS_SHEET,
  Routes.SAVINGS_WITHDRAW_MODAL,
  Routes.SAVINGS_DEPOSIT_MODAL,
  ...(isNativeStackAvailable
    ? [
        Routes.SEND_SHEET_NAVIGATOR,
        Routes.IMPORT_SEED_PHRASE_SHEET_NAVIGATOR,
        Routes.ADD_CASH_SCREEN_NAVIGATOR,
      ]
    : []),
];

const RoutesWithNativeStackAvailability = {
  ...Routes,
  ADD_CASH_FLOW: isNativeStackAvailable
    ? Routes.ADD_CASH_SCREEN_NAVIGATOR
    : Routes.ADD_CASH_SHEET,
  IMPORT_SEED_PHRASE_FLOW: isNativeStackAvailable
    ? Routes.IMPORT_SEED_PHRASE_SHEET_NAVIGATOR
    : Routes.IMPORT_SEED_PHRASE_SHEET,
  SEND_FLOW: isNativeStackAvailable || android
    ? Routes.SEND_SHEET_NAVIGATOR
    : Routes.SEND_SHEET,
};

export default RoutesWithNativeStackAvailability;
