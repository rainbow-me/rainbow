import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { omit } from 'lodash';
import React, { useContext } from 'react';
import { StatusBar } from 'react-native';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../context/ThemeContext' was resolved to '... Remove this comment to see the full error message
import { useTheme } from '../context/ThemeContext';
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
import ShowcaseScreen from '../screens/ShowcaseSheet';
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
// @ts-expect-error ts-migrate(6142) FIXME: Module './SwipeNavigator' was resolved to '/Users/... Remove this comment to see the full error message
import { SwipeNavigator } from './SwipeNavigator';
import {
  addTokenSheetConfig,
  backupSheetConfig,
  basicSheetConfig,
  customGasSheetConfig,
  defaultScreenStackOptions,
  expandedAssetSheetConfig,
  expandedAssetSheetConfigWithLimit,
  explainSheetConfig,
  nativeStackDefaultConfig,
  nativeStackDefaultConfigWithoutStatusBar,
  restoreSheetConfig,
  sendConfirmationSheetConfig,
  stackNavigationConfig,
  // @ts-expect-error ts-migrate(6142) FIXME: Module './config' was resolved to '/Users/nickbyte... Remove this comment to see the full error message
} from './config';
import {
  emojiPreset,
  exchangePreset,
  overlayExpandedPreset,
  sheetPreset,
  // @ts-expect-error ts-migrate(6142) FIXME: Module './effects' was resolved to '/Users/nickbyt... Remove this comment to see the full error message
} from './effects';
import { nativeStackConfig } from './nativeStackConfig';
import { onNavigationStateChange } from './onNavigationStateChange';
import Routes from './routesNames';
import { ExchangeModalNavigator } from './index';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/isNativeSt... Remove this comment to see the full error message
import isNativeStackAvailable from '@rainbow-me/helpers/isNativeStackAvailable';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'react-native-cool-modals/creat... Remove this comment to see the full error message
import createNativeStackNavigator from 'react-native-cool-modals/createNativeStackNavigator';

const Stack = createStackNavigator();
const NativeStack = createNativeStackNavigator();

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
        component={ModalScreen}
        name={Routes.MODAL_SCREEN}
        options={overlayExpandedPreset}
      />
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
      />
    </Stack.Navigator>
  );
}

function AddCashFlowNavigator() {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Stack.Navigator
      {...stackNavigationConfig}
      initialRouteName={Routes.ADD_CASH_SCREEN_NAVIGATOR}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Stack.Screen
        component={ModalScreen}
        name={Routes.SUPPORTED_COUNTRIES_MODAL_SCREEN}
        options={overlayExpandedPreset}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Stack.Screen
        component={AddCashSheet}
        name={Routes.ADD_CASH_SCREEN_NAVIGATOR}
      />
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
        component={WelcomeScreen}
        name={Routes.WELCOME_SCREEN}
        options={{ animationEnabled: false, gestureEnabled: false }}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Stack.Screen
        component={AvatarBuilder}
        name={Routes.AVATAR_BUILDER}
        options={emojiPreset}
      />
    </Stack.Navigator>
  );
}

function MainNavigatorWrapper() {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Stack.Navigator
      initialRouteName={Routes.MAIN_NAVIGATOR_WRAPPER}
      {...stackNavigationConfig}
      screenOptions={defaultScreenStackOptions}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Stack.Screen
        component={MainNavigator}
        name={Routes.MAIN_NAVIGATOR_WRAPPER}
      />
    </Stack.Navigator>
  );
}

function NativeStackFallbackNavigator() {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Stack.Navigator
      initialRouteName={Routes.MAIN_NAVIGATOR}
      {...stackNavigationConfig}
      screenOptions={defaultScreenStackOptions}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Stack.Screen component={MainNavigator} name={Routes.MAIN_NAVIGATOR} />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Stack.Screen
        component={ImportSeedPhraseSheet}
        name={Routes.IMPORT_SEED_PHRASE_SHEET}
        options={{
          ...sheetPreset,
          onTransitionStart: () => {
            StatusBar.setBarStyle('light-content');
          },
        }}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Stack.Screen
        component={AddCashSheet}
        name={Routes.ADD_CASH_SHEET}
        options={sheetPreset}
      />
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
        component={SendSheet}
        name={Routes.SEND_SHEET}
        options={{
          ...omit(sheetPreset, 'gestureResponseDistance'),
          // @ts-expect-error ts-migrate(2322) FIXME: Type '{ onTransitionStart: () => void; }' is not a... Remove this comment to see the full error message
          onTransitionStart: () => {
            StatusBar.setBarStyle('light-content');
          },
        }}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Stack.Screen
        component={ModalScreen}
        name={Routes.SUPPORTED_COUNTRIES_MODAL_SCREEN}
        options={overlayExpandedPreset}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Stack.Screen
        component={ExchangeModalNavigator}
        name={Routes.EXCHANGE_MODAL}
        options={exchangePreset}
      />
    </Stack.Navigator>
  );
}

const MainStack = isNativeStackAvailable
  ? MainNavigatorWrapper
  : NativeStackFallbackNavigator;

function NativeStackNavigator() {
  const { colors, isDarkMode } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <NativeStack.Navigator {...nativeStackConfig}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <NativeStack.Screen component={MainStack} name={Routes.STACK} />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <NativeStack.Screen
        component={ReceiveModal}
        name={Routes.RECEIVE_MODAL}
        options={{
          backgroundColor: isDarkMode ? colors.offWhite : '#3B3E43',
          backgroundOpacity: 1,
          customStack: true,
        }}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <NativeStack.Screen
        component={SettingsModal}
        name={Routes.SETTINGS_MODAL}
        options={{
          backgroundColor: '#25292E',
          backgroundOpacity: 0.7,
          cornerRadius: 0,
          customStack: true,
          ignoreBottomOffset: true,
          topOffset: 0,
        }}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <NativeStack.Screen
        component={ExchangeModalNavigator}
        name={Routes.EXCHANGE_MODAL}
        options={{ ...nativeStackDefaultConfig, interactWithScrollView: false }}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <NativeStack.Screen
        component={ExpandedAssetSheet}
        name={Routes.EXPANDED_ASSET_SHEET}
        {...expandedAssetSheetConfigWithLimit}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <NativeStack.Screen
        component={ShowcaseScreen}
        name={Routes.SHOWCASE_SHEET}
        options={{
          customStack: true,
        }}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <NativeStack.Screen
        component={ExpandedAssetSheet}
        name={Routes.EXPANDED_ASSET_SHEET_POOLS}
        {...expandedAssetSheetConfigWithLimit}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <NativeStack.Screen
        component={ExpandedAssetSheet}
        name={Routes.TOKEN_INDEX_SHEET}
        {...expandedAssetSheetConfigWithLimit}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <NativeStack.Screen
        component={SpeedUpAndCancelSheet}
        name={Routes.SPEED_UP_AND_CANCEL_SHEET}
        options={{
          allowsDragToDismiss: true,
          backgroundColor: '#25292E',
          backgroundOpacity: 0.6,
          customStack: true,
          headerHeight: 0,
          isShortFormEnabled: false,
          topOffset: 0,
        }}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Stack.Screen
        component={SendConfirmationSheet}
        name={Routes.SEND_CONFIRMATION_SHEET}
        {...sendConfirmationSheetConfig}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <NativeStack.Screen
        component={AddTokenSheet}
        name={Routes.ADD_TOKEN_SHEET}
        {...addTokenSheetConfig}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <NativeStack.Screen
        component={ExplainSheet}
        name={Routes.EXPLAIN_SHEET}
        {...explainSheetConfig}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <NativeStack.Screen
        component={WalletDiagnosticsSheet}
        name={Routes.WALLET_DIAGNOSTICS_SHEET}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <NativeStack.Screen
        component={ChangeWalletSheet}
        name={Routes.CHANGE_WALLET_SHEET}
        options={{
          allowsDragToDismiss: true,
          backgroundColor: '#25292E',
          backgroundOpacity: 0.7,
          customStack: true,
          springDamping: 1,
          transitionDuration: 0.25,
        }}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <NativeStack.Screen
        component={ConnectedDappsSheet}
        name={Routes.CONNECTED_DAPPS}
        options={{
          allowsDragToDismiss: true,
          backgroundColor: '#25292E',
          backgroundOpacity: 0.7,
          customStack: true,
          springDamping: 1,
          transitionDuration: 0.25,
        }}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <NativeStack.Screen
        component={BackupSheet}
        name={Routes.BACKUP_SHEET}
        {...backupSheetConfig}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <NativeStack.Screen
        component={ModalScreen}
        name={Routes.MODAL_SCREEN}
        options={{
          customStack: true,
          ignoreBottomOffset: true,
          onAppear: null,
          topOffset: 0,
        }}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <NativeStack.Screen
        component={RestoreSheet}
        name={Routes.RESTORE_SHEET}
        {...restoreSheetConfig}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <NativeStack.Screen
        component={SavingsSheet}
        name={Routes.SAVINGS_SHEET}
        {...basicSheetConfig}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <NativeStack.Screen
        component={TransactionConfirmationScreen}
        name={Routes.CONFIRM_REQUEST}
        options={{
          allowsDragToDismiss: true,
          backgroundColor: '#0A0A0A',
          backgroundOpacity: 1,
          customStack: true,
          headerHeight: 0,
          isShortFormEnabled: false,
          topOffset: 0,
        }}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <NativeStack.Screen
        component={ExpandedAssetSheet}
        name={Routes.CUSTOM_GAS_SHEET}
        {...customGasSheetConfig}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <NativeStack.Screen
        component={WithdrawModal}
        name={Routes.SAVINGS_WITHDRAW_MODAL}
        options={nativeStackDefaultConfigWithoutStatusBar}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <NativeStack.Screen
        component={DepositModal}
        name={Routes.SAVINGS_DEPOSIT_MODAL}
        options={nativeStackDefaultConfigWithoutStatusBar}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <NativeStack.Screen
        component={ExpandedAssetSheet}
        name={Routes.SWAP_DETAILS_SHEET}
        {...expandedAssetSheetConfig}
      />
      {isNativeStackAvailable ? (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <NativeStack.Screen
            component={SendFlowNavigator}
            name={Routes.SEND_SHEET_NAVIGATOR}
          />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <NativeStack.Screen
            component={ImportSeedPhraseFlowNavigator}
            name={Routes.IMPORT_SEED_PHRASE_SHEET_NAVIGATOR}
          />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <NativeStack.Screen
            component={AddCashFlowNavigator}
            name={Routes.ADD_CASH_SCREEN_NAVIGATOR}
          />
        </>
      ) : (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <NativeStack.Screen
          component={ImportSeedPhraseFlowNavigator}
          name={Routes.IMPORT_SEED_PHRASE_SHEET_NAVIGATOR}
          options={{ customStack: true }}
        />
      )}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <NativeStack.Screen
        component={WalletConnectApprovalSheet}
        name={Routes.WALLET_CONNECT_APPROVAL_SHEET}
        {...basicSheetConfig}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <NativeStack.Screen
        component={WalletConnectRedirectSheet}
        name={Routes.WALLET_CONNECT_REDIRECT_SHEET}
        {...basicSheetConfig}
      />
    </NativeStack.Navigator>
  );
}

const AppContainerWithAnalytics = React.forwardRef((props, ref) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <NavigationContainer onStateChange={onNavigationStateChange} ref={ref}>
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <NativeStackNavigator />
  </NavigationContainer>
));

AppContainerWithAnalytics.displayName = 'AppContainerWithAnalytics';

export default React.memo(AppContainerWithAnalytics);
