import isNativeStackAvailable from '../helpers/isNativeStackAvailable';

const Routes = {
  ADD_CASH_SCREEN_NAVIGATOR: 'AddCashSheetNavigator',
  ADD_CASH_SHEET: 'AddCashSheet',
  ADD_TOKEN_SHEET: 'AddTokenSheet',
  AVATAR_BUILDER: 'AvatarBuilder',
  BACKUP_SCREEN: 'BackupScreen',
  BACKUP_SHEET: 'BackupSheet',
  CHANGE_WALLET_SHEET: 'ChangeWalletSheet',
  CHANGE_WALLET_SHEET_NAVIGATOR: 'ChangeWalletSheetNavigator',
  CONFIRM_REQUEST: 'ConfirmRequest',
  CONNECTED_DAPPS: 'ConnectedDapps',
  CURRENCY_SELECT_SCREEN: 'CurrencySelectScreen',
  CUSTOM_GAS_SHEET: 'CustomGasSheet',
  ENS_ADDITIONAL_RECORDS_SHEET: 'ENSAdditionalRecordsSheet',
  ENS_ASSIGN_RECORDS_SHEET: 'ENSAssignRecordsSheet',
  ENS_CONFIRM_REGISTER_SHEET: 'ENSConfirmRegisterSheet',
  ENS_INTRO_SHEET: 'ENSIntroSheet',
  ENS_SEARCH_SHEET: 'ENSSearchSheet',
  EXAMPLE_SCREEN: 'ExampleScreen',
  EXCHANGE_MODAL: 'ExchangeModal',
  EXPANDED_ASSET_SCREEN: 'ExpandedAssetScreen',
  EXPANDED_ASSET_SHEET: 'ExpandedAssetSheet',
  EXPANDED_ASSET_SHEET_POOLS: 'ExpandedAssetSheetPools',
  EXPLAIN_SHEET: 'ExplainSheet',
  EXTERNAL_LINK_WARNING_SHEET: 'ExternalLinkWarningSheet',
  IMPORT_SCREEN: 'ImportScreen',
  PAIR_HARDWARE_WALLET_NAVIGATOR: 'PairHardwareWalletNavigator',
  PAIR_HARDWARE_WALLET_INTRO_SHEET: 'PairHardwareWalletIntroSheet',
  PAIR_HARDWARE_WALLET_SEARCH_SHEET: 'PairHardwareWalletSearchSheet',
  IMPORT_SEED_PHRASE_SHEET: 'ImportSeedPhraseSheet',
  IMPORT_SEED_PHRASE_SHEET_NAVIGATOR: 'ImportSeedPhraseSheetNavigator',
  MAIN_EXCHANGE_NAVIGATOR: 'MainExchangeNavigator',
  MAIN_EXCHANGE_SCREEN: 'MainExchangeScreen',
  MAIN_NATIVE_BOTTOM_SHEET_NAVIGATOR: 'MainNativeBottomSheetNavigation',
  MAIN_NAVIGATOR: 'MainNavigator',
  MAIN_NAVIGATOR_WRAPPER: 'MainNavigatorWrapper',
  MODAL_SCREEN: 'ModalScreen',
  NATIVE_STACK: 'NativeStack',
  NETWORK_SWITCHER: 'NetworkSection',
  PIN_AUTHENTICATION_SCREEN: 'PinAuthenticationScreen',
  PROFILE_PREVIEW_SHEET: 'ProfilePreviewSheet',
  PROFILE_SCREEN: 'ProfileScreen',
  PROFILE_SHEET: 'ProfileSheet',
  QR_SCANNER_SCREEN: 'QRScannerScreen',
  RECEIVE_MODAL: 'ReceiveModal',
  REGISTER_ENS_NAVIGATOR: 'RegisterEnsNavigator',
  RESTORE_SHEET: 'RestoreSheet',
  SAVINGS_DEPOSIT_MODAL: 'SavingsDepositModal',
  SAVINGS_SHEET: 'SavingsSheet',
  SAVINGS_WITHDRAW_MODAL: 'SavingsWithdrawModal',
  SELECT_ENS_SHEET: 'SelectENSSheet',
  SELECT_UNIQUE_TOKEN_SHEET: 'SelectUniqueTokenSheet',
  SEND_CONFIRMATION_SHEET: 'SendConfirmationSheet',
  SEND_SHEET: 'SendSheet',
  SEND_SHEET_NAVIGATOR: 'SendSheetNavigator',
  SETTINGS_SHEET: 'SettingsSheet',
  SHOWCASE_SHEET: 'ShowcaseSheet',
  SPEED_UP_AND_CANCEL_BOTTOM_SHEET: 'SpeedUpAndCancelBootomSheet',
  SPEED_UP_AND_CANCEL_SHEET: 'SpeedUpAndCancelSheet',
  STACK: 'Stack',
  SUPPORTED_COUNTRIES_MODAL_SCREEN: 'SupportedCountriesModalScreen',
  SWAP_DETAILS_SHEET: 'SwapDetailsSheet',
  SWAP_SETTINGS_SHEET: 'SwapSettingsSheet',
  SWAPS_PROMO_SHEET: 'SwapsPromoSheet',
  SWIPE_LAYOUT: 'SwipeLayout',
  TOKEN_INDEX_SCREEN: 'TokenIndexScreen',
  TOKEN_INDEX_SHEET: 'TokenIndexSheet',
  WALLET_CONNECT_APPROVAL_SHEET: 'WalletConnectApprovalSheet',
  WALLET_CONNECT_REDIRECT_SHEET: 'WalletConnectRedirectSheet',
  WALLET_DIAGNOSTICS_SHEET: 'WalletDiagnosticsSheet',
  WALLET_NOTIFICATIONS_SETTINGS: 'WalletNotificationsSettings',
  WALLET_SCREEN: 'WalletScreen',
  WELCOME_SCREEN: 'WelcomeScreen',
  WYRE_WEBVIEW: 'WyreWebview',
  WYRE_WEBVIEW_NAVIGATOR: 'WyreWebviewNavigator',
};

export const NATIVE_ROUTES = [
  Routes.RECEIVE_MODAL,
  Routes.SETTINGS_SHEET,
  Routes.EXCHANGE_MODAL,
  Routes.EXPANDED_ASSET_SHEET,
  Routes.TOKEN_INDEX_SHEET,
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
  SEND_FLOW:
    isNativeStackAvailable || android
      ? Routes.SEND_SHEET_NAVIGATOR
      : Routes.SEND_SHEET,
};

export default RoutesWithNativeStackAvailability;
