import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useContext } from 'react';
import { AddCashSheet } from '../screens/AddCash';
import AddTokenSheet from '../screens/AddTokenSheet';
import AvatarBuilder from '../screens/AvatarBuilder';
import BackupSheet from '../screens/BackupSheet';
import ChangeWalletSheet from '../screens/ChangeWalletSheet';
import ConnectedDappsSheet from '../screens/ConnectedDappsSheet';
import ENSAdditionalRecordsSheet from '../screens/ENSAdditionalRecordsSheet';
import ENSConfirmRegisterSheet from '../screens/ENSConfirmRegisterSheet';
import ExpandedAssetSheet from '../screens/ExpandedAssetSheet';
import ExplainSheet from '../screens/ExplainSheet';
import ExternalLinkWarningSheet from '../screens/ExternalLinkWarningSheet';
import ModalScreen from '../screens/ModalScreen';
import ProfileSheet from '../screens/ProfileSheet';
import ReceiveModal from '../screens/ReceiveModal';
import { RestoreSheet } from '../screens/RestoreSheet';
import SelectENSSheet from '../screens/SelectENSSheet';
import SelectUniqueTokenSheet from '../screens/SelectUniqueTokenSheet';
import { SendConfirmationSheet } from '../screens/SendConfirmationSheet';
import SendSheet from '../screens/SendSheet';
import { SettingsSheet } from '../screens/SettingsSheet';
import ShowcaseScreen from '../screens/ShowcaseSheet';
import SpeedUpAndCancelSheet from '../screens/SpeedUpAndCancelSheet';
import SwapsPromoSheet from '../screens/SwapsPromoSheet';
import NotificationsPromoSheet from '../screens/NotificationsPromoSheet';
import TransactionConfirmationScreen from '../screens/TransactionConfirmationScreen';
import WalletConnectApprovalSheet from '../screens/WalletConnectApprovalSheet';
import WalletConnectRedirectSheet from '../screens/WalletConnectRedirectSheet';
import { WalletDiagnosticsSheet } from '../screens/Diagnostics';
import WelcomeScreen from '../screens/WelcomeScreen';
import { useTheme } from '../theme/ThemeContext';
import RegisterENSNavigator from './RegisterENSNavigator';
import { SwipeNavigator } from './SwipeNavigator';
import {
  addTokenSheetConfig,
  backupSheetConfig,
  basicSheetConfig,
  hardwareWalletTxNavigatorConfig,
  customGasSheetConfig,
  defaultScreenStackOptions,
  ensAdditionalRecordsSheetConfig,
  ensConfirmRegisterSheetConfig,
  expandedAssetSheetConfigWithLimit,
  explainSheetConfig,
  externalLinkWarningSheetConfig,
  mintsSheetConfig,
  nativeStackDefaultConfig,
  nativeStackDefaultConfigWithoutStatusBar,
  nftOffersSheetConfig,
  nftSingleOfferSheetConfig,
  pairHardwareWalletNavigatorConfig,
  profileConfig,
  profilePreviewConfig,
  qrScannerConfig,
  promoSheetConfig,
  registerENSNavigatorConfig,
  restoreSheetConfig,
  sendConfirmationSheetConfig,
  settingsSheetConfig,
  stackNavigationConfig,
  swapDetailsSheetConfig,
  learnWebViewScreenConfig,
  transactionDetailsConfig,
  addWalletNavigatorConfig,
  opRewardsSheetConfig,
  portalSheetConfig,
  walletDiagnosticsSheetConfig,
  positionSheetConfig,
} from './config';
import {
  addCashSheet,
  emojiPreset,
  emojiPresetWallet,
  overlayExpandedPreset,
  sheetPreset,
} from './effects';
import { InitialRouteContext } from './initialRoute';
import { nativeStackConfig } from './nativeStackConfig';
import { onNavigationStateChange } from './onNavigationStateChange';
import Routes from './routesNames';
import { ExchangeModalNavigator } from './index';
import useExperimentalFlag, { PROFILES } from '@/config/experimentalHooks';
import createNativeStackNavigator from '@/react-native-cool-modals/createNativeStackNavigator';
import QRScannerScreen from '@/screens/QRScannerScreen';
import { PairHardwareWalletNavigator } from './PairHardwareWalletNavigator';
import LearnWebViewScreen from '@/screens/LearnWebViewScreen';
import { TransactionDetails } from '@/screens/transaction-details/TransactionDetails';
import { AddWalletNavigator } from './AddWalletNavigator';
import { HardwareWalletTxNavigator } from './HardwareWalletTxNavigator';
import { RewardsSheet } from '@/screens/rewards/RewardsSheet';
import { Portal } from '@/screens/Portal';
import PoapSheet from '@/screens/mints/PoapSheet';
import { PositionSheet } from '@/screens/positions/PositionSheet';
import { NFTOffersSheet } from '@/screens/NFTOffersSheet';
import { NFTSingleOfferSheet } from '@/screens/NFTSingleOfferSheet';
import { MintsSheet } from '@/screens/MintsSheet/MintsSheet';

type StackNavigatorParams = {
  [Routes.SEND_SHEET]: unknown;
  [Routes.MODAL_SCREEN]: unknown;
};

const Stack = createStackNavigator();
const NativeStack = createNativeStackNavigator();

function SendFlowNavigator() {
  return (
    <Stack.Navigator
      {...stackNavigationConfig}
      initialRouteName={Routes.SEND_SHEET}
    >
      <Stack.Screen
        component={ModalScreen}
        name={Routes.MODAL_SCREEN}
        options={overlayExpandedPreset}
      />
      <Stack.Screen
        component={SendSheet}
        name={Routes.SEND_SHEET}
        options={sheetPreset}
      />
    </Stack.Navigator>
  );
}

function MainNavigator() {
  const initialRoute = (useContext(InitialRouteContext) as unknown) as string;

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      {...stackNavigationConfig}
      screenOptions={defaultScreenStackOptions}
    >
      <Stack.Screen component={SwipeNavigator} name={Routes.SWIPE_LAYOUT} />
      <Stack.Screen
        component={WelcomeScreen}
        name={Routes.WELCOME_SCREEN}
        options={{ animationEnabled: false, gestureEnabled: false }}
      />
      <Stack.Screen
        component={AvatarBuilder}
        name={Routes.AVATAR_BUILDER}
        options={emojiPreset}
      />
      <Stack.Screen
        component={AvatarBuilder}
        name={Routes.AVATAR_BUILDER_WALLET}
        options={emojiPresetWallet}
      />
      <Stack.Screen
        component={AddCashSheet}
        name={Routes.ADD_CASH_SHEET}
        options={addCashSheet}
      />
    </Stack.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator
      initialRouteName={Routes.MAIN_NAVIGATOR_WRAPPER}
      {...stackNavigationConfig}
      screenOptions={defaultScreenStackOptions}
    >
      <Stack.Screen
        component={MainNavigator}
        name={Routes.MAIN_NAVIGATOR_WRAPPER}
      />
    </Stack.Navigator>
  );
}

function NativeStackNavigator() {
  const { colors, isDarkMode } = useTheme();
  const profilesEnabled = useExperimentalFlag(PROFILES);

  return (
    <NativeStack.Navigator {...nativeStackConfig}>
      <NativeStack.Screen component={MainStack} name={Routes.STACK} />
      <NativeStack.Screen
        component={LearnWebViewScreen}
        name={Routes.LEARN_WEB_VIEW_SCREEN}
        {...learnWebViewScreenConfig}
      />
      <NativeStack.Screen
        component={ReceiveModal}
        name={Routes.RECEIVE_MODAL}
        options={{
          backgroundColor: isDarkMode ? colors.offWhite : '#3B3E43',
          backgroundOpacity: 1,
          customStack: true,
        }}
      />
      <NativeStack.Screen
        component={SettingsSheet}
        name={Routes.SETTINGS_SHEET}
        {...settingsSheetConfig}
      />
      <NativeStack.Screen
        component={ExchangeModalNavigator}
        name={Routes.EXCHANGE_MODAL}
        options={{ ...nativeStackDefaultConfig, relevantScrollViewDepth: 2 }}
      />
      <NativeStack.Screen
        component={ExpandedAssetSheet}
        name={Routes.EXPANDED_ASSET_SHEET}
        {...expandedAssetSheetConfigWithLimit}
      />
      <NativeStack.Screen
        component={PoapSheet}
        name={Routes.POAP_SHEET}
        {...expandedAssetSheetConfigWithLimit}
      />
      <NativeStack.Screen
        component={PositionSheet}
        name={Routes.POSITION_SHEET}
        {...positionSheetConfig}
      />
      <NativeStack.Screen
        component={ShowcaseScreen}
        name={Routes.SHOWCASE_SHEET}
        options={{
          customStack: true,
        }}
      />
      <NativeStack.Screen
        component={SelectUniqueTokenSheet}
        name={Routes.SELECT_UNIQUE_TOKEN_SHEET}
        {...expandedAssetSheetConfigWithLimit}
      />
      <NativeStack.Screen
        component={ExpandedAssetSheet}
        name={Routes.TOKEN_INDEX_SHEET}
        {...expandedAssetSheetConfigWithLimit}
      />
      <NativeStack.Screen
        component={SpeedUpAndCancelSheet}
        name={Routes.SPEED_UP_AND_CANCEL_SHEET}
        options={{
          allowsDragToDismiss: true,
          backgroundOpacity: 0.6,
          customStack: true,
          headerHeight: 0,
          isShortFormEnabled: false,
          topOffset: 0,
        }}
      />
      <Stack.Screen
        component={SendConfirmationSheet}
        name={Routes.SEND_CONFIRMATION_SHEET}
        {...sendConfirmationSheetConfig}
      />
      <NativeStack.Screen
        component={AddTokenSheet}
        name={Routes.ADD_TOKEN_SHEET}
        {...addTokenSheetConfig}
      />
      <NativeStack.Screen
        component={ExplainSheet}
        name={Routes.EXPLAIN_SHEET}
        {...explainSheetConfig}
      />
      <NativeStack.Screen
        component={SwapsPromoSheet}
        name={Routes.SWAPS_PROMO_SHEET}
        {...promoSheetConfig}
      />
      <NativeStack.Screen
        component={NotificationsPromoSheet}
        name={Routes.NOTIFICATIONS_PROMO_SHEET}
        {...promoSheetConfig}
      />
      <NativeStack.Screen
        component={ExternalLinkWarningSheet}
        name={Routes.EXTERNAL_LINK_WARNING_SHEET}
        {...externalLinkWarningSheetConfig}
      />
      <NativeStack.Screen
        component={WalletDiagnosticsSheet}
        name={Routes.DIAGNOSTICS_SHEET}
        {...walletDiagnosticsSheetConfig}
      />
      <NativeStack.Screen
        component={ChangeWalletSheet}
        name={Routes.CHANGE_WALLET_SHEET}
        options={{
          allowsDragToDismiss: true,
          backgroundOpacity: 0.7,
          customStack: true,
          springDamping: 1,
          transitionDuration: 0.25,
        }}
      />
      <NativeStack.Screen
        component={ConnectedDappsSheet}
        name={Routes.CONNECTED_DAPPS}
        options={{
          allowsDragToDismiss: true,
          backgroundOpacity: 0.7,
          customStack: true,
          springDamping: 1,
          transitionDuration: 0.25,
        }}
      />
      <NativeStack.Screen
        component={BackupSheet}
        name={Routes.BACKUP_SHEET}
        {...backupSheetConfig}
      />
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
      <NativeStack.Screen
        component={RestoreSheet}
        name={Routes.RESTORE_SHEET}
        {...restoreSheetConfig}
      />
      <NativeStack.Screen
        component={TransactionConfirmationScreen}
        name={Routes.CONFIRM_REQUEST}
        options={{
          allowsDragToDismiss: true,
          backgroundOpacity: 1,
          customStack: true,
          headerHeight: 0,
          isShortFormEnabled: false,
          topOffset: 0,
        }}
      />
      <NativeStack.Screen
        component={ExpandedAssetSheet}
        name={Routes.CUSTOM_GAS_SHEET}
        {...customGasSheetConfig}
      />
      <NativeStack.Screen
        component={ExpandedAssetSheet}
        name={Routes.SWAP_DETAILS_SHEET}
        {...swapDetailsSheetConfig}
      />
      <NativeStack.Screen
        component={ExpandedAssetSheet}
        name={Routes.SWAP_SETTINGS_SHEET}
        {...customGasSheetConfig}
      />
      <NativeStack.Screen
        component={QRScannerScreen}
        name={Routes.QR_SCANNER_SCREEN}
        {...qrScannerConfig}
      />
      <NativeStack.Screen
        component={PairHardwareWalletNavigator}
        name={Routes.PAIR_HARDWARE_WALLET_NAVIGATOR}
        {...pairHardwareWalletNavigatorConfig}
      />
      <NativeStack.Screen
        component={HardwareWalletTxNavigator}
        name={Routes.HARDWARE_WALLET_TX_NAVIGATOR}
        {...hardwareWalletTxNavigatorConfig}
      />
      <NativeStack.Screen
        component={AddWalletNavigator}
        name={Routes.ADD_WALLET_NAVIGATOR}
        {...addWalletNavigatorConfig}
      />
      <NativeStack.Screen
        component={Portal}
        name={Routes.PORTAL}
        {...portalSheetConfig}
      />
      {profilesEnabled && (
        <>
          <NativeStack.Screen
            component={RegisterENSNavigator}
            name={Routes.REGISTER_ENS_NAVIGATOR}
            {...registerENSNavigatorConfig}
          />
          <NativeStack.Screen
            component={ENSConfirmRegisterSheet}
            name={Routes.ENS_CONFIRM_REGISTER_SHEET}
            {...ensConfirmRegisterSheetConfig}
          />
          <NativeStack.Screen
            component={ENSAdditionalRecordsSheet}
            name={Routes.ENS_ADDITIONAL_RECORDS_SHEET}
            {...ensAdditionalRecordsSheetConfig}
          />
          <NativeStack.Screen
            component={ProfileSheet}
            name={Routes.PROFILE_SHEET}
            {...profileConfig}
          />
          <NativeStack.Screen
            component={ProfileSheet}
            name={Routes.PROFILE_PREVIEW_SHEET}
            {...profilePreviewConfig}
          />
          <NativeStack.Screen
            component={SelectENSSheet}
            name={Routes.SELECT_ENS_SHEET}
            options={{
              allowsDragToDismiss: true,
              backgroundOpacity: 0.7,
              customStack: true,
              springDamping: 1,
              transitionDuration: 0.3,
            }}
          />
        </>
      )}
      <NativeStack.Screen
        component={SendFlowNavigator}
        name={Routes.SEND_SHEET_NAVIGATOR}
      />
      <NativeStack.Screen
        component={WalletConnectApprovalSheet}
        name={Routes.WALLET_CONNECT_APPROVAL_SHEET}
        {...basicSheetConfig}
      />
      <NativeStack.Screen
        component={WalletConnectRedirectSheet}
        name={Routes.WALLET_CONNECT_REDIRECT_SHEET}
        {...basicSheetConfig}
      />
      <NativeStack.Screen
        name={Routes.TRANSACTION_DETAILS}
        component={TransactionDetails}
        {...transactionDetailsConfig}
      />
      <NativeStack.Screen
        name={Routes.OP_REWARDS_SHEET}
        component={RewardsSheet}
        {...opRewardsSheetConfig}
      />
      <NativeStack.Screen
        name={Routes.NFT_OFFERS_SHEET}
        component={NFTOffersSheet}
        {...nftOffersSheetConfig}
      />
      <NativeStack.Screen
        name={Routes.NFT_SINGLE_OFFER_SHEET}
        component={NFTSingleOfferSheet}
        {...nftSingleOfferSheetConfig}
      />
      <NativeStack.Screen
        name={Routes.MINTS_SHEET}
        component={MintsSheet}
        {...mintsSheetConfig}
      />
    </NativeStack.Navigator>
  );
}

const AppContainerWithAnalytics = React.forwardRef(
  (
    props: {
      onReady: () => void;
    },
    ref
  ) => (
    <NavigationContainer
      onReady={props.onReady}
      onStateChange={onNavigationStateChange}
      // @ts-ignore
      ref={ref}
    >
      <NativeStackNavigator />
    </NavigationContainer>
  )
);

AppContainerWithAnalytics.displayName = 'AppContainerWithAnalytics';

export default React.memo(AppContainerWithAnalytics);
