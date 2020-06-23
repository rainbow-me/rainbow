import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { omit } from 'lodash';
import React from 'react';
import AddCashSheet from '../screens/AddCashSheet';
import AvatarBuilder from '../screens/AvatarBuilder';
import ChangeWalletSheet from '../screens/ChangeWalletSheet';
import ExpandedAssetSheet from '../screens/ExpandedAssetSheet';
import ImportSeedPhraseSheetWithData from '../screens/ImportSeedPhraseSheetWithData';
import ModalScreen from '../screens/ModalScreen';
import ReceiveModal from '../screens/ReceiveModal';
import SendSheet from '../screens/SendSheet';
import SettingsModal from '../screens/SettingsModal';
import TransactionConfirmationScreen from '../screens/TransactionConfirmationScreen';
import WalletConnectApprovalSheet from '../screens/WalletConnectApprovalSheet';
import WalletConnectRedirectSheet from '../screens/WalletConnectRedirectSheet';
import { SwipeNavigator } from './SwipeNavigator';
import { defaultScreenStackOptions, stackNavigationConfig } from './config';
import {
  bottomSheetPreset,
  emojiPreset,
  exchangePreset,
  expandedPreset,
  expandedPresetReverse,
  overlayExpandedPreset,
  sheetPreset,
} from './effects';
import { onNavigationStateChange } from './onNavigationStateChange';
import Routes from './routesNames';
import { ExchangeModalNavigator } from './index';

const Stack = createStackNavigator();

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
        name={Routes.CHANGE_WALLET_SHEET}
        component={ChangeWalletSheet}
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
        options={expandedPreset}
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
