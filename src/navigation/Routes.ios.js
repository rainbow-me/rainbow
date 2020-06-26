import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { omit } from 'lodash';
import React from 'react';
import { StatusBar } from 'react-native';
import { createNativeStackNavigator } from 'react-native-cool-modals/native-stack';
import useExperimentalFlag, {
  NEW_ONBOARDING,
} from '../config/experimentalHooks';
import isNativeStackAvailable from '../helpers/isNativeStackAvailable';
import AvatarBuilder from '../screens/AvatarBuilder';
import ChangeWalletSheet from '../screens/ChangeWalletSheet';
import DepositModal from '../screens/DepositModal';
import ImportSeedPhraseSheetWithData from '../screens/ImportSeedPhraseSheetWithData';
import ModalScreen from '../screens/ModalScreen';
import ReceiveModal from '../screens/ReceiveModal';
import SavingsSheet from '../screens/SavingsSheet';
import SendSheet from '../screens/SendSheet';
import SettingsModal from '../screens/SettingsModal';
import TransactionConfirmationScreen from '../screens/TransactionConfirmationScreen';
import WalletConnectApprovalSheet from '../screens/WalletConnectApprovalSheet';
import WalletConnectRedirectSheet from '../screens/WalletConnectRedirectSheet';
import WelcomeScreen from '../screens/WelcomeScreen';
import WithdrawModal from '../screens/WithdrawModal';
import { SwipeNavigator } from './SwipeNavigator';
import {
  defaultScreenStackOptions,
  expandedAssetSheetConfig,
  nativeStackConfig,
  sharedCoolModalConfig,
  stackNavigationConfig,
} from './config';
import {
  bottomSheetPreset,
  emojiPreset,
  exchangePreset,
  expandedPreset,
  overlayExpandedPreset,
  sheetPreset,
} from './effects';
import { onTransitionStart } from './helpers';
import {
  AddCashSheetWrapper,
  ExpandedAssetSheetWrapper,
  ImportSeedPhraseSheetWrapper,
  SendSheetWrapper,
} from './nativeStackHelpers';
import { onNavigationStateChange } from './onNavigationStateChange';
import Routes from './routesNames';
import { ExchangeModalNavigator } from './index';

const Stack = createStackNavigator();
const NativeStack = createNativeStackNavigator();

function SendFlowNavigator() {
  return (
    <Stack.Navigator
      {...stackNavigationConfig}
      initialRouteName={Routes.SEND_SHEET}
    >
      <Stack.Screen
        name={Routes.MODAL_SCREEN}
        component={ModalScreen}
        options={overlayExpandedPreset}
      />
      <Stack.Screen
        name={Routes.SEND_SHEET}
        component={SendSheetWrapper}
        options={sheetPreset}
      />
    </Stack.Navigator>
  );
}

function ImportSeedPhraseFlowNavigator() {
  return (
    <Stack.Navigator
      {...stackNavigationConfig}
      initialRouteName={Routes.IMPORT_SEED_PHRASE_SHEET}
    >
      <Stack.Screen
        name={Routes.MODAL_SCREEN}
        component={ModalScreen}
        options={overlayExpandedPreset}
      />
      <Stack.Screen
        name={Routes.IMPORT_SEED_PHRASE_SHEET}
        component={ImportSeedPhraseSheetWrapper}
      />
    </Stack.Navigator>
  );
}

function AddCashFlowNavigator() {
  return (
    <Stack.Navigator
      {...stackNavigationConfig}
      initialRouteName={Routes.ADD_CASH_SCREEN_NAVIGATOR}
    >
      <Stack.Screen
        name={Routes.SUPPORTED_COUNTRIES_MODAL_SCREEN}
        component={ModalScreen}
        options={overlayExpandedPreset}
      />
      <Stack.Screen
        name={Routes.ADD_CASH_SCREEN_NAVIGATOR}
        component={AddCashSheetWrapper}
      />
    </Stack.Navigator>
  );
}

function MainNavigator() {
  const isNewOnboardingFlowAvailable = useExperimentalFlag(NEW_ONBOARDING);

  return (
    <Stack.Navigator
      initialRouteName={
        isNewOnboardingFlowAvailable
          ? Routes.WELCOME_SCREEN
          : Routes.SWIPE_LAYOUT
      }
      {...stackNavigationConfig}
      screenOptions={defaultScreenStackOptions}
    >
      <Stack.Screen name={Routes.SWIPE_LAYOUT} component={SwipeNavigator} />
      <Stack.Screen name={Routes.WELCOME_SCREEN} component={WelcomeScreen} />
      <Stack.Screen
        name={Routes.SAVINGS_SHEET}
        component={SavingsSheet}
        options={bottomSheetPreset}
      />
      <Stack.Screen
        name={Routes.AVATAR_BUILDER}
        component={AvatarBuilder}
        options={emojiPreset}
      />
      <Stack.Screen
        name={Routes.WALLET_CONNECT_APPROVAL_SHEET}
        component={WalletConnectApprovalSheet}
        options={expandedPreset}
      />
      <Stack.Screen
        name={Routes.WALLET_CONNECT_REDIRECT_SHEET}
        component={WalletConnectRedirectSheet}
        options={bottomSheetPreset}
      />
      <Stack.Screen
        name={Routes.CONFIRM_REQUEST}
        component={TransactionConfirmationScreen}
        options={sheetPreset}
      />
      <Stack.Screen
        name={Routes.EXCHANGE_MODAL}
        component={ExchangeModalNavigator}
        options={exchangePreset}
      />
      {isNativeStackAvailable && (
        <Stack.Screen
          name={Routes.MODAL_SCREEN}
          component={ModalScreen}
          options={overlayExpandedPreset}
        />
      )}
    </Stack.Navigator>
  );
}

function MainNavigatorWrapper() {
  return (
    <Stack.Navigator
      initialRouteName={Routes.MAIN_NAVIGATOR_WRAPPER}
      {...stackNavigationConfig}
      screenOptions={defaultScreenStackOptions}
    >
      <Stack.Screen
        name={Routes.MAIN_NAVIGATOR_WRAPPER}
        component={MainNavigator}
      />
      <Stack.Screen
        name={Routes.SAVINGS_WITHDRAW_MODAL}
        component={WithdrawModal}
        options={exchangePreset}
      />
      <Stack.Screen
        name={Routes.SAVINGS_DEPOSIT_MODAL}
        component={DepositModal}
        options={exchangePreset}
      />
    </Stack.Navigator>
  );
}

function NativeStackFallbackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName={Routes.MAIN_NAVIGATOR}
      {...stackNavigationConfig}
      screenOptions={defaultScreenStackOptions}
    >
      <Stack.Screen name={Routes.MAIN_NAVIGATOR} component={MainNavigator} />
      <Stack.Screen
        name={Routes.IMPORT_SEED_PHRASE_SHEET}
        component={ImportSeedPhraseSheetWithData}
        options={{
          ...sheetPreset,
          onTransitionStart: () => {
            StatusBar.setBarStyle('light-content');
          },
        }}
      />
      <Stack.Screen
        name={Routes.ADD_CASH_SHEET}
        component={AddCashSheetWrapper}
        options={sheetPreset}
      />
      <Stack.Screen
        name={Routes.MODAL_SCREEN}
        component={ModalScreen}
        options={overlayExpandedPreset}
      />
      <Stack.Screen
        name={Routes.SEND_SHEET}
        component={SendSheet}
        options={{
          ...omit(sheetPreset, 'gestureResponseDistance'),
          onTransitionStart: () => {
            StatusBar.setBarStyle('light-content');
            onTransitionStart();
          },
        }}
      />
      <Stack.Screen
        name={Routes.SUPPORTED_COUNTRIES_MODAL_SCREEN}
        component={ModalScreen}
        options={overlayExpandedPreset}
      />
    </Stack.Navigator>
  );
}

const MainStack = isNativeStackAvailable
  ? MainNavigatorWrapper
  : NativeStackFallbackNavigator;

function NativeStackNavigator() {
  return (
    <NativeStack.Navigator {...nativeStackConfig}>
      <NativeStack.Screen name={Routes.STACK} component={MainStack} />
      <NativeStack.Screen
        name={Routes.RECEIVE_MODAL}
        component={ReceiveModal}
        options={{
          backgroundColor: '#3B3E43',
          backgroundOpacity: 1,
          customStack: true,
        }}
      />
      <NativeStack.Screen
        name={Routes.SETTINGS_MODAL}
        component={SettingsModal}
        {...sharedCoolModalConfig}
      />
      <NativeStack.Screen
        name={Routes.EXPANDED_ASSET_SHEET}
        component={ExpandedAssetSheetWrapper}
        {...expandedAssetSheetConfig}
      />
      <Stack.Screen
        name={Routes.CHANGE_WALLET_SHEET}
        component={ChangeWalletSheet}
        options={{
          allowsDragToDismiss: true,
          backgroundOpacity: 0.6,
          customStack: true,
          springDamping: 1,
          transitionDuration: 0.25,
        }}
      />
      {isNativeStackAvailable && (
        <>
          <NativeStack.Screen
            name={Routes.SEND_SHEET_NAVIGATOR}
            component={SendFlowNavigator}
          />
          <NativeStack.Screen
            name={Routes.IMPORT_SEED_PHRASE_SHEET_NAVIGATOR}
            component={ImportSeedPhraseFlowNavigator}
          />
          <NativeStack.Screen
            name={Routes.ADD_CASH_SCREEN_NAVIGATOR}
            component={AddCashFlowNavigator}
          />
        </>
      )}
    </NativeStack.Navigator>
  );
}

const AppContainerWithAnalytics = React.forwardRef((props, ref) => (
  <NavigationContainer ref={ref} onStateChange={onNavigationStateChange}>
    <NativeStackNavigator />
  </NavigationContainer>
));

AppContainerWithAnalytics.displayName = 'AppContainerWithAnalytics';

export default React.memo(AppContainerWithAnalytics);
