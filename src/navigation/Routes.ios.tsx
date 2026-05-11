/* eslint-disable react/jsx-props-no-spreading */
import React, { useContext } from 'react';

import { NavigationContainer, type NavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import useExperimentalFlag, { PROFILES } from '@/config/experimentalHooks';
import { useShowKingOfTheHill } from '@/features/king-of-the-hill/hooks/useShowKingOfTheHill';
import createNativeStackCoolModalNavigator from '@/react-native-cool-modals/createNativeStackNavigator';
import { Portal as CMPortal } from '@/react-native-cool-modals/Portal';

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
import { InitialRouteContext } from './initialRoute';
import { nativeStackConfig } from './nativeStackConfig';
import { onNavigationStateChange } from './onNavigationStateChange';
import Routes from './routesNames';
import { type RootStackParamList } from './types';

const Stack = createStackNavigator();
const NativeStack = createNativeStackCoolModalNavigator();

function SendFlowNavigator() {
  return (
    <Stack.Navigator {...stackNavigationConfig} initialRouteName={Routes.SEND_SHEET}>
      <Stack.Screen
        getComponent={() => require('../screens/ModalScreen').default}
        name={Routes.MODAL_SCREEN}
        options={overlayExpandedPreset}
      />
      <Stack.Screen getComponent={() => require('../screens/SendSheet').default} name={Routes.SEND_SHEET} options={sheetPreset} />
    </Stack.Navigator>
  );
}

function MainNavigator() {
  const initialRoute = useContext(InitialRouteContext) as unknown as string;

  return (
    <Stack.Navigator initialRouteName={initialRoute} {...stackNavigationConfig} screenOptions={defaultScreenStackOptions}>
      <Stack.Screen getComponent={() => require('./SwipeNavigator').SwipeNavigator} name={Routes.SWIPE_LAYOUT} />
      <Stack.Screen
        getComponent={() => require('../screens/WelcomeScreen/WelcomeScreen').WelcomeScreen}
        name={Routes.WELCOME_SCREEN}
        options={{ animationEnabled: false, gestureEnabled: false }}
      />
      <Stack.Screen getComponent={() => require('../screens/AvatarBuilder').default} name={Routes.AVATAR_BUILDER} options={emojiPreset} />
      <Stack.Screen
        getComponent={() => require('../screens/AvatarBuilder').default}
        name={Routes.AVATAR_BUILDER_WALLET}
        options={emojiPresetWallet}
      />
      <Stack.Screen getComponent={() => require('../screens/AddCash').AddCashSheet} name={Routes.ADD_CASH_SHEET} options={addCashSheet} />
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
        getComponent={() => require('@/features/notifications/screens/NotificationPermissionScreen').NotificationPermissionScreen}
        name={Routes.NOTIFICATION_PERMISSION_SCREEN}
        {...notificationPermissionSheetConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('@/screens/LearnWebViewScreen').default}
        name={Routes.LEARN_WEB_VIEW_SCREEN}
        {...learnWebViewScreenConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('../screens/ReceiveModal').default}
        name={Routes.RECEIVE_MODAL}
        {...recieveModalSheetConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('../screens/SettingsSheet/SettingsSheet').SettingsSheet}
        name={Routes.SETTINGS_SHEET}
        {...settingsSheetConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('../screens/ExpandedAssetSheet').default}
        name={Routes.EXPANDED_ASSET_SHEET}
        {...expandedAssetSheetConfigWithLimit}
      />
      <NativeStack.Screen
        getComponent={() => require('@/screens/mints/PoapSheet').default}
        name={Routes.POAP_SHEET}
        {...expandedAssetSheetConfigWithLimit}
      />
      <NativeStack.Screen
        getComponent={() => require('@/screens/mints/MintSheet').default}
        name={Routes.MINT_SHEET}
        {...expandedAssetSheetConfigWithLimit}
      />
      <NativeStack.Screen
        getComponent={() => require('@/features/positions/screens/PositionSheet').PositionSheet}
        name={Routes.POSITION_SHEET}
        {...positionSheetConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('../screens/SelectUniqueTokenSheet').default}
        name={Routes.SELECT_UNIQUE_TOKEN_SHEET}
        {...expandedAssetSheetConfigWithLimit}
      />
      <NativeStack.Screen
        getComponent={() => require('../screens/SpeedUpAndCancelSheet').default}
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
        getComponent={() => require('../screens/SendConfirmationSheet').SendConfirmationSheet}
        name={Routes.SEND_CONFIRMATION_SHEET}
        {...sendConfirmationSheetConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('../screens/ExplainSheet').default}
        name={Routes.EXPLAIN_SHEET}
        {...explainSheetConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('../screens/ExternalLinkWarningSheet').default}
        name={Routes.EXTERNAL_LINK_WARNING_SHEET}
        {...externalLinkWarningSheetConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('../screens/Diagnostics').WalletDiagnosticsSheet}
        name={Routes.DIAGNOSTICS_SHEET}
        {...walletDiagnosticsSheetConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('../screens/change-wallet/ChangeWalletSheet').default}
        name={Routes.CHANGE_WALLET_SHEET}
        {...panelConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('@/features/wallet-connect/screens/ConnectedDappsSheet').default}
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
        getComponent={() => require('@/screens/CheckIdentifierScreen').default}
        name={Routes.CHECK_IDENTIFIER_SCREEN}
        {...checkIdentifierSheetConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('@/features/backup/components/BackupSheet').default}
        name={Routes.BACKUP_SHEET}
        {...backupSheetConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('../screens/ModalScreen').default}
        name={Routes.MODAL_SCREEN}
        options={{
          customStack: true,
          ignoreBottomOffset: true,
          onAppear: null,
          topOffset: 0,
        }}
      />
      <NativeStack.Screen
        getComponent={() => require('../screens/RestoreSheet').RestoreSheet}
        name={Routes.RESTORE_SHEET}
        {...restoreSheetConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('../screens/SignTransactionSheet').SignTransactionSheet}
        name={Routes.CONFIRM_REQUEST}
        {...signTransactionSheetConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('../screens/ExpandedAssetSheet').default}
        name={Routes.CUSTOM_GAS_SHEET}
        {...customGasSheetConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('@/screens/QRScannerScreen').default}
        name={Routes.QR_SCANNER_SCREEN}
        {...qrScannerConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('./PairHardwareWalletNavigator').PairHardwareWalletNavigator}
        name={Routes.PAIR_HARDWARE_WALLET_NAVIGATOR}
        {...pairHardwareWalletNavigatorConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('./HardwareWalletTxNavigator').HardwareWalletTxNavigator}
        name={Routes.HARDWARE_WALLET_TX_NAVIGATOR}
        {...hardwareWalletTxNavigatorConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('./AddWalletNavigator').AddWalletNavigator}
        name={Routes.ADD_WALLET_NAVIGATOR}
        {...addWalletNavigatorConfig}
      />
      <NativeStack.Screen getComponent={() => require('@/screens/Portal').Portal} name={Routes.PORTAL} {...portalSheetConfig} />
      {showKingOfTheHillTab && (
        <NativeStack.Screen
          getComponent={() => require('@/screens/ActivitySheetScreen').ActivitySheetScreen}
          name={Routes.PROFILE_SCREEN}
          {...activitySheetConfig}
        />
      )}
      {profilesEnabled && (
        <>
          <NativeStack.Screen
            getComponent={() => require('@/features/ens/navigation/RegisterENSNavigator').default}
            name={Routes.REGISTER_ENS_NAVIGATOR}
            {...registerENSNavigatorConfig}
          />
          <NativeStack.Screen
            getComponent={() => require('@/features/ens/screens/ENSConfirmRegisterSheet').default}
            name={Routes.ENS_CONFIRM_REGISTER_SHEET}
            {...ensConfirmRegisterSheetConfig}
          />
          <NativeStack.Screen
            getComponent={() => require('@/features/ens/screens/ENSAdditionalRecordsSheet').default}
            name={Routes.ENS_ADDITIONAL_RECORDS_SHEET}
            {...ensAdditionalRecordsSheetConfig}
          />
          <NativeStack.Screen
            getComponent={() => require('../screens/ProfileSheet').default}
            name={Routes.PROFILE_SHEET}
            {...profileConfig}
          />
          <NativeStack.Screen
            getComponent={() => require('../screens/ProfileSheet').default}
            name={Routes.PROFILE_PREVIEW_SHEET}
            {...profilePreviewConfig}
          />
          <NativeStack.Screen
            getComponent={() => require('@/features/ens/screens/SelectENSSheet').default}
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
      <NativeStack.Screen
        getComponent={() => require('../screens/NoNeedWCSheet').default}
        name={Routes.NO_NEED_WC_SHEET}
        {...basicSheetConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('../screens/WalletConnectApprovalSheet').default}
        name={Routes.WALLET_CONNECT_APPROVAL_SHEET}
        {...basicSheetConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('../screens/WalletConnectRedirectSheet').default}
        name={Routes.WALLET_CONNECT_REDIRECT_SHEET}
        {...basicSheetConfig}
      />
      <NativeStack.Screen
        name={Routes.TRANSACTION_DETAILS}
        getComponent={() => require('@/screens/transaction-details/TransactionDetails').TransactionDetails}
        {...transactionDetailsConfig}
      />
      <NativeStack.Screen
        name={Routes.OP_REWARDS_SHEET}
        getComponent={() => require('@/screens/rewards/RewardsSheet').RewardsSheet}
        {...opRewardsSheetConfig}
      />
      <NativeStack.Screen
        name={Routes.NFT_OFFERS_SHEET}
        getComponent={() => require('@/screens/NFTOffersSheet').NFTOffersSheet}
        {...nftOffersSheetConfig}
      />
      <NativeStack.Screen
        name={Routes.NFT_SINGLE_OFFER_SHEET}
        getComponent={() => require('@/screens/NFTSingleOfferSheet').NFTSingleOfferSheet}
        {...nftSingleOfferSheetConfig}
      />
      <NativeStack.Screen
        name={Routes.MINTS_SHEET}
        getComponent={() => require('@/screens/MintsSheet/MintsSheet').MintsSheet}
        {...mintsSheetConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('@/features/app-icon/screens/AppIconUnlockSheet').default}
        name={Routes.APP_ICON_UNLOCK_SHEET}
        {...appIconUnlockSheetConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('@/screens/network-selector/NetworkSelector').NetworkSelector}
        name={Routes.NETWORK_SELECTOR}
        {...panelConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('@/components/DappBrowser/control-panel/ControlPanel').ControlPanel}
        name={Routes.DAPP_BROWSER_CONTROL_PANEL}
        {...panelConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('@/screens/claimables/ClaimPanel').ClaimClaimablePanel}
        name={Routes.CLAIM_CLAIMABLE_PANEL}
        {...panelConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('@/screens/delegation/RevokeDelegationPanel').RevokeDelegationPanel}
        name={Routes.REVOKE_DELEGATION_PANEL}
        {...panelConfig}
      />
      <NativeStack.Screen getComponent={() => require('@/__swaps__/screens/Swap/Swap').SwapScreen} name={Routes.SWAP} {...swapConfig} />
      <NativeStack.Screen
        getComponent={() => require('@/features/perps/screens/perps-deposit-withdraw-screen/PerpsDepositScreen').PerpsDepositScreen}
        name={Routes.PERPS_DEPOSIT_SCREEN}
        {...perpsDepositWithdrawalConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('@/features/polymarket/funding/screens/PolymarketDepositScreen').PolymarketDepositScreen}
        name={Routes.POLYMARKET_DEPOSIT_SCREEN}
        {...perpsDepositWithdrawalConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('@/features/perps/screens/perp-detail-screen/PerpDetailScreen').PerpsDetailScreen}
        name={Routes.PERPS_DETAIL_SCREEN}
        {...expandedAssetSheetV2Config}
      />
      <NativeStack.Screen
        getComponent={() => require('@/features/perps/screens/perps-deposit-withdraw-screen/PerpsWithdrawalScreen').PerpsWithdrawalScreen}
        name={Routes.PERPS_WITHDRAWAL_SCREEN}
        {...perpsDepositWithdrawalConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('@/features/polymarket/funding/screens/PolymarketWithdrawalScreen').PolymarketWithdrawalScreen}
        name={Routes.POLYMARKET_WITHDRAWAL_SCREEN}
        {...perpsDepositWithdrawalConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('@/screens/expandedAssetSheet/ExpandedAssetSheet').ExpandedAssetSheet}
        name={Routes.EXPANDED_ASSET_SHEET_V2}
        {...expandedAssetSheetV2Config}
      />
      <NativeStack.Screen
        getComponent={() => require('@/screens/Airdrops/AirdropsSheet').AirdropsSheet}
        name={Routes.AIRDROPS_SHEET}
        {...airdropsSheetConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('@/screens/Airdrops/ClaimAirdropSheet').ClaimAirdropSheet}
        name={Routes.CLAIM_AIRDROP_SHEET}
        {...claimAirdropSheetConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('@/components/debugging/LogSheet').LogSheet}
        name={Routes.LOG_SHEET}
        {...panelConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('@/screens/token-launcher/TokenLauncherScreen').TokenLauncherScreen}
        name={Routes.TOKEN_LAUNCHER_SCREEN}
        {...tokenLauncherConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('@/features/perps/screens/PerpsNavigator').PerpsNavigator}
        name={Routes.PERPS_NAVIGATOR}
        {...perpsAccountStackConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('@/features/perps/screens/perps-trade-history/PerpsTradeHistoryScreen').PerpsTradeHistoryScreen}
        name={Routes.PERPS_TRADE_HISTORY_SCREEN}
        {...perpsAccountStackConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('@/features/perps/screens/CreateTriggerOrderBottomSheet').CreateTriggerOrderBottomSheet}
        name={Routes.CREATE_TRIGGER_ORDER_BOTTOM_SHEET}
        {...panelConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('@/features/perps/screens/ClosePositionBottomSheet').ClosePositionBottomSheet}
        name={Routes.CLOSE_POSITION_BOTTOM_SHEET}
        {...panelConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('@/features/perps/screens/perps-add-to-position-sheet/PerpsAddToPositionSheet').PerpsAddToPositionSheet}
        name={Routes.PERPS_ADD_TO_POSITION_SHEET}
        {...panelConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('@/features/king-of-the-hill/screens/KingOfTheHillExplainSheet').KingOfTheHillExplainSheet}
        name={Routes.KING_OF_THE_HILL_EXPLAIN_SHEET}
        {...learnSheetConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('@/features/perps/screens/perps-explain-sheet/PerpsExplainSheet').PerpsExplainSheet}
        name={Routes.PERPS_EXPLAIN_SHEET}
        {...perpsExplainSheetConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('@/features/perps/screens/perps-about-sheet/PerpsAboutSheet').PerpsAboutSheet}
        name={Routes.PERPS_ABOUT_SHEET}
        {...panelConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('@/features/perps/screens/perps-trade-details-sheet/PerpsTradeDetailsSheet').PerpsTradeDetailsSheet}
        name={Routes.PERPS_TRADE_DETAILS_SHEET}
        options={({ route }) => ({
          ...panelConfig.options({ route }),
          interactWithScrollView: false,
        })}
      />
      <NativeStack.Screen
        getComponent={() => require('@/features/polymarket/screens/polymarket-event-screen/PolymarketEventScreen').PolymarketEventScreen}
        name={Routes.POLYMARKET_EVENT_SCREEN}
        {...expandedAssetSheetV2Config}
      />
      <NativeStack.Screen
        getComponent={() =>
          require('@/features/polymarket/screens/polymarket-redeem-position-sheet/PolymarketRedeemPositionSheet')
            .PolymarketRedeemPositionSheet
        }
        name={Routes.POLYMARKET_MANAGE_POSITION_SHEET}
        {...panelConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('@/features/polymarket/screens/polymarket-market-sheet/PolymarketMarketSheet').PolymarketMarketSheet}
        name={Routes.POLYMARKET_MARKET_SHEET}
        {...panelConfig}
      />
      <NativeStack.Screen
        getComponent={() =>
          require('@/features/polymarket/screens/polymarket-market-description-sheet/PolymarketMarketDescriptionSheet')
            .PolymarketMarketDescriptionSheet
        }
        name={Routes.POLYMARKET_MARKET_DESCRIPTION_SHEET}
        {...panelConfig}
      />
      <NativeStack.Screen
        getComponent={() =>
          require('@/features/polymarket/screens/polymarket-new-position-sheet/PolymarketNewPositionSheet').PolymarketNewPositionSheet
        }
        name={Routes.POLYMARKET_NEW_POSITION_SHEET}
        {...panelConfig}
      />
      <NativeStack.Screen
        getComponent={() =>
          require('@/features/polymarket/screens/polymarket-account-screen/PolymarketAccountScreen').PolymarketAccountScreen
        }
        name={Routes.POLYMARKET_ACCOUNT_SCREEN}
        {...expandedAssetSheetV2Config}
      />
      <NativeStack.Screen
        getComponent={() => require('@/features/polymarket/screens/polymarket-navigator/PolymarketNavigator').PolymarketNavigator}
        name={Routes.POLYMARKET_NAVIGATOR}
        {...perpsAccountStackConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('@/features/polymarket/screens/polymarket-learn-sheet/PolymarketExplainSheet').PolymarketExplainSheet}
        name={Routes.POLYMARKET_EXPLAIN_SHEET}
        {...learnSheetConfig}
      />
      <NativeStack.Screen
        getComponent={() =>
          require('@/features/polymarket/screens/polymarket-sell-position-sheet/PolymarketSellPositionSheet').PolymarketSellPositionSheet
        }
        name={Routes.POLYMARKET_SELL_POSITION_SHEET}
        {...panelConfig}
      />
      <NativeStack.Screen
        getComponent={() => require('@/features/rnbw-airdrop/screens/rnbw-airdrop-screen/RnbwAirdropScreen').RnbwAirdropScreen}
        name={Routes.RNBW_AIRDROP_SCREEN}
        {...expandedAssetSheetV2Config}
      />
      <NativeStack.Screen
        getComponent={() => require('@/features/rnbw-rewards/screens/rnbw-rewards-claim-sheet/RnbwRewardsClaimSheet').RnbwRewardsClaimSheet}
        name={Routes.RNBW_REWARDS_CLAIM_SHEET}
        {...panelConfig}
      />
      <NativeStack.Screen
        getComponent={() =>
          require('@/features/rnbw-rewards/screens/rnbw-rewards-estimate-sheet/RnbwRewardsEstimateSheet').RnbwRewardsEstimateSheet
        }
        name={Routes.RNBW_REWARDS_ESTIMATE_SHEET}
        {...panelConfig}
      />
      <NativeStack.Screen
        getComponent={() =>
          require('@/features/rnbw-staking/screens/rnbw-staking-learn-screen/RnbwStakingLearnScreen').RnbwStakingLearnScreen
        }
        name={Routes.RNBW_STAKING_LEARN_SCREEN}
        {...expandedAssetSheetV2Config}
      />
      <NativeStack.Screen
        getComponent={() => require('@/features/rnbw-staking/screens/rnbw-staking-screen/RnbwStakingScreen').RnbwStakingScreen}
        name={Routes.RNBW_STAKING_SCREEN}
        {...expandedAssetSheetV2Config}
      />
      <NativeStack.Screen
        getComponent={() => require('@/features/rnbw-staking/screens/rnbw-unstake-sheet/RnbwUnstakeSheet').RnbwUnstakeSheet}
        name={Routes.RNBW_UNSTAKE_SHEET}
        {...panelConfig}
      />
      <NativeStack.Screen
        getComponent={() =>
          require('@/features/polymarket/screens/polymarket-browse-events-screen/PolymarketBrowseEventsScreen').PolymarketBrowseEventsScreen
        }
        name={Routes.POLYMARKET_BROWSE_EVENTS_SCREEN}
        {...expandedAssetSheetV2Config}
      />
      <NativeStack.Screen
        getComponent={() => require('@/components/wallet-error/WalletErrorSheet').default}
        name={Routes.WALLET_ERROR_SHEET}
        {...walletErrorSheetConfig}
      />
      <NativeStack.Screen
        getComponent={() =>
          require('@/features/rnbw-membership/screens/rnbw-membership-tiers-sheet/RnbwMembershipTiersSheet').RnbwMembershipTiersSheet
        }
        name={Routes.RNBW_MEMBERSHIP_TIERS_SHEET}
        {...learnSheetConfig}
      />
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
