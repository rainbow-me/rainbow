import { NavigationContainer } from '@react-navigation/native';
import { omit } from 'lodash';
import React from 'react';
import AddCashSheet from '../screens/AddCashSheet';
import AvatarBuilder from '../screens/AvatarBuilder';
import ChangeWalletModal from '../screens/ChangeWalletModal';
import ExampleScreen from '../screens/ExampleScreen';
import ExpandedAssetSheet from '../screens/ExpandedAssetSheet';
import ImportSeedPhraseSheetWithData from '../screens/ImportSeedPhraseSheetWithData';
import ModalScreen from '../screens/ModalScreen';
import ReceiveModal from '../screens/ReceiveModal';
import SendSheet from '../screens/SendSheet';
import SettingsModal from '../screens/SettingsModal';
import TransactionConfirmationScreen from '../screens/TransactionConfirmationScreen';
import WalletConnectConfirmationModal from '../screens/WalletConnectConfirmationModal';
import { SwipeNavigator } from './SwipeNavigator';
import { defaultScreenStackOptions, stackNavigationConfig } from './config';
import {
  backgroundPreset,
  emojiPreset,
  exchangePreset,
  expandedPreset,
  expandedPresetReverse,
  overlayExpandedPreset,
  sheetPreset,
} from './effects';
import { createStackNavigator } from './helpers';
import { onNavigationStateChange } from './onNavigationStateChange';
import Routes from './routesNames';
import { ExchangeModalNavigator } from './index';

const routesForStack = {
  [Routes.AVATAR_BUILDER]: {
    navigationOptions: emojiPreset,
    screen: AvatarBuilder,
    transparentCard: true,
  },
  [Routes.CHANGE_WALLET_MODAL]: {
    navigationOptions: expandedPresetReverse,
    screen: ChangeWalletModal,
  },
  [Routes.CONFIRM_REQUEST]: {
    navigationOptions: sheetPreset,
    screen: TransactionConfirmationScreen,
  },
  [Routes.EXAMPLE_SCREEN]: ExampleScreen,
  [Routes.EXCHANGE_MODAL]: {
    navigationOptions: exchangePreset,
    params: {
      isGestureBlocked: false,
    },
    screen: ExchangeModalNavigator,
  },
  [Routes.EXPANDED_ASSET_SHEET]: {
    navigationOptions: expandedPreset,
    screen: ExpandedAssetSheet,
  },
  [Routes.MODAL_SCREEN]: {
    navigationOptions: overlayExpandedPreset,
    screen: ModalScreen,
  },
  [Routes.RECEIVE_MODAL]: {
    navigationOptions: expandedPreset,
    screen: ReceiveModal,
  },
  [Routes.SETTINGS_MODAL]: {
    navigationOptions: expandedPreset,
    screen: SettingsModal,
    transparentCard: true,
  },
  [Routes.SWIPE_LAYOUT]: {
    navigationOptions: backgroundPreset,
    screen: SwipeNavigator,
  },
  [Routes.WALLET_CONNECT_CONFIRMATION_MODAL]: {
    navigationOptions: expandedPreset,
    screen: WalletConnectConfirmationModal,
  },
  [Routes.ADD_CASH_SHEET]: {
    navigationOptions: sheetPreset,
    screen: AddCashSheet,
  },
  [Routes.IMPORT_SEED_PHRASE_SHEET]: {
    navigationOptions: sheetPreset,
    screen: ImportSeedPhraseSheetWithData,
  },
  [Routes.SEND_SHEET]: {
    navigationOptions: {
      ...omit(sheetPreset, 'gestureResponseDistance'),
    },
    screen: SendSheet,
  },
};
const Stack = createStackNavigator(routesForStack, {
  initialRouteName: 'MainNavigator',
});

function MainNavigator() {
  return (
    <Stack.Navigator
      initialRouteName={Routes.SWIPE_LAYOUT}
      {...stackNavigationConfig}
      screenOptions={defaultScreenStackOptions}
    >
      <Stack.Screen name={Routes.SWIPE_LAYOUT} component={SwipeNavigator} />
      <Stack.Screen
        name={Routes.AVATAR_BUILDER}
        component={AvatarBuilder}
        options={emojiPreset}
      />
      <Stack.Screen
        name={Routes.CHANGE_WALLET_MODAL}
        component={ChangeWalletModal}
        options={expandedPresetReverse}
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
      <Stack.Screen
        name={Routes.EXPANDED_ASSET_SHEET}
        component={ExpandedAssetSheet}
        options={expandedPreset}
      />
      <Stack.Screen
        name={Routes.MODAL_SCREEN}
        component={ModalScreen}
        options={overlayExpandedPreset}
      />
      <Stack.Screen
        name={Routes.RECEIVE_MODAL}
        component={ReceiveModal}
        options={expandedPreset}
      />
      <Stack.Screen
        name={Routes.SETTINGS_MODAL}
        component={SettingsModal}
        options={(...p) => console.log(p) || expandedPreset}
      />
      <Stack.Screen
        name={Routes.WALLET_CONNECT_CONFIRMATION_MODAL}
        component={WalletConnectConfirmationModal}
        options={expandedPreset}
      />
      <Stack.Screen
        name={Routes.ADD_CASH_SHEET}
        component={AddCashSheet}
        options={sheetPreset}
      />
      <Stack.Screen
        name={Routes.IMPORT_SEED_PHRASE_SHEET}
        component={ImportSeedPhraseSheetWithData}
        options={sheetPreset}
      />
      <Stack.Screen
        name={Routes.SEND_SHEET}
        component={SendSheet}
        options={{
          ...omit(sheetPreset, 'gestureResponseDistance'),
        }}
      />
    </Stack.Navigator>
  );
}

const AppContainerWithAnalytics = React.forwardRef((props, ref) => (
  <NavigationContainer ref={ref} onStateChange={onNavigationStateChange}>
    <MainNavigator />
  </NavigationContainer>
));

AppContainerWithAnalytics.displayName = 'AppContainerWithAnalytics';

export default React.memo(AppContainerWithAnalytics);
