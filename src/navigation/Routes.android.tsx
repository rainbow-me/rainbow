/* eslint-disable react/jsx-props-no-spreading */
import React, { useContext } from 'react';

import { NavigationContainer, type NavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import useExperimentalFlag, { PROFILES } from '@/config/experimentalHooks';
import { useShowKingOfTheHill } from '@/features/king-of-the-hill/hooks/useShowKingOfTheHill';
import walletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import { Portal as CMPortal } from '@/react-native-cool-modals/Portal';

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
import { InitialRouteContext } from './initialRoute';
import { onNavigationStateChange } from './onNavigationStateChange';
import Routes from './routesNames';
import { type RootStackParamList } from './types';

const Stack = createStackNavigator();
const OuterStack = createStackNavigator();
const AuthStack = createStackNavigator();
const BSStack = createBottomSheetNavigator();

function MainNavigator() {
  const initialRoute = useContext(InitialRouteContext) as unknown as string;
  return (
    <Stack.Navigator initialRouteName={initialRoute} {...stackNavigationConfig} screenOptions={defaultScreenStackOptions}>
      <Stack.Screen getComponent={() => require('./SwipeNavigator').SwipeNavigator} name={Routes.SWIPE_LAYOUT} options={expandedPreset} />
      <Stack.Screen getComponent={() => require('../screens/AvatarBuilder').default} name={Routes.AVATAR_BUILDER} options={emojiPreset} />
      <Stack.Screen
        getComponent={() => require('@/features/wallet-connect/screens/ConnectedDappsSheet').default}
        name={Routes.CONNECTED_DAPPS}
        options={expandedPreset}
      />
      <Stack.Screen getComponent={() => require('@/screens/Portal').Portal} name={Routes.PORTAL} options={expandedPreset} />
      <Stack.Screen
        getComponent={() => require('@/features/positions/screens/PositionSheet').PositionSheet}
        name={Routes.POSITION_SHEET}
        options={expandedPreset}
      />
      <Stack.Screen
        getComponent={() => require('../screens/SpeedUpAndCancelSheet').default}
        name={Routes.SPEED_UP_AND_CANCEL_SHEET}
        options={{
          ...exchangePreset,
          cardStyleInterpolator: speedUpAndCancelStyleInterpolator,
        }}
      />
      <Stack.Screen
        getComponent={() => require('../screens/ReceiveModal').default}
        name={Routes.RECEIVE_MODAL}
        options={androidRecievePreset}
      />

      <Stack.Screen
        getComponent={() => require('../screens/WalletConnectRedirectSheet').default}
        name={Routes.WALLET_CONNECT_REDIRECT_SHEET}
        options={wcPromptPreset}
      />
      <Stack.Screen getComponent={() => require('../screens/AddCash').AddCashSheet} name={Routes.ADD_CASH_SHEET} options={addCashSheet} />
      <Stack.Screen
        getComponent={() => require('../screens/RestoreSheet').RestoreSheet}
        name={Routes.RESTORE_SHEET}
        options={bottomSheetPreset}
      />
      <Stack.Screen
        getComponent={() => require('../screens/WelcomeScreen/WelcomeScreen').WelcomeScreen}
        name={Routes.WELCOME_SCREEN}
        options={{ animationEnabled: false, gestureEnabled: false }}
      />
      <Stack.Screen
        getComponent={() => require('@/screens/SettingsSheet/components/Backups/ShowSecretView').default}
        name="ShowSecretView"
        options={bottomSheetPreset}
      />
      <Stack.Screen
        getComponent={() => require('../screens/WalletConnectApprovalSheet').default}
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
        getComponent={() => require('@/features/notifications/screens/NotificationPermissionScreen').NotificationPermissionScreen}
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
      <BSStack.Screen
        getComponent={() => require('@/screens/LearnWebViewScreen').default}
        name={Routes.LEARN_WEB_VIEW_SCREEN}
        {...learnWebViewScreenConfig}
      />
      <BSStack.Screen getComponent={() => require('../screens/ExpandedAssetSheet').default} name={Routes.EXPANDED_ASSET_SHEET} />
      <BSStack.Screen getComponent={() => require('@/screens/mints/PoapSheet').default} name={Routes.POAP_SHEET} />
      <BSStack.Screen getComponent={() => require('@/screens/mints/MintSheet').default} name={Routes.MINT_SHEET} />
      <BSStack.Screen getComponent={() => require('@/screens/QRScannerScreen').default} name={Routes.QR_SCANNER_SCREEN} />
      <BSStack.Screen
        getComponent={() => require('./AddWalletNavigator').AddWalletNavigator}
        name={Routes.ADD_WALLET_NAVIGATOR}
        options={addWalletNavigatorPreset}
      />
      <BSStack.Screen
        getComponent={() => require('./PairHardwareWalletNavigator').PairHardwareWalletNavigator}
        name={Routes.PAIR_HARDWARE_WALLET_NAVIGATOR}
        options={{
          backdropOpacity: 1,
        }}
      />
      <BSStack.Screen
        getComponent={() => require('./HardwareWalletTxNavigator').HardwareWalletTxNavigator}
        name={Routes.HARDWARE_WALLET_TX_NAVIGATOR}
        options={hardwareWalletTxNavigatorPreset}
      />
      {showKingOfTheHillTab && (
        <BSStack.Screen
          getComponent={() => require('@/screens/ActivitySheetScreen').ActivitySheetScreen}
          name={Routes.PROFILE_SCREEN}
          options={{
            ...bottomSheetPreset,
            snapPoints: ['88%'],
          }}
        />
      )}
      {profilesEnabled && (
        <>
          <BSStack.Screen
            getComponent={() => require('@/features/ens/screens/ENSConfirmRegisterSheet').default}
            name={Routes.ENS_CONFIRM_REGISTER_SHEET}
          />
          <BSStack.Screen
            getComponent={() => require('@/features/ens/navigation/RegisterENSNavigator').default}
            name={Routes.REGISTER_ENS_NAVIGATOR}
          />
          <BSStack.Screen
            getComponent={() => require('@/features/ens/screens/ENSAdditionalRecordsSheet').default}
            name={Routes.ENS_ADDITIONAL_RECORDS_SHEET}
          />
          <BSStack.Screen getComponent={() => require('@/features/ens/screens/SelectENSSheet').default} name={Routes.SELECT_ENS_SHEET} />
          <BSStack.Screen getComponent={() => require('../screens/ProfileSheet').default} name={Routes.PROFILE_SHEET} />
          <BSStack.Screen getComponent={() => require('../screens/ProfileSheet').default} name={Routes.PROFILE_PREVIEW_SHEET} />
          <BSStack.Screen
            getComponent={() => require('../screens/SelectUniqueTokenSheet').default}
            name={Routes.SELECT_UNIQUE_TOKEN_SHEET}
            options={{ ...bottomSheetPreset, height: '95%' }}
          />
          <BSStack.Screen
            getComponent={() => require('../screens/SpeedUpAndCancelSheet').default}
            name={Routes.SPEED_UP_AND_CANCEL_BOTTOM_SHEET}
          />
        </>
      )}
      <BSStack.Screen
        getComponent={() => require('../screens/ExplainSheet').default}
        name={Routes.EXPLAIN_SHEET}
        options={bottomSheetPreset}
      />
      <BSStack.Screen
        getComponent={() => require('../screens/ExternalLinkWarningSheet').default}
        name={Routes.EXTERNAL_LINK_WARNING_SHEET}
        options={bottomSheetPreset}
      />
      <BSStack.Screen getComponent={() => require('../screens/ModalScreen').default} {...closeKeyboardOnClose} name={Routes.MODAL_SCREEN} />
      <BSStack.Screen
        getComponent={() => require('../screens/SendConfirmationSheet').SendConfirmationSheet}
        name={Routes.SEND_CONFIRMATION_SHEET}
        options={sheetPreset}
      />
      <BSStack.Screen
        getComponent={() => require('../screens/ExpandedAssetSheet').default}
        name={Routes.CUSTOM_GAS_SHEET}
        options={{
          backdropOpacity: 1,
        }}
      />
      <BSStack.Screen
        getComponent={() => require('@/features/backup/components/BackupSheet').default}
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
      <BSStack.Screen
        getComponent={() => require('../screens/Diagnostics').WalletDiagnosticsSheet}
        name={Routes.DIAGNOSTICS_SHEET}
        options={{ ...bottomSheetPreset }}
      />
      <BSStack.Screen
        getComponent={() => require('@/screens/SettingsSheet/SettingsSheet').SettingsSheet}
        name={Routes.SETTINGS_SHEET}
        options={bottomSheetPreset}
      />
      <BSStack.Screen
        name={Routes.TRANSACTION_DETAILS}
        getComponent={() => require('@/screens/transaction-details/TransactionDetails').TransactionDetails}
        // @ts-ignore
        options={{ ...bottomSheetPreset, scrollEnabled: false }}
      />
      <BSStack.Screen
        name={Routes.OP_REWARDS_SHEET}
        getComponent={() => require('@/screens/rewards/RewardsSheet').RewardsSheet}
        options={{ ...bottomSheetPreset }}
      />
      <BSStack.Screen
        name={Routes.NFT_OFFERS_SHEET}
        getComponent={() => require('@/screens/NFTOffersSheet').NFTOffersSheet}
        options={{ ...bottomSheetPreset }}
      />
      <BSStack.Screen
        name={Routes.NFT_SINGLE_OFFER_SHEET}
        getComponent={() => require('@/screens/NFTSingleOfferSheet').NFTSingleOfferSheet}
        options={nftSingleOfferSheetPreset}
      />
      <BSStack.Screen name={Routes.MINTS_SHEET} getComponent={() => require('@/screens/MintsSheet/MintsSheet').MintsSheet} />
      <BSStack.Screen
        getComponent={() => require('@/screens/SignTransactionSheet').SignTransactionSheet}
        name={Routes.CONFIRM_REQUEST}
        options={walletconnectBottomSheetPreset}
      />
      <BSStack.Screen
        getComponent={() => require('@/features/app-icon/screens/AppIconUnlockSheet').default}
        name={Routes.APP_ICON_UNLOCK_SHEET}
        options={appIconUnlockSheetPreset}
      />
      <BSStack.Screen
        getComponent={() => require('@/components/DappBrowser/control-panel/ControlPanel').ControlPanel}
        name={Routes.DAPP_BROWSER_CONTROL_PANEL}
      />
      <BSStack.Screen
        getComponent={() => require('@/screens/network-selector/NetworkSelector').NetworkSelector}
        name={Routes.NETWORK_SELECTOR}
      />
      <BSStack.Screen
        getComponent={() => require('@/screens/claimables/ClaimPanel').ClaimClaimablePanel}
        name={Routes.CLAIM_CLAIMABLE_PANEL}
      />
      <BSStack.Screen
        getComponent={() => require('@/screens/delegation/RevokeDelegationPanel').RevokeDelegationPanel}
        name={Routes.REVOKE_DELEGATION_PANEL}
      />
      <BSStack.Screen
        getComponent={() => require('../screens/change-wallet/ChangeWalletSheet').default}
        name={Routes.CHANGE_WALLET_SHEET}
        options={{ ...bottomSheetPreset }}
      />
      <BSStack.Screen
        getComponent={() => require('@/__swaps__/screens/Swap/Swap').SwapScreen}
        name={Routes.SWAP}
        options={swapSheetPreset}
      />
      <BSStack.Screen
        getComponent={() => require('@/features/perps/screens/perps-deposit-withdraw-screen/PerpsDepositScreen').PerpsDepositScreen}
        name={Routes.PERPS_DEPOSIT_SCREEN}
        {...swapSheetPreset}
      />
      <BSStack.Screen
        getComponent={() => require('@/features/polymarket/funding/screens/PolymarketDepositScreen').PolymarketDepositScreen}
        name={Routes.POLYMARKET_DEPOSIT_SCREEN}
        {...swapSheetPreset}
      />
      <BSStack.Screen
        getComponent={() => require('@/features/perps/screens/perps-deposit-withdraw-screen/PerpsWithdrawalScreen').PerpsWithdrawalScreen}
        name={Routes.PERPS_WITHDRAWAL_SCREEN}
        {...swapSheetPreset}
      />
      <BSStack.Screen
        getComponent={() => require('@/features/polymarket/funding/screens/PolymarketWithdrawalScreen').PolymarketWithdrawalScreen}
        name={Routes.POLYMARKET_WITHDRAWAL_SCREEN}
        {...swapSheetPreset}
      />
      <BSStack.Screen
        getComponent={() => require('../screens/SendSheet').default}
        name={Routes.SEND_SHEET_NAVIGATOR}
        options={expandedPresetWithSmallGestureResponseDistance}
      />
      <BSStack.Screen
        getComponent={() => require('@/screens/expandedAssetSheet/ExpandedAssetSheet').ExpandedAssetSheet}
        name={Routes.EXPANDED_ASSET_SHEET_V2}
      />
      <BSStack.Screen
        getComponent={() => require('@/features/perps/screens/perp-detail-screen/PerpDetailScreen').PerpsDetailScreen}
        name={Routes.PERPS_DETAIL_SCREEN}
      />
      <BSStack.Screen getComponent={() => require('@/screens/Airdrops/AirdropsSheet').AirdropsSheet} name={Routes.AIRDROPS_SHEET} />
      <BSStack.Screen
        getComponent={() => require('@/screens/Airdrops/ClaimAirdropSheet').ClaimAirdropSheet}
        name={Routes.CLAIM_AIRDROP_SHEET}
      />
      <BSStack.Screen getComponent={() => require('@/components/debugging/LogSheet').LogSheet} name={Routes.LOG_SHEET} />
      <BSStack.Screen
        getComponent={() => require('@/screens/token-launcher/TokenLauncherScreen').TokenLauncherScreen}
        name={Routes.TOKEN_LAUNCHER_SCREEN}
        options={tokenLauncherSheetPreset}
      />
      <BSStack.Screen
        getComponent={() => require('@/features/perps/screens/PerpsNavigator').PerpsNavigator}
        name={Routes.PERPS_NAVIGATOR}
      />
      <BSStack.Screen
        getComponent={() => require('@/features/perps/screens/perps-trade-history/PerpsTradeHistoryScreen').PerpsTradeHistoryScreen}
        name={Routes.PERPS_TRADE_HISTORY_SCREEN}
      />
      <BSStack.Screen
        getComponent={() => require('@/features/perps/screens/CreateTriggerOrderBottomSheet').CreateTriggerOrderBottomSheet}
        name={Routes.CREATE_TRIGGER_ORDER_BOTTOM_SHEET}
      />
      <BSStack.Screen
        getComponent={() => require('@/features/perps/screens/ClosePositionBottomSheet').ClosePositionBottomSheet}
        name={Routes.CLOSE_POSITION_BOTTOM_SHEET}
      />
      <BSStack.Screen
        getComponent={() => require('@/features/king-of-the-hill/screens/KingOfTheHillExplainSheet').KingOfTheHillExplainSheet}
        name={Routes.KING_OF_THE_HILL_EXPLAIN_SHEET}
      />
      <BSStack.Screen
        getComponent={() => require('@/features/perps/screens/perps-explain-sheet/PerpsExplainSheet').PerpsExplainSheet}
        name={Routes.PERPS_EXPLAIN_SHEET}
      />
      <BSStack.Screen
        getComponent={() => require('@/features/perps/screens/perps-add-to-position-sheet/PerpsAddToPositionSheet').PerpsAddToPositionSheet}
        name={Routes.PERPS_ADD_TO_POSITION_SHEET}
      />
      <BSStack.Screen
        getComponent={() => require('@/features/perps/screens/perps-about-sheet/PerpsAboutSheet').PerpsAboutSheet}
        name={Routes.PERPS_ABOUT_SHEET}
      />
      <BSStack.Screen
        getComponent={() => require('@/features/perps/screens/perps-trade-details-sheet/PerpsTradeDetailsSheet').PerpsTradeDetailsSheet}
        name={Routes.PERPS_TRADE_DETAILS_SHEET}
      />
      <BSStack.Screen
        getComponent={() => require('@/features/polymarket/screens/polymarket-event-screen/PolymarketEventScreen').PolymarketEventScreen}
        name={Routes.POLYMARKET_EVENT_SCREEN}
      />
      <BSStack.Screen
        getComponent={() =>
          require('@/features/polymarket/screens/polymarket-redeem-position-sheet/PolymarketRedeemPositionSheet')
            .PolymarketRedeemPositionSheet
        }
        name={Routes.POLYMARKET_MANAGE_POSITION_SHEET}
      />
      <BSStack.Screen
        getComponent={() => require('@/features/polymarket/screens/polymarket-market-sheet/PolymarketMarketSheet').PolymarketMarketSheet}
        name={Routes.POLYMARKET_MARKET_SHEET}
      />
      <BSStack.Screen
        getComponent={() =>
          require('@/features/polymarket/screens/polymarket-market-description-sheet/PolymarketMarketDescriptionSheet')
            .PolymarketMarketDescriptionSheet
        }
        name={Routes.POLYMARKET_MARKET_DESCRIPTION_SHEET}
      />
      <BSStack.Screen
        getComponent={() =>
          require('@/features/polymarket/screens/polymarket-new-position-sheet/PolymarketNewPositionSheet').PolymarketNewPositionSheet
        }
        name={Routes.POLYMARKET_NEW_POSITION_SHEET}
      />
      <BSStack.Screen
        getComponent={() =>
          require('@/features/polymarket/screens/polymarket-account-screen/PolymarketAccountScreen').PolymarketAccountScreen
        }
        name={Routes.POLYMARKET_ACCOUNT_SCREEN}
      />
      <BSStack.Screen
        getComponent={() => require('@/features/polymarket/screens/polymarket-navigator/PolymarketNavigator').PolymarketNavigator}
        name={Routes.POLYMARKET_NAVIGATOR}
      />
      <BSStack.Screen
        getComponent={() => require('@/features/polymarket/screens/polymarket-learn-sheet/PolymarketExplainSheet').PolymarketExplainSheet}
        name={Routes.POLYMARKET_EXPLAIN_SHEET}
      />
      <BSStack.Screen
        getComponent={() =>
          require('@/features/polymarket/screens/polymarket-browse-events-screen/PolymarketBrowseEventsScreen').PolymarketBrowseEventsScreen
        }
        name={Routes.POLYMARKET_BROWSE_EVENTS_SCREEN}
      />
      <BSStack.Screen
        getComponent={() =>
          require('@/features/polymarket/screens/polymarket-sell-position-sheet/PolymarketSellPositionSheet').PolymarketSellPositionSheet
        }
        name={Routes.POLYMARKET_SELL_POSITION_SHEET}
      />
      <BSStack.Screen
        getComponent={() => require('@/features/rnbw-airdrop/screens/rnbw-airdrop-screen/RnbwAirdropScreen').RnbwAirdropScreen}
        name={Routes.RNBW_AIRDROP_SCREEN}
      />
      <BSStack.Screen
        getComponent={() => require('@/features/rnbw-rewards/screens/rnbw-rewards-claim-sheet/RnbwRewardsClaimSheet').RnbwRewardsClaimSheet}
        name={Routes.RNBW_REWARDS_CLAIM_SHEET}
      />
      <BSStack.Screen
        getComponent={() =>
          require('@/features/rnbw-rewards/screens/rnbw-rewards-estimate-sheet/RnbwRewardsEstimateSheet').RnbwRewardsEstimateSheet
        }
        name={Routes.RNBW_REWARDS_ESTIMATE_SHEET}
      />
      <BSStack.Screen
        getComponent={() =>
          require('@/features/rnbw-staking/screens/rnbw-staking-learn-screen/RnbwStakingLearnScreen').RnbwStakingLearnScreen
        }
        name={Routes.RNBW_STAKING_LEARN_SCREEN}
      />
      <BSStack.Screen
        getComponent={() => require('@/features/rnbw-staking/screens/rnbw-staking-screen/RnbwStakingScreen').RnbwStakingScreen}
        name={Routes.RNBW_STAKING_SCREEN}
      />
      <BSStack.Screen
        getComponent={() => require('@/features/rnbw-staking/screens/rnbw-unstake-sheet/RnbwUnstakeSheet').RnbwUnstakeSheet}
        name={Routes.RNBW_UNSTAKE_SHEET}
      />
      <BSStack.Screen getComponent={() => require('@/components/wallet-error/WalletErrorSheet').default} name={Routes.WALLET_ERROR_SHEET} />
      <BSStack.Screen
        getComponent={() =>
          require('@/features/rnbw-membership/screens/rnbw-membership-tiers-sheet/RnbwMembershipTiersSheet').RnbwMembershipTiersSheet
        }
        name={Routes.RNBW_MEMBERSHIP_TIERS_SHEET}
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
      <AuthStack.Screen getComponent={() => BSNavigator} name={Routes.MAIN_NATIVE_BOTTOM_SHEET_NAVIGATOR} />
      <AuthStack.Screen
        getComponent={() => require('../screens/PinAuthenticationScreen').default}
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
