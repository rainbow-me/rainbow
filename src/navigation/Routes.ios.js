import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { omit } from 'lodash';
import React from 'react';
import { StatusBar } from 'react-native';
import { createNativeStackNavigator } from 'react-native-cool-modals/native-stack';
import isNativeStackAvailable from '../helpers/isNativeStackAvailable';
import AvatarBuilder from '../screens/AvatarBuilder';
import ChangeWalletModal from '../screens/ChangeWalletModal';
import ImportSeedPhraseSheetWithData from '../screens/ImportSeedPhraseSheetWithData';
import ModalScreen from '../screens/ModalScreen';
import ProfileScreen from '../screens/ProfileScreen';
import QRScannerScreenWithData from '../screens/QRScannerScreenWithData';
import ReceiveModal from '../screens/ReceiveModal';
import SavingsSheet from '../screens/SavingsSheet';
import SendSheet from '../screens/SendSheet';
import SettingsModal from '../screens/SettingsModal';
import TransactionConfirmationScreen from '../screens/TransactionConfirmationScreen';
import WalletConnectConfirmationModal from '../screens/WalletConnectConfirmationModal';
import WalletScreen from '../screens/WalletScreen';
import WithdrawModal from '../screens/WithdrawModal';
import { deviceUtils } from '../utils';
import {
  defaultScreenStackOptions,
  expandedAssetSheetConfig,
  nativeStackConfig,
  sharedCoolModalConfig,
  stackNavigationConfig,
} from './config';
import {
  backgroundPreset,
  emojiPreset,
  overlayExpandedPreset,
  sheetPreset,
} from './effects';
import {
  exchangePresetWithTransitions,
  expandedPresetWithTransitions,
  expandedReversePresetWithTransitions,
  onTransitionStart,
  ScrollPagerWrapper,
  sheetPresetWithTransitions,
} from './helpers';
import {
  AddCashSheetWrapper,
  ExpandedAssetSheetWrapper,
  ImportSeedPhraseSheetWrapper,
  SendSheetWrapper,
} from './nativeStackHelpers';
import { onNavigationStateChange } from './onNavigationStateChange';
import Routes from './routesNames';
import { ExchangeModalNavigator } from './index';

const Swipe = createMaterialTopTabNavigator();
const Stack = createStackNavigator();
const NativeStack = createNativeStackNavigator();

const renderTabBar = () => null;

function NewSwipe() {
  return (
    <Swipe.Navigator
      initialRouteName={Routes.WALLET_SCREEN}
      tabBar={renderTabBar}
      initialLayout={deviceUtils.dimensions}
      pager={ScrollPagerWrapper}
    >
      <Swipe.Screen name={Routes.PROFILE_SCREEN} component={ProfileScreen} />
      <Swipe.Screen name={Routes.WALLET_SCREEN} component={WalletScreen} />
      <Swipe.Screen
        name={Routes.QR_SCANNER_SCREEN}
        component={QRScannerScreenWithData}
      />
    </Swipe.Navigator>
  );
}

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
        options={sheetPresetWithTransitions}
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

function NewAddCashFlowNavigator() {
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
  return (
    <Stack.Navigator
      initialRouteName={Routes.SWIPE_LAYOUT}
      {...stackNavigationConfig}
      screenOptions={defaultScreenStackOptions}
    >
      <Stack.Screen name={Routes.SWIPE_LAYOUT} component={NewSwipe} />
      <Stack.Screen
        name={Routes.SAVINGS_SHEET}
        component={SavingsSheet}
        options={backgroundPreset}
      />
      <Stack.Screen
        name={Routes.AVATAR_BUILDER}
        component={AvatarBuilder}
        options={emojiPreset}
      />
      <Stack.Screen
        name={Routes.SAVINGS_WITHDRAW_MODAL}
        component={WithdrawModal}
        options={exchangePresetWithTransitions}
      />
      <Stack.Screen
        name={Routes.SAVINGS_DEPOSIT_MODAL}
        component={() => null}
        options={exchangePresetWithTransitions}
      />
      <Stack.Screen
        name={Routes.WALLET_CONNECT_CONFIRMATION_MODAL}
        component={WalletConnectConfirmationModal}
        options={expandedPresetWithTransitions}
      />
      <Stack.Screen
        name={Routes.CONFIRM_REQUEST}
        component={TransactionConfirmationScreen}
        options={sheetPresetWithTransitions}
      />
      <Stack.Screen
        name={Routes.CHANGE_WALLET_MODAL}
        component={ChangeWalletModal}
        options={expandedReversePresetWithTransitions}
      />
      <Stack.Screen
        name={Routes.EXCHANGE_MODAL}
        component={ExchangeModalNavigator}
        options={{ ...exchangePresetWithTransitions, gestureEnabled: true }}
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

function MainNavigatorFallback() {
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
  ? MainNavigator
  : MainNavigatorFallback;

function NativeStackNavigator() {
  return (
    <NativeStack.Navigator {...nativeStackConfig}>
      <NativeStack.Screen name={Routes.STACK} component={MainStack} />
      <NativeStack.Screen
        name={Routes.RECEIVE_MODAL}
        component={ReceiveModal}
        {...sharedCoolModalConfig}
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
            component={NewAddCashFlowNavigator}
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
