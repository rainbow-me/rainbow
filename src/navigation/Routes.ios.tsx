/* eslint-disable react/jsx-props-no-spreading */
import React, { useContext } from 'react';

import { NavigationContainer, type NavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { SwapScreen } from '@/__swaps__/screens/Swap/Swap';
import { ControlPanel } from '@/components/DappBrowser/control-panel/ControlPanel';
import { LogSheet } from '@/components/debugging/LogSheet';
import WalletErrorSheet from '@/components/wallet-error/WalletErrorSheet';
import useExperimentalFlag, { PROFILES } from '@/config/experimentalHooks';
import AppIconUnlockSheet from '@/features/app-icon/screens/AppIconUnlockSheet';
import BackupSheet from '@/features/backup/components/BackupSheet';
import RegisterENSNavigator from '@/features/ens/navigation/RegisterENSNavigator';
import ENSAdditionalRecordsSheet from '@/features/ens/screens/ENSAdditionalRecordsSheet';
import ENSConfirmRegisterSheet from '@/features/ens/screens/ENSConfirmRegisterSheet';
import SelectENSSheet from '@/features/ens/screens/SelectENSSheet';
import { useShowKingOfTheHill } from '@/features/king-of-the-hill/hooks/useShowKingOfTheHill';
import { KingOfTheHillExplainSheet } from '@/features/king-of-the-hill/screens/KingOfTheHillExplainSheet';
import { NotificationPermissionScreen } from '@/features/notifications/screens/NotificationPermissionScreen';
import { ClosePositionBottomSheet } from '@/features/perps/screens/ClosePositionBottomSheet';
import { CreateTriggerOrderBottomSheet } from '@/features/perps/screens/CreateTriggerOrderBottomSheet';
import { PerpsDetailScreen } from '@/features/perps/screens/perp-detail-screen/PerpDetailScreen';
import { PerpsAboutSheet } from '@/features/perps/screens/perps-about-sheet/PerpsAboutSheet';
import { PerpsAddToPositionSheet } from '@/features/perps/screens/perps-add-to-position-sheet/PerpsAddToPositionSheet';
import { PerpsDepositScreen } from '@/features/perps/screens/perps-deposit-withdraw-screen/PerpsDepositScreen';
import { PerpsWithdrawalScreen } from '@/features/perps/screens/perps-deposit-withdraw-screen/PerpsWithdrawalScreen';
import { PerpsExplainSheet } from '@/features/perps/screens/perps-explain-sheet/PerpsExplainSheet';
import { PerpsTradeDetailsSheet } from '@/features/perps/screens/perps-trade-details-sheet/PerpsTradeDetailsSheet';
import { PerpsTradeHistoryScreen } from '@/features/perps/screens/perps-trade-history/PerpsTradeHistoryScreen';
import { PerpsNavigator } from '@/features/perps/screens/PerpsNavigator';
import { PolymarketDepositScreen } from '@/features/polymarket/funding/screens/PolymarketDepositScreen';
import { PolymarketWithdrawalScreen } from '@/features/polymarket/funding/screens/PolymarketWithdrawalScreen';
import { PolymarketAccountScreen } from '@/features/polymarket/screens/polymarket-account-screen/PolymarketAccountScreen';
import { PolymarketBrowseEventsScreen } from '@/features/polymarket/screens/polymarket-browse-events-screen/PolymarketBrowseEventsScreen';
import { PolymarketEventScreen } from '@/features/polymarket/screens/polymarket-event-screen/PolymarketEventScreen';
import { PolymarketExplainSheet } from '@/features/polymarket/screens/polymarket-learn-sheet/PolymarketExplainSheet';
import { PolymarketMarketDescriptionSheet } from '@/features/polymarket/screens/polymarket-market-description-sheet/PolymarketMarketDescriptionSheet';
import { PolymarketMarketSheet } from '@/features/polymarket/screens/polymarket-market-sheet/PolymarketMarketSheet';
import { PolymarketNavigator } from '@/features/polymarket/screens/polymarket-navigator/PolymarketNavigator';
import { PolymarketNewPositionSheet } from '@/features/polymarket/screens/polymarket-new-position-sheet/PolymarketNewPositionSheet';
import { PolymarketRedeemPositionSheet } from '@/features/polymarket/screens/polymarket-redeem-position-sheet/PolymarketRedeemPositionSheet';
import { PolymarketSellPositionSheet } from '@/features/polymarket/screens/polymarket-sell-position-sheet/PolymarketSellPositionSheet';
import { PositionSheet } from '@/features/positions/screens/PositionSheet';
import { RnbwAirdropScreen } from '@/features/rnbw-airdrop/screens/rnbw-airdrop-screen/RnbwAirdropScreen';
import { RnbwMembershipTiersSheet } from '@/features/rnbw-membership/screens/rnbw-membership-tiers-sheet/RnbwMembershipTiersSheet';
import { RnbwRewardsClaimSheet } from '@/features/rnbw-rewards/screens/rnbw-rewards-claim-sheet/RnbwRewardsClaimSheet';
import { RnbwRewardsEstimateSheet } from '@/features/rnbw-rewards/screens/rnbw-rewards-estimate-sheet/RnbwRewardsEstimateSheet';
import { RnbwStakingLearnScreen } from '@/features/rnbw-staking/screens/rnbw-staking-learn-screen/RnbwStakingLearnScreen';
import { RnbwStakingScreen } from '@/features/rnbw-staking/screens/rnbw-staking-screen/RnbwStakingScreen';
import { RnbwUnstakeSheet } from '@/features/rnbw-staking/screens/rnbw-unstake-sheet/RnbwUnstakeSheet';
import ConnectedDappsSheet from '@/features/wallet-connect/screens/ConnectedDappsSheet';
import createNativeStackCoolModalNavigator from '@/react-native-cool-modals/createNativeStackNavigator';
import { Portal as CMPortal } from '@/react-native-cool-modals/Portal';
import { ActivitySheetScreen } from '@/screens/ActivitySheetScreen';
import { AirdropsSheet } from '@/screens/Airdrops/AirdropsSheet';
import { ClaimAirdropSheet } from '@/screens/Airdrops/ClaimAirdropSheet';
import CheckIdentifierScreen from '@/screens/CheckIdentifierScreen';
import { ClaimClaimablePanel } from '@/screens/claimables/ClaimPanel';
import { RevokeDelegationPanel } from '@/screens/delegation/RevokeDelegationPanel';
import { ExpandedAssetSheet as ExpandedAssetSheetV2 } from '@/screens/expandedAssetSheet/ExpandedAssetSheet';
import LearnWebViewScreen from '@/screens/LearnWebViewScreen';
import MintSheet from '@/screens/mints/MintSheet';
import PoapSheet from '@/screens/mints/PoapSheet';
import { MintsSheet } from '@/screens/MintsSheet/MintsSheet';
import { NetworkSelector } from '@/screens/network-selector/NetworkSelector';
import { NFTOffersSheet } from '@/screens/NFTOffersSheet';
import { NFTSingleOfferSheet } from '@/screens/NFTSingleOfferSheet';
import { Portal } from '@/screens/Portal';
import QRScannerScreen from '@/screens/QRScannerScreen';
import { RewardsSheet } from '@/screens/rewards/RewardsSheet';
import { TokenLauncherScreen } from '@/screens/token-launcher/TokenLauncherScreen';
import { TransactionDetails } from '@/screens/transaction-details/TransactionDetails';

import { AddCashSheet } from '../screens/AddCash';
import AvatarBuilder from '../screens/AvatarBuilder';
import ChangeWalletSheet from '../screens/change-wallet/ChangeWalletSheet';
import { WalletDiagnosticsSheet } from '../screens/Diagnostics';
import ExpandedAssetSheet from '../screens/ExpandedAssetSheet';
import ExplainSheet from '../screens/ExplainSheet';
import ExternalLinkWarningSheet from '../screens/ExternalLinkWarningSheet';
import ModalScreen from '../screens/ModalScreen';
import NoNeedWCSheet from '../screens/NoNeedWCSheet';
import ProfileSheet from '../screens/ProfileSheet';
import ReceiveModal from '../screens/ReceiveModal';
import { RestoreSheet } from '../screens/RestoreSheet';
import SelectUniqueTokenSheet from '../screens/SelectUniqueTokenSheet';
import { SendConfirmationSheet } from '../screens/SendConfirmationSheet';
import SendSheet from '../screens/SendSheet';
import { SettingsSheet } from '../screens/SettingsSheet/SettingsSheet';
import { SignTransactionSheet } from '../screens/SignTransactionSheet';
import SpeedUpAndCancelSheet from '../screens/SpeedUpAndCancelSheet';
import WalletConnectApprovalSheet from '../screens/WalletConnectApprovalSheet';
import WalletConnectRedirectSheet from '../screens/WalletConnectRedirectSheet';
import { WelcomeScreen } from '../screens/WelcomeScreen/WelcomeScreen';
import { AddWalletNavigator } from './AddWalletNavigator';
import {
  activitySheetConfig,
  addWalletNavigatorConfig,
  airdropsSheetConfig,
  appIconUnlockSheetConfig,
  backupSheetConfig,
  basicSheetConfig,
  checkIdentifierSheetConfig,
  claimAirdropSheetConfig,
  customGasSheetConfig,
  defaultScreenStackOptions,
  ensAdditionalRecordsSheetConfig,
  ensConfirmRegisterSheetConfig,
  expandedAssetSheetConfigWithLimit,
  expandedAssetSheetV2Config,
  explainSheetConfig,
  externalLinkWarningSheetConfig,
  hardwareWalletTxNavigatorConfig,
  learnSheetConfig,
  learnWebViewScreenConfig,
  mintsSheetConfig,
  nftOffersSheetConfig,
  nftSingleOfferSheetConfig,
  notificationPermissionSheetConfig,
  opRewardsSheetConfig,
  pairHardwareWalletNavigatorConfig,
  panelConfig,
  perpsAccountStackConfig,
  perpsDepositWithdrawalConfig,
  perpsExplainSheetConfig,
  portalSheetConfig,
  positionSheetConfig,
  profileConfig,
  profilePreviewConfig,
  qrScannerConfig,
  recieveModalSheetConfig,
  registerENSNavigatorConfig,
  restoreSheetConfig,
  sendConfirmationSheetConfig,
  settingsSheetConfig,
  signTransactionSheetConfig,
  stackNavigationConfig,
  swapConfig,
  tokenLauncherConfig,
  transactionDetailsConfig,
  walletDiagnosticsSheetConfig,
  walletErrorSheetConfig,
} from './config';
import { addCashSheet, emojiPreset, emojiPresetWallet, overlayExpandedPreset, sheetPreset } from './effects';
import { HardwareWalletTxNavigator } from './HardwareWalletTxNavigator';
import { InitialRouteContext } from './initialRoute';
import { nativeStackConfig } from './nativeStackConfig';
import { onNavigationStateChange } from './onNavigationStateChange';
import { PairHardwareWalletNavigator } from './PairHardwareWalletNavigator';
import Routes from './routesNames';
import { SwipeNavigator } from './SwipeNavigator';
import { type RootStackParamList } from './types';

const Stack = createStackNavigator();
const NativeStack = createNativeStackCoolModalNavigator();

function SendFlowNavigator() {
  return (
    <Stack.Navigator {...stackNavigationConfig} initialRouteName={Routes.SEND_SHEET}>
      <Stack.Screen getComponent={() => ModalScreen} name={Routes.MODAL_SCREEN} options={overlayExpandedPreset} />
      <Stack.Screen getComponent={() => SendSheet} name={Routes.SEND_SHEET} options={sheetPreset} />
    </Stack.Navigator>
  );
}

function MainNavigator() {
  const initialRoute = useContext(InitialRouteContext) as unknown as string;

  return (
    <Stack.Navigator initialRouteName={initialRoute} {...stackNavigationConfig} screenOptions={defaultScreenStackOptions}>
      <Stack.Screen getComponent={() => SwipeNavigator} name={Routes.SWIPE_LAYOUT} />
      <Stack.Screen
        getComponent={() => WelcomeScreen}
        name={Routes.WELCOME_SCREEN}
        options={{ animationEnabled: false, gestureEnabled: false }}
      />
      <Stack.Screen getComponent={() => AvatarBuilder} name={Routes.AVATAR_BUILDER} options={emojiPreset} />
      <Stack.Screen getComponent={() => AvatarBuilder} name={Routes.AVATAR_BUILDER_WALLET} options={emojiPresetWallet} />
      <Stack.Screen getComponent={() => AddCashSheet} name={Routes.ADD_CASH_SHEET} options={addCashSheet} />
    </Stack.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator initialRouteName={Routes.MAIN_NAVIGATOR_WRAPPER} {...stackNavigationConfig} screenOptions={defaultScreenStackOptions}>
      <Stack.Screen getComponent={() => MainNavigator} name={Routes.MAIN_NAVIGATOR_WRAPPER} />
    </Stack.Navigator>
  );
}

function NativeStackNavigator() {
  const profilesEnabled = useExperimentalFlag(PROFILES);
  const showKingOfTheHillTab = useShowKingOfTheHill();

  return (
    <NativeStack.Navigator {...nativeStackConfig}>
      <NativeStack.Screen getComponent={() => MainStack} name={Routes.STACK} />
      <NativeStack.Screen
        getComponent={() => NotificationPermissionScreen}
        name={Routes.NOTIFICATION_PERMISSION_SCREEN}
        {...notificationPermissionSheetConfig}
      />
      <NativeStack.Screen getComponent={() => LearnWebViewScreen} name={Routes.LEARN_WEB_VIEW_SCREEN} {...learnWebViewScreenConfig} />
      <NativeStack.Screen getComponent={() => ReceiveModal} name={Routes.RECEIVE_MODAL} {...recieveModalSheetConfig} />
      <NativeStack.Screen getComponent={() => SettingsSheet} name={Routes.SETTINGS_SHEET} {...settingsSheetConfig} />
      <NativeStack.Screen
        getComponent={() => ExpandedAssetSheet}
        name={Routes.EXPANDED_ASSET_SHEET}
        {...expandedAssetSheetConfigWithLimit}
      />
      <NativeStack.Screen getComponent={() => PoapSheet} name={Routes.POAP_SHEET} {...expandedAssetSheetConfigWithLimit} />
      <NativeStack.Screen getComponent={() => MintSheet} name={Routes.MINT_SHEET} {...expandedAssetSheetConfigWithLimit} />
      <NativeStack.Screen getComponent={() => PositionSheet} name={Routes.POSITION_SHEET} {...positionSheetConfig} />
      <NativeStack.Screen
        getComponent={() => SelectUniqueTokenSheet}
        name={Routes.SELECT_UNIQUE_TOKEN_SHEET}
        {...expandedAssetSheetConfigWithLimit}
      />
      <NativeStack.Screen
        getComponent={() => SpeedUpAndCancelSheet}
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
      <Stack.Screen getComponent={() => SendConfirmationSheet} name={Routes.SEND_CONFIRMATION_SHEET} {...sendConfirmationSheetConfig} />
      <NativeStack.Screen getComponent={() => ExplainSheet} name={Routes.EXPLAIN_SHEET} {...explainSheetConfig} />
      <NativeStack.Screen
        getComponent={() => ExternalLinkWarningSheet}
        name={Routes.EXTERNAL_LINK_WARNING_SHEET}
        {...externalLinkWarningSheetConfig}
      />
      <NativeStack.Screen getComponent={() => WalletDiagnosticsSheet} name={Routes.DIAGNOSTICS_SHEET} {...walletDiagnosticsSheetConfig} />
      <NativeStack.Screen getComponent={() => ChangeWalletSheet} name={Routes.CHANGE_WALLET_SHEET} {...panelConfig} />
      <NativeStack.Screen
        getComponent={() => ConnectedDappsSheet}
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
        getComponent={() => CheckIdentifierScreen}
        name={Routes.CHECK_IDENTIFIER_SCREEN}
        {...checkIdentifierSheetConfig}
      />
      <NativeStack.Screen getComponent={() => BackupSheet} name={Routes.BACKUP_SHEET} {...backupSheetConfig} />
      <NativeStack.Screen
        getComponent={() => ModalScreen}
        name={Routes.MODAL_SCREEN}
        options={{
          customStack: true,
          ignoreBottomOffset: true,
          onAppear: null,
          topOffset: 0,
        }}
      />
      <NativeStack.Screen getComponent={() => RestoreSheet} name={Routes.RESTORE_SHEET} {...restoreSheetConfig} />
      <NativeStack.Screen getComponent={() => SignTransactionSheet} name={Routes.CONFIRM_REQUEST} {...signTransactionSheetConfig} />
      <NativeStack.Screen getComponent={() => ExpandedAssetSheet} name={Routes.CUSTOM_GAS_SHEET} {...customGasSheetConfig} />
      <NativeStack.Screen getComponent={() => QRScannerScreen} name={Routes.QR_SCANNER_SCREEN} {...qrScannerConfig} />
      <NativeStack.Screen
        getComponent={() => PairHardwareWalletNavigator}
        name={Routes.PAIR_HARDWARE_WALLET_NAVIGATOR}
        {...pairHardwareWalletNavigatorConfig}
      />
      <NativeStack.Screen
        getComponent={() => HardwareWalletTxNavigator}
        name={Routes.HARDWARE_WALLET_TX_NAVIGATOR}
        {...hardwareWalletTxNavigatorConfig}
      />
      <NativeStack.Screen getComponent={() => AddWalletNavigator} name={Routes.ADD_WALLET_NAVIGATOR} {...addWalletNavigatorConfig} />
      <NativeStack.Screen getComponent={() => Portal} name={Routes.PORTAL} {...portalSheetConfig} />
      {showKingOfTheHillTab && (
        <NativeStack.Screen getComponent={() => ActivitySheetScreen} name={Routes.PROFILE_SCREEN} {...activitySheetConfig} />
      )}
      {profilesEnabled && (
        <>
          <NativeStack.Screen
            getComponent={() => RegisterENSNavigator}
            name={Routes.REGISTER_ENS_NAVIGATOR}
            {...registerENSNavigatorConfig}
          />
          <NativeStack.Screen
            getComponent={() => ENSConfirmRegisterSheet}
            name={Routes.ENS_CONFIRM_REGISTER_SHEET}
            {...ensConfirmRegisterSheetConfig}
          />
          <NativeStack.Screen
            getComponent={() => ENSAdditionalRecordsSheet}
            name={Routes.ENS_ADDITIONAL_RECORDS_SHEET}
            {...ensAdditionalRecordsSheetConfig}
          />
          <NativeStack.Screen getComponent={() => ProfileSheet} name={Routes.PROFILE_SHEET} {...profileConfig} />
          <NativeStack.Screen getComponent={() => ProfileSheet} name={Routes.PROFILE_PREVIEW_SHEET} {...profilePreviewConfig} />
          <NativeStack.Screen
            getComponent={() => SelectENSSheet}
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
      <NativeStack.Screen getComponent={() => SendFlowNavigator} name={Routes.SEND_SHEET_NAVIGATOR} />
      <NativeStack.Screen getComponent={() => NoNeedWCSheet} name={Routes.NO_NEED_WC_SHEET} {...basicSheetConfig} />
      <NativeStack.Screen
        getComponent={() => WalletConnectApprovalSheet}
        name={Routes.WALLET_CONNECT_APPROVAL_SHEET}
        {...basicSheetConfig}
      />
      <NativeStack.Screen
        getComponent={() => WalletConnectRedirectSheet}
        name={Routes.WALLET_CONNECT_REDIRECT_SHEET}
        {...basicSheetConfig}
      />
      <NativeStack.Screen name={Routes.TRANSACTION_DETAILS} getComponent={() => TransactionDetails} {...transactionDetailsConfig} />
      <NativeStack.Screen name={Routes.OP_REWARDS_SHEET} getComponent={() => RewardsSheet} {...opRewardsSheetConfig} />
      <NativeStack.Screen name={Routes.NFT_OFFERS_SHEET} getComponent={() => NFTOffersSheet} {...nftOffersSheetConfig} />
      <NativeStack.Screen name={Routes.NFT_SINGLE_OFFER_SHEET} getComponent={() => NFTSingleOfferSheet} {...nftSingleOfferSheetConfig} />
      <NativeStack.Screen name={Routes.MINTS_SHEET} getComponent={() => MintsSheet} {...mintsSheetConfig} />
      <NativeStack.Screen getComponent={() => AppIconUnlockSheet} name={Routes.APP_ICON_UNLOCK_SHEET} {...appIconUnlockSheetConfig} />
      <NativeStack.Screen getComponent={() => NetworkSelector} name={Routes.NETWORK_SELECTOR} {...panelConfig} />
      <NativeStack.Screen getComponent={() => ControlPanel} name={Routes.DAPP_BROWSER_CONTROL_PANEL} {...panelConfig} />
      <NativeStack.Screen getComponent={() => ClaimClaimablePanel} name={Routes.CLAIM_CLAIMABLE_PANEL} {...panelConfig} />
      <NativeStack.Screen getComponent={() => RevokeDelegationPanel} name={Routes.REVOKE_DELEGATION_PANEL} {...panelConfig} />
      <NativeStack.Screen getComponent={() => SwapScreen} name={Routes.SWAP} {...swapConfig} />
      <NativeStack.Screen getComponent={() => PerpsDepositScreen} name={Routes.PERPS_DEPOSIT_SCREEN} {...perpsDepositWithdrawalConfig} />
      <NativeStack.Screen
        getComponent={() => PolymarketDepositScreen}
        name={Routes.POLYMARKET_DEPOSIT_SCREEN}
        {...perpsDepositWithdrawalConfig}
      />
      <NativeStack.Screen getComponent={() => PerpsDetailScreen} name={Routes.PERPS_DETAIL_SCREEN} {...expandedAssetSheetV2Config} />
      <NativeStack.Screen
        getComponent={() => PerpsWithdrawalScreen}
        name={Routes.PERPS_WITHDRAWAL_SCREEN}
        {...perpsDepositWithdrawalConfig}
      />
      <NativeStack.Screen
        getComponent={() => PolymarketWithdrawalScreen}
        name={Routes.POLYMARKET_WITHDRAWAL_SCREEN}
        {...perpsDepositWithdrawalConfig}
      />
      <NativeStack.Screen getComponent={() => ExpandedAssetSheetV2} name={Routes.EXPANDED_ASSET_SHEET_V2} {...expandedAssetSheetV2Config} />
      <NativeStack.Screen getComponent={() => AirdropsSheet} name={Routes.AIRDROPS_SHEET} {...airdropsSheetConfig} />
      <NativeStack.Screen getComponent={() => ClaimAirdropSheet} name={Routes.CLAIM_AIRDROP_SHEET} {...claimAirdropSheetConfig} />
      <NativeStack.Screen getComponent={() => LogSheet} name={Routes.LOG_SHEET} {...panelConfig} />
      <NativeStack.Screen getComponent={() => TokenLauncherScreen} name={Routes.TOKEN_LAUNCHER_SCREEN} {...tokenLauncherConfig} />
      <NativeStack.Screen getComponent={() => PerpsNavigator} name={Routes.PERPS_NAVIGATOR} {...perpsAccountStackConfig} />
      <NativeStack.Screen
        getComponent={() => PerpsTradeHistoryScreen}
        name={Routes.PERPS_TRADE_HISTORY_SCREEN}
        {...perpsAccountStackConfig}
      />
      <NativeStack.Screen
        getComponent={() => CreateTriggerOrderBottomSheet}
        name={Routes.CREATE_TRIGGER_ORDER_BOTTOM_SHEET}
        {...panelConfig}
      />
      <NativeStack.Screen getComponent={() => ClosePositionBottomSheet} name={Routes.CLOSE_POSITION_BOTTOM_SHEET} {...panelConfig} />
      <NativeStack.Screen getComponent={() => PerpsAddToPositionSheet} name={Routes.PERPS_ADD_TO_POSITION_SHEET} {...panelConfig} />
      <NativeStack.Screen
        getComponent={() => KingOfTheHillExplainSheet}
        name={Routes.KING_OF_THE_HILL_EXPLAIN_SHEET}
        {...learnSheetConfig}
      />
      <NativeStack.Screen getComponent={() => PerpsExplainSheet} name={Routes.PERPS_EXPLAIN_SHEET} {...perpsExplainSheetConfig} />
      <NativeStack.Screen getComponent={() => PerpsAboutSheet} name={Routes.PERPS_ABOUT_SHEET} {...panelConfig} />
      <NativeStack.Screen
        getComponent={() => PerpsTradeDetailsSheet}
        name={Routes.PERPS_TRADE_DETAILS_SHEET}
        options={({ route }) => ({
          ...panelConfig.options({ route }),
          interactWithScrollView: false,
        })}
      />
      <NativeStack.Screen
        getComponent={() => PolymarketEventScreen}
        name={Routes.POLYMARKET_EVENT_SCREEN}
        {...expandedAssetSheetV2Config}
      />
      <NativeStack.Screen
        getComponent={() => PolymarketRedeemPositionSheet}
        name={Routes.POLYMARKET_MANAGE_POSITION_SHEET}
        {...panelConfig}
      />
      <NativeStack.Screen getComponent={() => PolymarketMarketSheet} name={Routes.POLYMARKET_MARKET_SHEET} {...panelConfig} />
      <NativeStack.Screen
        getComponent={() => PolymarketMarketDescriptionSheet}
        name={Routes.POLYMARKET_MARKET_DESCRIPTION_SHEET}
        {...panelConfig}
      />
      <NativeStack.Screen getComponent={() => PolymarketNewPositionSheet} name={Routes.POLYMARKET_NEW_POSITION_SHEET} {...panelConfig} />
      <NativeStack.Screen
        getComponent={() => PolymarketAccountScreen}
        name={Routes.POLYMARKET_ACCOUNT_SCREEN}
        {...expandedAssetSheetV2Config}
      />
      <NativeStack.Screen getComponent={() => PolymarketNavigator} name={Routes.POLYMARKET_NAVIGATOR} {...perpsAccountStackConfig} />
      <NativeStack.Screen getComponent={() => PolymarketExplainSheet} name={Routes.POLYMARKET_EXPLAIN_SHEET} {...learnSheetConfig} />
      <NativeStack.Screen getComponent={() => PolymarketSellPositionSheet} name={Routes.POLYMARKET_SELL_POSITION_SHEET} {...panelConfig} />
      <NativeStack.Screen getComponent={() => RnbwAirdropScreen} name={Routes.RNBW_AIRDROP_SCREEN} {...expandedAssetSheetV2Config} />
      <NativeStack.Screen getComponent={() => RnbwRewardsClaimSheet} name={Routes.RNBW_REWARDS_CLAIM_SHEET} {...panelConfig} />
      <NativeStack.Screen getComponent={() => RnbwRewardsEstimateSheet} name={Routes.RNBW_REWARDS_ESTIMATE_SHEET} {...panelConfig} />
      <NativeStack.Screen
        getComponent={() => RnbwStakingLearnScreen}
        name={Routes.RNBW_STAKING_LEARN_SCREEN}
        {...expandedAssetSheetV2Config}
      />
      <NativeStack.Screen getComponent={() => RnbwStakingScreen} name={Routes.RNBW_STAKING_SCREEN} {...expandedAssetSheetV2Config} />
      <NativeStack.Screen getComponent={() => RnbwUnstakeSheet} name={Routes.RNBW_UNSTAKE_SHEET} {...panelConfig} />
      <NativeStack.Screen
        getComponent={() => PolymarketBrowseEventsScreen}
        name={Routes.POLYMARKET_BROWSE_EVENTS_SCREEN}
        {...expandedAssetSheetV2Config}
      />
      <NativeStack.Screen getComponent={() => WalletErrorSheet} name={Routes.WALLET_ERROR_SHEET} {...walletErrorSheetConfig} />
      <NativeStack.Screen getComponent={() => RnbwMembershipTiersSheet} name={Routes.RNBW_MEMBERSHIP_TIERS_SHEET} {...learnSheetConfig} />
    </NativeStack.Navigator>
  );
}

const AppContainerWithAnalytics = React.forwardRef<NavigationContainerRef<RootStackParamList>, { onReady: () => void }>((props, ref) => (
  <NavigationContainer onReady={props.onReady} onStateChange={onNavigationStateChange} ref={ref}>
    <NativeStackNavigator />

    {/* NOTE: Internally, these use some navigational checks */}
    <CMPortal />
  </NavigationContainer>
));

AppContainerWithAnalytics.displayName = 'AppContainerWithAnalytics';

export default React.memo(AppContainerWithAnalytics);
