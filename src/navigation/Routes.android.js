import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useContext, useMemo } from 'react';
import AddCashSheet from '../screens/AddCashSheet';
import AddTokenSheet from '../screens/AddTokenSheet';
import AvatarBuilder from '../screens/AvatarBuilder';
import BackupSheet from '../screens/BackupSheet';
import ChangeWalletSheet from '../screens/ChangeWalletSheet';
import ConnectedDappsSheet from '../screens/ConnectedDappsSheet';
import DepositModal from '../screens/DepositModal';
import ENSAdditionalRecordsSheet from '../screens/ENSAdditionalRecordsSheet';
import ENSConfirmRegisterSheet from '../screens/ENSConfirmRegisterSheet';
import ExpandedAssetSheet from '../screens/ExpandedAssetSheet';
import ExplainSheet from '../screens/ExplainSheet';
import ExternalLinkWarningSheet from '../screens/ExternalLinkWarningSheet';
import ImportSeedPhraseSheet from '../screens/ImportSeedPhraseSheet';
import ModalScreen from '../screens/ModalScreen';
import PinAuthenticationScreen from '../screens/PinAuthenticationScreen';
import ProfileSheet from '../screens/ProfileSheet';
import ReceiveModal from '../screens/ReceiveModal';
import RestoreSheet from '../screens/RestoreSheet';
import SavingsSheet from '../screens/SavingsSheet';
import SelectENSSheet from '../screens/SelectENSSheet';
import SelectUniqueTokenSheet from '../screens/SelectUniqueTokenSheet';
import SendConfirmationSheet from '../screens/SendConfirmationSheet';
import SendSheet from '../screens/SendSheet';
import SettingsSheet from '../screens/SettingsSheet';
import ShowcaseSheet from '../screens/ShowcaseSheet';
import SpeedUpAndCancelSheet from '../screens/SpeedUpAndCancelSheet';
import SwapsPromoSheet from '../screens/SwapsPromoSheet';
import TransactionConfirmationScreen from '../screens/TransactionConfirmationScreen';
import WalletConnectApprovalSheet from '../screens/WalletConnectApprovalSheet';
import WalletConnectRedirectSheet from '../screens/WalletConnectRedirectSheet';
import WalletDiagnosticsSheet from '../screens/WalletDiagnosticsSheet';
import WelcomeScreen from '../screens/WelcomeScreen';
import WithdrawModal from '../screens/WithdrawModal';
import WyreWebview from '../screens/WyreWebview';
import RegisterENSNavigator from './RegisterENSNavigator';
import { SwipeNavigator } from './SwipeNavigator';
import { createBottomSheetNavigator } from './bottom-sheet';
import {
  addTokenSheetConfig,
  closeKeyboardOnClose,
  defaultScreenStackOptions,
  restoreSheetConfig,
  stackNavigationConfig,
  wyreWebviewOptions,
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
} from './effects';
import { InitialRouteContext } from './initialRoute';
import { onNavigationStateChange } from './onNavigationStateChange';
import Routes from './routesNames';
import { ExchangeModalNavigator } from './index';
import useExperimentalFlag, { PROFILES } from '@/config/experimentalHooks';

const Stack = createStackNavigator();
const OuterStack = createStackNavigator();
const AuthStack = createStackNavigator();
const BSStack = createBottomSheetNavigator();

function ImportSeedPhraseFlowNavigator() {
  return (
    <Stack.Navigator
      {...stackNavigationConfig}
      initialRouteName={Routes.IMPORT_SEED_PHRASE_SHEET}
    >
      <Stack.Screen
        component={ModalScreen}
        name={Routes.MODAL_SCREEN}
        options={overlayExpandedPreset}
      />
      <Stack.Screen
        component={ImportSeedPhraseSheet}
        name={Routes.IMPORT_SEED_PHRASE_SHEET}
        options={sheetPreset}
      />
    </Stack.Navigator>
  );
}

function AddCashFlowNavigator() {
  const { colors } = useTheme();
  const themedWyreWebviewOptions = useMemo(() => wyreWebviewOptions(colors), [
    colors,
  ]);
  return (
    <Stack.Navigator
      initialRouteName={Routes.WYRE_WEBVIEW}
      screenOptions={themedWyreWebviewOptions}
    >
      <Stack.Screen component={WyreWebview} name={Routes.WYRE_WEBVIEW} />
    </Stack.Navigator>
  );
}

function MainNavigator() {
  const initialRoute = useContext(InitialRouteContext);
  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      {...stackNavigationConfig}
      screenOptions={defaultScreenStackOptions}
    >
      <Stack.Screen component={SwipeNavigator} name={Routes.SWIPE_LAYOUT} />
      <Stack.Screen
        component={AvatarBuilder}
        name={Routes.AVATAR_BUILDER}
        options={emojiPreset}
      />
      <Stack.Screen
        component={ChangeWalletSheet}
        name={Routes.CHANGE_WALLET_SHEET}
        options={expandedPreset}
      />
      <Stack.Screen
        component={ConnectedDappsSheet}
        name={Routes.CONNECTED_DAPPS}
        options={expandedPreset}
      />
      <Stack.Screen
        component={TransactionConfirmationScreen}
        name={Routes.CONFIRM_REQUEST}
        options={exchangePreset}
      />

      <Stack.Screen
        component={SpeedUpAndCancelSheet}
        name={Routes.SPEED_UP_AND_CANCEL_SHEET}
        options={{
          ...exchangePreset,
          cardStyleInterpolator: speedUpAndCancelStyleInterpolator,
        }}
      />
      <Stack.Screen
        component={ExchangeModalNavigator}
        name={Routes.EXCHANGE_MODAL}
        options={exchangePreset}
      />
      <Stack.Screen
        component={ReceiveModal}
        name={Routes.RECEIVE_MODAL}
        options={androidRecievePreset}
      />
      <Stack.Screen
        component={WalletConnectApprovalSheet}
        name={Routes.WALLET_CONNECT_APPROVAL_SHEET}
        options={wcPromptPreset}
      />
      <Stack.Screen
        component={WalletConnectRedirectSheet}
        name={Routes.WALLET_CONNECT_REDIRECT_SHEET}
        options={wcPromptPreset}
      />
      <Stack.Screen
        component={AddCashSheet}
        name={Routes.ADD_CASH_SHEET}
        options={addTokenSheetConfig}
      />
      <Stack.Screen
        component={ImportSeedPhraseSheet}
        name={Routes.IMPORT_SEED_PHRASE_SHEET}
        options={sheetPreset}
      />
      <Stack.Screen
        component={AddTokenSheet}
        name={Routes.ADD_TOKEN_SHEET}
        options={bottomSheetPreset}
      />
      <Stack.Screen
        component={WithdrawModal}
        name={Routes.SAVINGS_WITHDRAW_MODAL}
        options={exchangePreset}
      />
      <Stack.Screen
        component={DepositModal}
        name={Routes.SAVINGS_DEPOSIT_MODAL}
        options={exchangePreset}
      />
      <Stack.Screen
        component={BackupSheet}
        name={Routes.BACKUP_SHEET}
        options={expandedPreset}
      />
      <Stack.Screen
        component={RestoreSheet}
        name={Routes.RESTORE_SHEET}
        {...restoreSheetConfig}
        options={bottomSheetPreset}
      />
      <Stack.Screen
        component={ImportSeedPhraseFlowNavigator}
        name={Routes.IMPORT_SEED_PHRASE_SHEET_NAVIGATOR}
        options={sheetPresetWithSmallGestureResponseDistance}
      />
      <Stack.Screen
        component={WelcomeScreen}
        name={Routes.WELCOME_SCREEN}
        options={{ animationEnabled: false, gestureEnabled: false }}
      />
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
    <OuterStack.Navigator
      initialRouteName={Routes.MAIN_NAVIGATOR}
      {...stackNavigationConfig}
      screenOptions={defaultScreenStackOptions}
    >
      <OuterStack.Screen
        component={MainNavigator}
        name={Routes.MAIN_NAVIGATOR}
      />
      <OuterStack.Screen
        component={ExpandedAssetSheet}
        name={Routes.TOKEN_INDEX_SCREEN}
        options={expandedPresetWithSmallGestureResponseDistance}
      />
      <OuterStack.Screen
        component={BackupSheet}
        name={Routes.BACKUP_SCREEN}
        options={expandedPreset}
      />
      <OuterStack.Screen
        component={SendSheet}
        name={Routes.SEND_SHEET_NAVIGATOR}
        options={expandedPresetWithSmallGestureResponseDistance}
      />
    </OuterStack.Navigator>
  );
}

function BSNavigator() {
  const profilesEnabled = useExperimentalFlag(PROFILES);

  return (
    <BSStack.Navigator>
      <BSStack.Screen
        component={MainOuterNavigator}
        name={Routes.MAIN_NAVIGATOR_WRAPPER}
      />
      <BSStack.Screen
        component={ExpandedAssetSheet}
        name={Routes.TOKEN_INDEX_SHEET}
      />
      <BSStack.Screen
        component={ShowcaseSheet}
        name={Routes.SHOWCASE_SHEET}
        options={{
          height: '95%',
        }}
      />
      <BSStack.Screen
        component={ExpandedAssetSheet}
        name={Routes.EXPANDED_ASSET_SHEET}
      />
      <BSStack.Screen
        component={ExpandedAssetSheet}
        name={Routes.EXPANDED_ASSET_SHEET_POOLS}
        options={expandedPresetWithSmallGestureResponseDistance}
      />
      {profilesEnabled && (
        <>
          <BSStack.Screen
            component={ENSConfirmRegisterSheet}
            name={Routes.ENS_CONFIRM_REGISTER_SHEET}
          />
          <BSStack.Screen
            component={ProfileSheet}
            name={Routes.PROFILE_SHEET}
          />
          <BSStack.Screen
            component={RegisterENSNavigator}
            name={Routes.REGISTER_ENS_NAVIGATOR}
          />
          <BSStack.Screen
            component={ENSAdditionalRecordsSheet}
            name={Routes.ENS_ADDITIONAL_RECORDS_SHEET}
          />
          <BSStack.Screen
            component={SelectENSSheet}
            name={Routes.SELECT_ENS_SHEET}
          />
          <BSStack.Screen
            component={ProfileSheet}
            name={Routes.PROFILE_PREVIEW_SHEET}
          />
          <BSStack.Screen
            component={SelectUniqueTokenSheet}
            name={Routes.SELECT_UNIQUE_TOKEN_SHEET}
            options={{ ...bottomSheetPreset, height: '95%' }}
          />
          <BSStack.Screen
            component={SpeedUpAndCancelSheet}
            name={Routes.SPEED_UP_AND_CANCEL_BOTTOM_SHEET}
          />
        </>
      )}
      <BSStack.Screen
        component={SwapsPromoSheet}
        name={Routes.SWAPS_PROMO_SHEET}
        options={bottomSheetPreset}
      />
      <BSStack.Screen
        component={ExplainSheet}
        name={Routes.EXPLAIN_SHEET}
        options={bottomSheetPreset}
      />
      <BSStack.Screen
        component={ExternalLinkWarningSheet}
        name={Routes.EXTERNAL_LINK_WARNING_SHEET}
        options={bottomSheetPreset}
      />
      <BSStack.Screen
        component={ModalScreen}
        {...closeKeyboardOnClose}
        name={Routes.MODAL_SCREEN}
      />
      <BSStack.Screen
        component={SendConfirmationSheet}
        name={Routes.SEND_CONFIRMATION_SHEET}
        options={sheetPreset}
      />
      <BSStack.Screen
        component={ExpandedAssetSheet}
        name={Routes.CUSTOM_GAS_SHEET}
        options={{
          backdropOpacity: 1,
        }}
      />
      <BSStack.Screen
        component={WalletDiagnosticsSheet}
        name={Routes.WALLET_DIAGNOSTICS_SHEET}
      />
      <BSStack.Screen component={SavingsSheet} name={Routes.SAVINGS_SHEET} />
      <BSStack.Screen
        component={SettingsSheet}
        name={Routes.SETTINGS_SHEET}
        options={{ ...bottomSheetPreset, height: '97%' }}
      />
    </BSStack.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      {...stackNavigationConfig}
      initialRouteName={Routes.MAIN_NATIVE_BOTTOM_SHEET_NAVIGATOR}
      screenOptions={defaultScreenStackOptions}
    >
      <AuthStack.Screen
        component={BSNavigator}
        name={Routes.MAIN_NATIVE_BOTTOM_SHEET_NAVIGATOR}
      />
      <AuthStack.Screen
        component={PinAuthenticationScreen}
        name={Routes.PIN_AUTHENTICATION_SCREEN}
        options={{ ...sheetPreset, gestureEnabled: false }}
      />
    </AuthStack.Navigator>
  );
}

const AppContainerWithAnalytics = React.forwardRef((props, ref) => (
  <NavigationContainer
    onReady={props.onReady}
    onStateChange={onNavigationStateChange}
    ref={ref}
  >
    <AuthNavigator />
  </NavigationContainer>
));

AppContainerWithAnalytics.displayName = 'AppContainerWithAnalytics';

export default React.memo(AppContainerWithAnalytics);
