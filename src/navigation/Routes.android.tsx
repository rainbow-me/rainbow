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
import walletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import { Portal as CMPortal } from '@/react-native-cool-modals/Portal';
import { ActivitySheetScreen } from '@/screens/ActivitySheetScreen';
import { AirdropsSheet } from '@/screens/Airdrops/AirdropsSheet';
import { ClaimAirdropSheet } from '@/screens/Airdrops/ClaimAirdropSheet';
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
import ShowSecretView from '@/screens/SettingsSheet/components/Backups/ShowSecretView';
import { SettingsSheet } from '@/screens/SettingsSheet/SettingsSheet';
import { SignTransactionSheet } from '@/screens/SignTransactionSheet';
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
import PinAuthenticationScreen from '../screens/PinAuthenticationScreen';
import ProfileSheet from '../screens/ProfileSheet';
import ReceiveModal from '../screens/ReceiveModal';
import { RestoreSheet } from '../screens/RestoreSheet';
import SelectUniqueTokenSheet from '../screens/SelectUniqueTokenSheet';
import { SendConfirmationSheet } from '../screens/SendConfirmationSheet';
import SendSheet from '../screens/SendSheet';
import SpeedUpAndCancelSheet from '../screens/SpeedUpAndCancelSheet';
import WalletConnectApprovalSheet from '../screens/WalletConnectApprovalSheet';
import WalletConnectRedirectSheet from '../screens/WalletConnectRedirectSheet';
import { WelcomeScreen } from '../screens/WelcomeScreen/WelcomeScreen';
import { AddWalletNavigator } from './AddWalletNavigator';
import { createBottomSheetNavigator } from './bottom-sheet/createBottomSheetNavigator';
import {
  backupSheetSizes,
  closeKeyboardOnClose,
  defaultScreenStackOptions,
  learnWebViewScreenConfig,
  stackNavigationConfig,
} from './config';
import {
  addCashSheet,
  addWalletNavigatorPreset,
  androidRecievePreset,
  appIconUnlockSheetPreset,
  bottomSheetPreset,
  emojiPreset,
  exchangePreset,
  expandedPreset,
  expandedPresetWithSmallGestureResponseDistance,
  hardwareWalletTxNavigatorPreset,
  nftSingleOfferSheetPreset,
  sheetPreset,
  speedUpAndCancelStyleInterpolator,
  swapSheetPreset,
  tokenLauncherSheetPreset,
  walletconnectBottomSheetPreset,
  wcPromptPreset,
} from './effects';
import { HardwareWalletTxNavigator } from './HardwareWalletTxNavigator';
import { InitialRouteContext } from './initialRoute';
import { onNavigationStateChange } from './onNavigationStateChange';
import { PairHardwareWalletNavigator } from './PairHardwareWalletNavigator';
import Routes from './routesNames';
import { SwipeNavigator } from './SwipeNavigator';
import { type RootStackParamList } from './types';

const Stack = createStackNavigator();
const OuterStack = createStackNavigator();
const AuthStack = createStackNavigator();
const BSStack = createBottomSheetNavigator();

function MainNavigator() {
  const initialRoute = useContext(InitialRouteContext) as unknown as string;
  return (
    <Stack.Navigator initialRouteName={initialRoute} {...stackNavigationConfig} screenOptions={defaultScreenStackOptions}>
      <Stack.Screen getComponent={() => SwipeNavigator} name={Routes.SWIPE_LAYOUT} options={expandedPreset} />
      <Stack.Screen getComponent={() => AvatarBuilder} name={Routes.AVATAR_BUILDER} options={emojiPreset} />
      <Stack.Screen getComponent={() => ConnectedDappsSheet} name={Routes.CONNECTED_DAPPS} options={expandedPreset} />
      <Stack.Screen getComponent={() => Portal} name={Routes.PORTAL} options={expandedPreset} />
      <Stack.Screen getComponent={() => PositionSheet} name={Routes.POSITION_SHEET} options={expandedPreset} />
      <Stack.Screen
        getComponent={() => SpeedUpAndCancelSheet}
        name={Routes.SPEED_UP_AND_CANCEL_SHEET}
        options={{
          ...exchangePreset,
          cardStyleInterpolator: speedUpAndCancelStyleInterpolator,
        }}
      />
      <Stack.Screen getComponent={() => ReceiveModal} name={Routes.RECEIVE_MODAL} options={androidRecievePreset} />

      <Stack.Screen getComponent={() => WalletConnectRedirectSheet} name={Routes.WALLET_CONNECT_REDIRECT_SHEET} options={wcPromptPreset} />
      <Stack.Screen getComponent={() => AddCashSheet} name={Routes.ADD_CASH_SHEET} options={addCashSheet} />
      <Stack.Screen getComponent={() => RestoreSheet} name={Routes.RESTORE_SHEET} options={bottomSheetPreset} />
      <Stack.Screen
        getComponent={() => WelcomeScreen}
        name={Routes.WELCOME_SCREEN}
        options={{ animationEnabled: false, gestureEnabled: false }}
      />
      <Stack.Screen getComponent={() => ShowSecretView} name="ShowSecretView" options={bottomSheetPreset} />
      <Stack.Screen
        getComponent={() => WalletConnectApprovalSheet}
        name={Routes.WALLET_CONNECT_APPROVAL_SHEET}
        options={bottomSheetPreset}
      />
    </Stack.Navigator>
  );
}

// FIXME do it in one navigator
function MainOuterNavigator() {
  return (
    <OuterStack.Navigator initialRouteName={Routes.MAIN_NAVIGATOR} {...stackNavigationConfig} screenOptions={defaultScreenStackOptions}>
      <OuterStack.Screen getComponent={() => MainNavigator} name={Routes.MAIN_NAVIGATOR} />
    </OuterStack.Navigator>
  );
}

function BSNavigator() {
  const profilesEnabled = useExperimentalFlag(PROFILES);
  const showKingOfTheHillTab = useShowKingOfTheHill();

  return (
    <BSStack.Navigator>
      <BSStack.Screen getComponent={() => MainOuterNavigator} name={Routes.MAIN_NAVIGATOR_WRAPPER} />
      <BSStack.Screen
        getComponent={() => NotificationPermissionScreen}
        name={Routes.NOTIFICATION_PERMISSION_SCREEN}
        options={{
          ...bottomSheetPreset,
          backdropOpacity: 1,
          backdropPressBehavior: 'none',
          enableContentPanningGesture: false,
          enableHandlePanningGesture: false,
          enablePanDownToClose: false,
          height: '100%',
        }}
      />
      <BSStack.Screen getComponent={() => LearnWebViewScreen} name={Routes.LEARN_WEB_VIEW_SCREEN} {...learnWebViewScreenConfig} />
      <BSStack.Screen getComponent={() => ExpandedAssetSheet} name={Routes.EXPANDED_ASSET_SHEET} />
      <BSStack.Screen getComponent={() => PoapSheet} name={Routes.POAP_SHEET} />
      <BSStack.Screen getComponent={() => MintSheet} name={Routes.MINT_SHEET} />
      <BSStack.Screen getComponent={() => QRScannerScreen} name={Routes.QR_SCANNER_SCREEN} />
      <BSStack.Screen getComponent={() => AddWalletNavigator} name={Routes.ADD_WALLET_NAVIGATOR} options={addWalletNavigatorPreset} />
      <BSStack.Screen
        getComponent={() => PairHardwareWalletNavigator}
        name={Routes.PAIR_HARDWARE_WALLET_NAVIGATOR}
        options={{
          backdropOpacity: 1,
        }}
      />
      <BSStack.Screen
        getComponent={() => HardwareWalletTxNavigator}
        name={Routes.HARDWARE_WALLET_TX_NAVIGATOR}
        options={hardwareWalletTxNavigatorPreset}
      />
      {showKingOfTheHillTab && (
        <BSStack.Screen
          getComponent={() => ActivitySheetScreen}
          name={Routes.PROFILE_SCREEN}
          options={{
            ...bottomSheetPreset,
            snapPoints: ['88%'],
          }}
        />
      )}
      {profilesEnabled && (
        <>
          <BSStack.Screen getComponent={() => ENSConfirmRegisterSheet} name={Routes.ENS_CONFIRM_REGISTER_SHEET} />
          <BSStack.Screen getComponent={() => RegisterENSNavigator} name={Routes.REGISTER_ENS_NAVIGATOR} />
          <BSStack.Screen getComponent={() => ENSAdditionalRecordsSheet} name={Routes.ENS_ADDITIONAL_RECORDS_SHEET} />
          <BSStack.Screen getComponent={() => SelectENSSheet} name={Routes.SELECT_ENS_SHEET} />
          <BSStack.Screen getComponent={() => ProfileSheet} name={Routes.PROFILE_SHEET} />
          <BSStack.Screen getComponent={() => ProfileSheet} name={Routes.PROFILE_PREVIEW_SHEET} />
          <BSStack.Screen
            getComponent={() => SelectUniqueTokenSheet}
            name={Routes.SELECT_UNIQUE_TOKEN_SHEET}
            options={{ ...bottomSheetPreset, height: '95%' }}
          />
          <BSStack.Screen getComponent={() => SpeedUpAndCancelSheet} name={Routes.SPEED_UP_AND_CANCEL_BOTTOM_SHEET} />
        </>
      )}
      <BSStack.Screen getComponent={() => ExplainSheet} name={Routes.EXPLAIN_SHEET} options={bottomSheetPreset} />
      <BSStack.Screen getComponent={() => ExternalLinkWarningSheet} name={Routes.EXTERNAL_LINK_WARNING_SHEET} options={bottomSheetPreset} />
      <BSStack.Screen getComponent={() => ModalScreen} {...closeKeyboardOnClose} name={Routes.MODAL_SCREEN} />
      <BSStack.Screen getComponent={() => SendConfirmationSheet} name={Routes.SEND_CONFIRMATION_SHEET} options={sheetPreset} />
      <BSStack.Screen
        getComponent={() => ExpandedAssetSheet}
        name={Routes.CUSTOM_GAS_SHEET}
        options={{
          backdropOpacity: 1,
        }}
      />
      <BSStack.Screen
        getComponent={() => BackupSheet}
        name={Routes.BACKUP_SHEET}
        options={route => {
          const { params: { step } = {} as any } = route.route;

          let heightForStep = backupSheetSizes.short;
          if (step === walletBackupStepTypes.create_cloud_backup || step === walletBackupStepTypes.restore_from_backup) {
            heightForStep = backupSheetSizes.long;
          } else if (step === walletBackupStepTypes.backup_prompt) {
            heightForStep = backupSheetSizes.medium;
          }

          return { ...bottomSheetPreset, height: heightForStep };
        }}
      />
      <BSStack.Screen getComponent={() => WalletDiagnosticsSheet} name={Routes.DIAGNOSTICS_SHEET} options={{ ...bottomSheetPreset }} />
      <BSStack.Screen getComponent={() => SettingsSheet} name={Routes.SETTINGS_SHEET} options={bottomSheetPreset} />
      <BSStack.Screen
        name={Routes.TRANSACTION_DETAILS}
        getComponent={() => TransactionDetails}
        // @ts-ignore
        options={{ ...bottomSheetPreset, scrollEnabled: false }}
      />
      <BSStack.Screen name={Routes.OP_REWARDS_SHEET} getComponent={() => RewardsSheet} options={{ ...bottomSheetPreset }} />
      <BSStack.Screen name={Routes.NFT_OFFERS_SHEET} getComponent={() => NFTOffersSheet} options={{ ...bottomSheetPreset }} />
      <BSStack.Screen name={Routes.NFT_SINGLE_OFFER_SHEET} getComponent={() => NFTSingleOfferSheet} options={nftSingleOfferSheetPreset} />
      <BSStack.Screen name={Routes.MINTS_SHEET} getComponent={() => MintsSheet} />
      <BSStack.Screen getComponent={() => SignTransactionSheet} name={Routes.CONFIRM_REQUEST} options={walletconnectBottomSheetPreset} />
      <BSStack.Screen getComponent={() => AppIconUnlockSheet} name={Routes.APP_ICON_UNLOCK_SHEET} options={appIconUnlockSheetPreset} />
      <BSStack.Screen getComponent={() => ControlPanel} name={Routes.DAPP_BROWSER_CONTROL_PANEL} />
      <BSStack.Screen getComponent={() => NetworkSelector} name={Routes.NETWORK_SELECTOR} />
      <BSStack.Screen getComponent={() => ClaimClaimablePanel} name={Routes.CLAIM_CLAIMABLE_PANEL} />
      <BSStack.Screen getComponent={() => RevokeDelegationPanel} name={Routes.REVOKE_DELEGATION_PANEL} />
      <BSStack.Screen getComponent={() => ChangeWalletSheet} name={Routes.CHANGE_WALLET_SHEET} options={{ ...bottomSheetPreset }} />
      <BSStack.Screen getComponent={() => SwapScreen} name={Routes.SWAP} options={swapSheetPreset} />
      <BSStack.Screen getComponent={() => PerpsDepositScreen} name={Routes.PERPS_DEPOSIT_SCREEN} {...swapSheetPreset} />
      <BSStack.Screen getComponent={() => PolymarketDepositScreen} name={Routes.POLYMARKET_DEPOSIT_SCREEN} {...swapSheetPreset} />
      <BSStack.Screen getComponent={() => PerpsWithdrawalScreen} name={Routes.PERPS_WITHDRAWAL_SCREEN} {...swapSheetPreset} />
      <BSStack.Screen getComponent={() => PolymarketWithdrawalScreen} name={Routes.POLYMARKET_WITHDRAWAL_SCREEN} {...swapSheetPreset} />
      <BSStack.Screen
        getComponent={() => SendSheet}
        name={Routes.SEND_SHEET_NAVIGATOR}
        options={expandedPresetWithSmallGestureResponseDistance}
      />
      <BSStack.Screen getComponent={() => ExpandedAssetSheetV2} name={Routes.EXPANDED_ASSET_SHEET_V2} />
      <BSStack.Screen getComponent={() => PerpsDetailScreen} name={Routes.PERPS_DETAIL_SCREEN} />
      <BSStack.Screen getComponent={() => AirdropsSheet} name={Routes.AIRDROPS_SHEET} />
      <BSStack.Screen getComponent={() => ClaimAirdropSheet} name={Routes.CLAIM_AIRDROP_SHEET} />
      <BSStack.Screen getComponent={() => LogSheet} name={Routes.LOG_SHEET} />
      <BSStack.Screen getComponent={() => TokenLauncherScreen} name={Routes.TOKEN_LAUNCHER_SCREEN} options={tokenLauncherSheetPreset} />
      <BSStack.Screen getComponent={() => PerpsNavigator} name={Routes.PERPS_NAVIGATOR} />
      <BSStack.Screen getComponent={() => PerpsTradeHistoryScreen} name={Routes.PERPS_TRADE_HISTORY_SCREEN} />
      <BSStack.Screen getComponent={() => CreateTriggerOrderBottomSheet} name={Routes.CREATE_TRIGGER_ORDER_BOTTOM_SHEET} />
      <BSStack.Screen getComponent={() => ClosePositionBottomSheet} name={Routes.CLOSE_POSITION_BOTTOM_SHEET} />
      <BSStack.Screen getComponent={() => KingOfTheHillExplainSheet} name={Routes.KING_OF_THE_HILL_EXPLAIN_SHEET} />
      <BSStack.Screen getComponent={() => PerpsExplainSheet} name={Routes.PERPS_EXPLAIN_SHEET} />
      <BSStack.Screen getComponent={() => PerpsAddToPositionSheet} name={Routes.PERPS_ADD_TO_POSITION_SHEET} />
      <BSStack.Screen getComponent={() => PerpsAboutSheet} name={Routes.PERPS_ABOUT_SHEET} />
      <BSStack.Screen getComponent={() => PerpsTradeDetailsSheet} name={Routes.PERPS_TRADE_DETAILS_SHEET} />
      <BSStack.Screen getComponent={() => PolymarketEventScreen} name={Routes.POLYMARKET_EVENT_SCREEN} />
      <BSStack.Screen getComponent={() => PolymarketRedeemPositionSheet} name={Routes.POLYMARKET_MANAGE_POSITION_SHEET} />
      <BSStack.Screen getComponent={() => PolymarketMarketSheet} name={Routes.POLYMARKET_MARKET_SHEET} />
      <BSStack.Screen getComponent={() => PolymarketMarketDescriptionSheet} name={Routes.POLYMARKET_MARKET_DESCRIPTION_SHEET} />
      <BSStack.Screen getComponent={() => PolymarketNewPositionSheet} name={Routes.POLYMARKET_NEW_POSITION_SHEET} />
      <BSStack.Screen getComponent={() => PolymarketAccountScreen} name={Routes.POLYMARKET_ACCOUNT_SCREEN} />
      <BSStack.Screen getComponent={() => PolymarketNavigator} name={Routes.POLYMARKET_NAVIGATOR} />
      <BSStack.Screen getComponent={() => PolymarketExplainSheet} name={Routes.POLYMARKET_EXPLAIN_SHEET} />
      <BSStack.Screen getComponent={() => PolymarketBrowseEventsScreen} name={Routes.POLYMARKET_BROWSE_EVENTS_SCREEN} />
      <BSStack.Screen getComponent={() => PolymarketSellPositionSheet} name={Routes.POLYMARKET_SELL_POSITION_SHEET} />
      <BSStack.Screen getComponent={() => RnbwAirdropScreen} name={Routes.RNBW_AIRDROP_SCREEN} />
      <BSStack.Screen getComponent={() => RnbwRewardsClaimSheet} name={Routes.RNBW_REWARDS_CLAIM_SHEET} />
      <BSStack.Screen getComponent={() => RnbwRewardsEstimateSheet} name={Routes.RNBW_REWARDS_ESTIMATE_SHEET} />
      <BSStack.Screen getComponent={() => RnbwStakingLearnScreen} name={Routes.RNBW_STAKING_LEARN_SCREEN} />
      <BSStack.Screen getComponent={() => RnbwStakingScreen} name={Routes.RNBW_STAKING_SCREEN} />
      <BSStack.Screen getComponent={() => RnbwUnstakeSheet} name={Routes.RNBW_UNSTAKE_SHEET} />
      <BSStack.Screen getComponent={() => WalletErrorSheet} name={Routes.WALLET_ERROR_SHEET} />
      <BSStack.Screen getComponent={() => RnbwMembershipTiersSheet} name={Routes.RNBW_MEMBERSHIP_TIERS_SHEET} />
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
      <AuthStack.Screen getComponent={() => BSNavigator} name={Routes.MAIN_NATIVE_BOTTOM_SHEET_NAVIGATOR} />
      <AuthStack.Screen
        getComponent={() => PinAuthenticationScreen}
        name={Routes.PIN_AUTHENTICATION_SCREEN}
        options={{ ...sheetPreset, gestureEnabled: false }}
      />
    </AuthStack.Navigator>
  );
}

const AppContainerWithAnalytics = React.forwardRef<NavigationContainerRef<RootStackParamList>, { onReady: () => void }>((props, ref) => (
  <NavigationContainer onReady={props.onReady} onStateChange={onNavigationStateChange} ref={ref}>
    <AuthNavigator />

    {/* NOTE: Internally, these use some navigational checks */}
    <CMPortal />
  </NavigationContainer>
));

AppContainerWithAnalytics.displayName = 'AppContainerWithAnalytics';

export default React.memo(AppContainerWithAnalytics);
