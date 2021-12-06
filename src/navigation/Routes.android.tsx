import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useContext, useMemo } from 'react';
import { InitialRouteContext } from '../context/initialRoute';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../screens/AddCashSheet' was resolved to '... Remove this comment to see the full error message
import AddCashSheet from '../screens/AddCashSheet';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../screens/AddTokenSheet' was resolved to ... Remove this comment to see the full error message
import AddTokenSheet from '../screens/AddTokenSheet';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../screens/AvatarBuilder' was resolved to ... Remove this comment to see the full error message
import AvatarBuilder from '../screens/AvatarBuilder';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../screens/BackupSheet' was resolved to '/... Remove this comment to see the full error message
import BackupSheet from '../screens/BackupSheet';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../screens/ChangeWalletSheet' was resolved... Remove this comment to see the full error message
import ChangeWalletSheet from '../screens/ChangeWalletSheet';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../screens/ConnectedDappsSheet' was resolv... Remove this comment to see the full error message
import ConnectedDappsSheet from '../screens/ConnectedDappsSheet';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../screens/DepositModal' was resolved to '... Remove this comment to see the full error message
import DepositModal from '../screens/DepositModal';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../screens/ExpandedAssetSheet' was resolve... Remove this comment to see the full error message
import ExpandedAssetSheet from '../screens/ExpandedAssetSheet';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../screens/ExplainSheet' was resolved to '... Remove this comment to see the full error message
import ExplainSheet from '../screens/ExplainSheet';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../screens/ImportSeedPhraseSheet' was reso... Remove this comment to see the full error message
import ImportSeedPhraseSheet from '../screens/ImportSeedPhraseSheet';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../screens/ModalScreen' was resolved to '/... Remove this comment to see the full error message
import ModalScreen from '../screens/ModalScreen';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../screens/PinAuthenticationScreen' was re... Remove this comment to see the full error message
import PinAuthenticationScreen from '../screens/PinAuthenticationScreen';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../screens/ReceiveModal' was resolved to '... Remove this comment to see the full error message
import ReceiveModal from '../screens/ReceiveModal';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../screens/RestoreSheet' was resolved to '... Remove this comment to see the full error message
import RestoreSheet from '../screens/RestoreSheet';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../screens/SavingsSheet' was resolved to '... Remove this comment to see the full error message
import SavingsSheet from '../screens/SavingsSheet';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../screens/SendConfirmationSheet' was reso... Remove this comment to see the full error message
import SendConfirmationSheet from '../screens/SendConfirmationSheet';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../screens/SendSheet' was resolved to '/Us... Remove this comment to see the full error message
import SendSheet from '../screens/SendSheet';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../screens/SettingsModal' was resolved to ... Remove this comment to see the full error message
import SettingsModal from '../screens/SettingsModal';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../screens/ShowcaseSheet' was resolved to ... Remove this comment to see the full error message
import ShowcaseSheet from '../screens/ShowcaseSheet';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../screens/SpeedUpAndCancelSheet' was reso... Remove this comment to see the full error message
import SpeedUpAndCancelSheet from '../screens/SpeedUpAndCancelSheet';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../screens/TransactionConfirmationScreen' ... Remove this comment to see the full error message
import TransactionConfirmationScreen from '../screens/TransactionConfirmationScreen';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../screens/WalletConnectApprovalSheet' was... Remove this comment to see the full error message
import WalletConnectApprovalSheet from '../screens/WalletConnectApprovalSheet';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../screens/WalletConnectRedirectSheet' was... Remove this comment to see the full error message
import WalletConnectRedirectSheet from '../screens/WalletConnectRedirectSheet';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../screens/WalletDiagnosticsSheet' was res... Remove this comment to see the full error message
import WalletDiagnosticsSheet from '../screens/WalletDiagnosticsSheet';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../screens/WelcomeScreen' was resolved to ... Remove this comment to see the full error message
import WelcomeScreen from '../screens/WelcomeScreen';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../screens/WithdrawModal' was resolved to ... Remove this comment to see the full error message
import WithdrawModal from '../screens/WithdrawModal';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../screens/WyreWebview' was resolved to '/... Remove this comment to see the full error message
import WyreWebview from '../screens/WyreWebview';
// @ts-expect-error ts-migrate(6142) FIXME: Module './SwipeNavigator' was resolved to '/Users/... Remove this comment to see the full error message
import { SwipeNavigator } from './SwipeNavigator';
import { createBottomSheetNavigator } from './bottom-sheet';
import {
  addTokenSheetConfig,
  closeKeyboardOnClose,
  defaultScreenStackOptions,
  restoreSheetConfig,
  stackNavigationConfig,
  wyreWebviewOptions,
  // @ts-expect-error ts-migrate(6142) FIXME: Module './config' was resolved to '/Users/nickbyte... Remove this comment to see the full error message
} from './config';
import {
  androidRecievePreset,
  bottomSheetPreset,
  emojiPreset,
  exchangePreset,
  expandedPreset,
  expandedPresetWithSmallGestureResponseDistance,
  overlayExpandedPreset,
  sheetPreset,
  sheetPresetWithSmallGestureResponseDistance,
  speedUpAndCancelStyleInterpolator,
  wcPromptPreset,
  // @ts-expect-error ts-migrate(6142) FIXME: Module './effects' was resolved to '/Users/nickbyt... Remove this comment to see the full error message
} from './effects';
import { onNavigationStateChange } from './onNavigationStateChange';
import Routes from './routesNames';
import { ExchangeModalNavigator } from './index';

const Stack = createStackNavigator();
const OuterStack = createStackNavigator();
const BSStack = createBottomSheetNavigator();

function SendFlowNavigator() {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Stack.Navigator
      {...stackNavigationConfig}
      initialRouteName={Routes.SEND_SHEET}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Stack.Screen
        component={SendSheet}
        name={Routes.SEND_SHEET}
        options={sheetPreset}
      />
    </Stack.Navigator>
  );
}

function ImportSeedPhraseFlowNavigator() {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Stack.Navigator
      {...stackNavigationConfig}
      initialRouteName={Routes.IMPORT_SEED_PHRASE_SHEET}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Stack.Screen
        component={ModalScreen}
        name={Routes.MODAL_SCREEN}
        options={overlayExpandedPreset}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Stack.Screen
        component={ImportSeedPhraseSheet}
        name={Routes.IMPORT_SEED_PHRASE_SHEET}
        options={sheetPreset}
      />
    </Stack.Navigator>
  );
}

function AddCashFlowNavigator() {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  const themedWyreWebviewOptions = useMemo(() => wyreWebviewOptions(colors), [
    colors,
  ]);
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Stack.Navigator
      initialRouteName={Routes.WYRE_WEBVIEW}
      screenOptions={themedWyreWebviewOptions}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Stack.Screen component={WyreWebview} name={Routes.WYRE_WEBVIEW} />
    </Stack.Navigator>
  );
}

function MainNavigator() {
  const initialRoute = useContext(InitialRouteContext);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Stack.Navigator
      initialRouteName={initialRoute}
      {...stackNavigationConfig}
      screenOptions={defaultScreenStackOptions}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Stack.Screen component={SwipeNavigator} name={Routes.SWIPE_LAYOUT} />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Stack.Screen
        component={AvatarBuilder}
        name={Routes.AVATAR_BUILDER}
        options={emojiPreset}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Stack.Screen
        component={ChangeWalletSheet}
        name={Routes.CHANGE_WALLET_SHEET}
        options={expandedPreset}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Stack.Screen
        component={ConnectedDappsSheet}
        name={Routes.CONNECTED_DAPPS}
        options={expandedPreset}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Stack.Screen
        component={TransactionConfirmationScreen}
        name={Routes.CONFIRM_REQUEST}
        options={exchangePreset}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Stack.Screen
        component={SpeedUpAndCancelSheet}
        name={Routes.SPEED_UP_AND_CANCEL_SHEET}
        options={{
          ...exchangePreset,
          cardStyleInterpolator: speedUpAndCancelStyleInterpolator,
        }}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Stack.Screen
        component={ExchangeModalNavigator}
        name={Routes.EXCHANGE_MODAL}
        options={exchangePreset}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Stack.Screen
        component={ReceiveModal}
        name={Routes.RECEIVE_MODAL}
        options={androidRecievePreset}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Stack.Screen
        component={WalletConnectApprovalSheet}
        name={Routes.WALLET_CONNECT_APPROVAL_SHEET}
        options={wcPromptPreset}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Stack.Screen
        component={WalletConnectRedirectSheet}
        name={Routes.WALLET_CONNECT_REDIRECT_SHEET}
        options={wcPromptPreset}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Stack.Screen
        component={AddCashSheet}
        name={Routes.ADD_CASH_SHEET}
        options={addTokenSheetConfig}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Stack.Screen
        component={ImportSeedPhraseSheet}
        name={Routes.IMPORT_SEED_PHRASE_SHEET}
        options={sheetPreset}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Stack.Screen
        component={AddTokenSheet}
        name={Routes.ADD_TOKEN_SHEET}
        options={bottomSheetPreset}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Stack.Screen
        component={WithdrawModal}
        name={Routes.SAVINGS_WITHDRAW_MODAL}
        options={exchangePreset}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Stack.Screen
        component={DepositModal}
        name={Routes.SAVINGS_DEPOSIT_MODAL}
        options={exchangePreset}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Stack.Screen
        component={BackupSheet}
        name={Routes.BACKUP_SHEET}
        options={expandedPreset}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Stack.Screen
        component={RestoreSheet}
        name={Routes.RESTORE_SHEET}
        {...restoreSheetConfig}
        options={bottomSheetPreset}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Stack.Screen
        component={ImportSeedPhraseFlowNavigator}
        name={Routes.IMPORT_SEED_PHRASE_SHEET_NAVIGATOR}
        options={sheetPresetWithSmallGestureResponseDistance}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Stack.Screen
        component={WelcomeScreen}
        name={Routes.WELCOME_SCREEN}
        options={{ animationEnabled: false, gestureEnabled: false }}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Stack.Screen
        component={AddCashFlowNavigator}
        name={Routes.WYRE_WEBVIEW_NAVIGATOR}
      />
    </Stack.Navigator>
  );
}

// FIXME do it in one navigator
function MainOuterNavigator() {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <OuterStack.Navigator
      initialRouteName={Routes.MAIN_NAVIGATOR}
      {...stackNavigationConfig}
      screenOptions={defaultScreenStackOptions}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <OuterStack.Screen
        component={MainNavigator}
        name={Routes.MAIN_NAVIGATOR}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <OuterStack.Screen
        component={ExpandedAssetSheet}
        name={Routes.TOKEN_INDEX_SCREEN}
        options={expandedPresetWithSmallGestureResponseDistance}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <OuterStack.Screen
        component={PinAuthenticationScreen}
        name={Routes.PIN_AUTHENTICATION_SCREEN}
        options={{ ...sheetPreset, gestureEnabled: false }}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <OuterStack.Screen
        component={BackupSheet}
        name={Routes.BACKUP_SCREEN}
        options={expandedPreset}
      />
    </OuterStack.Navigator>
  );
}

function BSNavigator() {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <BSStack.Navigator>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <BSStack.Screen
        component={MainOuterNavigator}
        name={Routes.MAIN_NAVIGATOR_WRAPPER}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <BSStack.Screen
        component={SendFlowNavigator}
        name={Routes.SEND_SHEET_NAVIGATOR}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <BSStack.Screen
        component={ExpandedAssetSheet}
        name={Routes.TOKEN_INDEX_SHEET}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <BSStack.Screen
        component={ShowcaseSheet}
        name={Routes.SHOWCASE_SHEET}
        options={{
          height: '90%',
        }}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <BSStack.Screen
        component={ExpandedAssetSheet}
        name={Routes.EXPANDED_ASSET_SHEET}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <BSStack.Screen
        component={ExpandedAssetSheet}
        name={Routes.EXPANDED_ASSET_SHEET_POOLS}
        options={expandedPresetWithSmallGestureResponseDistance}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <BSStack.Screen
        component={ExplainSheet}
        name={Routes.EXPLAIN_SHEET}
        options={bottomSheetPreset}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <BSStack.Screen
        component={ModalScreen}
        {...closeKeyboardOnClose}
        name={Routes.MODAL_SCREEN}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <BSStack.Screen
        component={SendConfirmationSheet}
        name={Routes.SEND_CONFIRMATION_SHEET}
        options={sheetPreset}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <BSStack.Screen
        component={ExpandedAssetSheet}
        name={Routes.CUSTOM_GAS_SHEET}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <BSStack.Screen
        component={WalletDiagnosticsSheet}
        name={Routes.WALLET_DIAGNOSTICS_SHEET}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <BSStack.Screen component={SavingsSheet} name={Routes.SAVINGS_SHEET} />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <BSStack.Screen component={SettingsModal} name={Routes.SETTINGS_MODAL} />
    </BSStack.Navigator>
  );
}

const AppContainerWithAnalytics = React.forwardRef((props, ref) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <NavigationContainer onStateChange={onNavigationStateChange} ref={ref}>
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <BSNavigator />
  </NavigationContainer>
));

AppContainerWithAnalytics.displayName = 'AppContainerWithAnalytics';

export default React.memo(AppContainerWithAnalytics);
