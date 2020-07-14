import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { omit } from 'lodash';
import React from 'react';
import AddCashSheet from '../screens/AddCashSheet';
import AvatarBuilder from '../screens/AvatarBuilder';
import ChangeWalletSheet from '../screens/ChangeWalletSheet';
import DepositModal from '../screens/DepositModal';
import ExpandedAssetSheet from '../screens/ExpandedAssetSheet';
import ImportSeedPhraseSheet from '../screens/ImportSeedPhraseSheet';
import ModalScreen from '../screens/ModalScreen';
import ReceiveModal from '../screens/ReceiveModal';
import SavingsSheet from '../screens/SavingsSheet';
import SendSheet from '../screens/SendSheet';
import SettingsModal from '../screens/SettingsModal';
import TransactionConfirmationScreen from '../screens/TransactionConfirmationScreen';
import WalletConnectApprovalSheet from '../screens/WalletConnectApprovalSheet';
import WalletConnectRedirectSheet from '../screens/WalletConnectRedirectSheet';
import WithdrawModal from '../screens/WithdrawModal';
import { SwipeNavigator } from './SwipeNavigator';
import { defaultScreenStackOptions, stackNavigationConfig } from './config';
import {
  bottomSheetPreset,
  emojiPreset,
  exchangePreset,
  expandedPreset,
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
        component={TransactionConfirmationScreen}
        name={Routes.CONFIRM_REQUEST}
        options={sheetPreset}
      />
      <Stack.Screen
        component={ExchangeModalNavigator}
        name={Routes.EXCHANGE_MODAL}
        options={exchangePreset}
      />
      <Stack.Screen
        component={ExpandedAssetSheet}
        name={Routes.EXPANDED_ASSET_SHEET}
        options={expandedPreset}
      />
      <Stack.Screen
        component={ModalScreen}
        name={Routes.MODAL_SCREEN}
        options={overlayExpandedPreset}
      />
      <Stack.Screen
        component={ReceiveModal}
        name={Routes.RECEIVE_MODAL}
        options={expandedPreset}
      />
      <Stack.Screen
        component={SettingsModal}
        name={Routes.SETTINGS_MODAL}
        options={expandedPreset}
      />
      <Stack.Screen
        component={WalletConnectApprovalSheet}
        name={Routes.WALLET_CONNECT_APPROVAL_SHEET}
        options={expandedPreset}
      />
      <Stack.Screen
        component={WalletConnectRedirectSheet}
        name={Routes.WALLET_CONNECT_REDIRECT_SHEET}
        options={bottomSheetPreset}
      />
      <Stack.Screen
        component={AddCashSheet}
        name={Routes.ADD_CASH_SHEET}
        options={sheetPreset}
      />
      <Stack.Screen
        component={ImportSeedPhraseSheet}
        name={Routes.IMPORT_SEED_PHRASE_SHEET}
        options={sheetPreset}
      />
      <Stack.Screen
        component={SavingsSheet}
        name={Routes.SAVINGS_SHEET}
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
        component={SendSheet}
        name={Routes.SEND_SHEET}
        options={{
          ...omit(sheetPreset, 'gestureResponseDistance'),
        }}
      />
    </Stack.Navigator>
  );
}

const AppContainerWithAnalytics = React.forwardRef((props, ref) => (
  <NavigationContainer onStateChange={onNavigationStateChange} ref={ref}>
    <MainNavigator />
  </NavigationContainer>
));

AppContainerWithAnalytics.displayName = 'AppContainerWithAnalytics';

export default React.memo(AppContainerWithAnalytics);
