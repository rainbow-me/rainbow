/* eslint-disable react/jsx-props-no-spreading */
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useContext } from 'react';
import { AddCashSheet } from '../screens/AddCash';
import AvatarBuilder from '../screens/AvatarBuilder';
import BackupSheet from '../components/backup/BackupSheet';
import ChangeWalletSheet from '../screens/change-wallet/ChangeWalletSheet';
import ConnectedDappsSheet from '../screens/ConnectedDappsSheet';
import ENSAdditionalRecordsSheet from '../screens/ENSAdditionalRecordsSheet';
import ENSConfirmRegisterSheet from '../screens/ENSConfirmRegisterSheet';
import ExpandedAssetSheet from '../screens/ExpandedAssetSheet';
import { ExpandedAssetSheet as ExpandedAssetSheetV2 } from '@/screens/expandedAssetSheet/ExpandedAssetSheet';
import ExplainSheet from '../screens/ExplainSheet';
import ExternalLinkWarningSheet from '../screens/ExternalLinkWarningSheet';
import ModalScreen from '../screens/ModalScreen';
import PinAuthenticationScreen from '../screens/PinAuthenticationScreen';
import ProfileSheet from '../screens/ProfileSheet';
import ReceiveModal from '../screens/ReceiveModal';
import { RestoreSheet } from '../screens/RestoreSheet';
import SelectENSSheet from '../screens/SelectENSSheet';
import SelectUniqueTokenSheet from '../screens/SelectUniqueTokenSheet';
import { SendConfirmationSheet } from '../screens/SendConfirmationSheet';
import SendSheet from '../screens/SendSheet';
import ShowcaseSheet from '../screens/ShowcaseSheet';
import SpeedUpAndCancelSheet from '../screens/SpeedUpAndCancelSheet';
import NotificationsPromoSheet from '../screens/NotificationsPromoSheet';
import WalletConnectApprovalSheet from '../screens/WalletConnectApprovalSheet';
import WalletConnectRedirectSheet from '../screens/WalletConnectRedirectSheet';
import { WalletDiagnosticsSheet } from '../screens/Diagnostics';
import WelcomeScreen from '../screens/WelcomeScreen';
import RegisterENSNavigator from './RegisterENSNavigator';
import { SwipeNavigator } from './SwipeNavigator';
import { createBottomSheetNavigator } from './bottom-sheet';
import {
  closeKeyboardOnClose,
  defaultScreenStackOptions,
  stackNavigationConfig,
  learnWebViewScreenConfig,
  backupSheetSizes,
} from './config';
import {
  addWalletNavigatorPreset,
  androidRecievePreset,
  bottomSheetPreset,
  hardwareWalletTxNavigatorPreset,
  emojiPreset,
  exchangePreset,
  expandedPreset,
  expandedPresetWithSmallGestureResponseDistance,
  sheetPreset,
  speedUpAndCancelStyleInterpolator,
  wcPromptPreset,
  addCashSheet,
  nftSingleOfferSheetPreset,
  walletconnectBottomSheetPreset,
  consoleSheetPreset,
  appIconUnlockSheetPreset,
  swapSheetPreset,
  tokenLauncherSheetPreset,
} from './effects';
import { InitialRouteContext } from './initialRoute';
import { onNavigationStateChange } from './onNavigationStateChange';
import Routes from './routesNames';
import { deviceUtils } from '@/utils';
import useExperimentalFlag, { KING_OF_THE_HILL_TAB, PROFILES } from '@/config/experimentalHooks';
import QRScannerScreen from '@/screens/QRScannerScreen';
import { PairHardwareWalletNavigator } from './PairHardwareWalletNavigator';
import LearnWebViewScreen from '@/screens/LearnWebViewScreen';
import { TransactionDetails } from '@/screens/transaction-details/TransactionDetails';
import { AddWalletNavigator } from './AddWalletNavigator';
import { HardwareWalletTxNavigator } from './HardwareWalletTxNavigator';
import { ClaimAirdropSheet } from '@/screens/Airdrops/ClaimAirdropSheet';
import { AirdropsSheet } from '@/screens/Airdrops/AirdropsSheet';
import { RewardsSheet } from '@/screens/rewards/RewardsSheet';
import { SettingsSheet } from '@/screens/SettingsSheet/SettingsSheet';
import { CUSTOM_MARGIN_TOP_ANDROID } from '@/screens/SettingsSheet/constants';
import { Portal } from '@/screens/Portal';
import { NFTOffersSheet } from '@/screens/NFTOffersSheet';
import { NFTSingleOfferSheet } from '@/screens/NFTSingleOfferSheet';
import ShowSecretView from '@/screens/SettingsSheet/components/Backups/ShowSecretView';
import PoapSheet from '@/screens/mints/PoapSheet';
import { PositionSheet } from '@/screens/positions/PositionSheet';
import MintSheet from '@/screens/mints/MintSheet';
import { MintsSheet } from '@/screens/MintsSheet/MintsSheet';
import { SignTransactionSheet } from '@/screens/SignTransactionSheet';
import { RemotePromoSheet } from '@/components/remote-promo-sheet/RemotePromoSheet';
import { ConsoleSheet } from '@/screens/points/ConsoleSheet';
import { PointsProfileProvider } from '@/screens/points/contexts/PointsProfileContext';
import walletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import AppIconUnlockSheet from '@/screens/AppIconUnlockSheet';
import { SwapScreen } from '@/__swaps__/screens/Swap/Swap';
import { ControlPanel } from '@/components/DappBrowser/control-panel/ControlPanel';
import { ClaimRewardsPanel } from '@/screens/points/claim-flow/ClaimRewardsPanel';
import { ClaimClaimablePanel } from '@/screens/claimables/ClaimPanel';
import { RootStackParamList } from './types';
import WalletLoadingListener from '@/components/WalletLoadingListener';
import { Portal as CMPortal } from '@/react-native-cool-modals/Portal';
import { LogSheet } from '@/components/debugging/LogSheet';
import { TokenLauncherScreen } from '@/screens/token-launcher/TokenLauncherScreen';
import { NetworkSelector } from '@/screens/network-selector/NetworkSelector';
import { KingOfTheHillExplainSheet } from '@/screens/king-of-the-hill/KingOfTheHillExplainSheet';
import ProfileScreen from '@/screens/ProfileScreen';
import { useRemoteConfig } from '@/model/remoteConfig';
import { IS_TEST } from '@/env';

const Stack = createStackNavigator();
const OuterStack = createStackNavigator();
const AuthStack = createStackNavigator();
const BSStack = createBottomSheetNavigator();

function MainNavigator() {
  const initialRoute = useContext(InitialRouteContext) as unknown as string;
  return (
    <Stack.Navigator initialRouteName={initialRoute} {...stackNavigationConfig} screenOptions={defaultScreenStackOptions}>
      <Stack.Screen component={SwipeNavigator} name={Routes.SWIPE_LAYOUT} options={expandedPreset} />
      <Stack.Screen component={AvatarBuilder} name={Routes.AVATAR_BUILDER} options={emojiPreset} />
      <Stack.Screen component={ConnectedDappsSheet} name={Routes.CONNECTED_DAPPS} options={expandedPreset} />
      <Stack.Screen component={Portal} name={Routes.PORTAL} options={expandedPreset} />
      <Stack.Screen component={PositionSheet} name={Routes.POSITION_SHEET} options={expandedPreset} />
      <Stack.Screen
        component={SpeedUpAndCancelSheet}
        name={Routes.SPEED_UP_AND_CANCEL_SHEET}
        options={{
          ...exchangePreset,
          cardStyleInterpolator: speedUpAndCancelStyleInterpolator,
        }}
      />
      <Stack.Screen component={ReceiveModal} name={Routes.RECEIVE_MODAL} options={androidRecievePreset} />

      <Stack.Screen component={WalletConnectRedirectSheet} name={Routes.WALLET_CONNECT_REDIRECT_SHEET} options={wcPromptPreset} />
      <Stack.Screen component={AddCashSheet} name={Routes.ADD_CASH_SHEET} options={addCashSheet} />
      <Stack.Screen component={RestoreSheet} name={Routes.RESTORE_SHEET} options={bottomSheetPreset} />
      <Stack.Screen component={WelcomeScreen} name={Routes.WELCOME_SCREEN} options={{ animationEnabled: false, gestureEnabled: false }} />
      <Stack.Screen component={ShowSecretView} name="ShowSecretView" options={bottomSheetPreset} />
      <Stack.Screen component={WalletConnectApprovalSheet} name={Routes.WALLET_CONNECT_APPROVAL_SHEET} options={bottomSheetPreset} />
    </Stack.Navigator>
  );
}

// FIXME do it in one navigator
function MainOuterNavigator() {
  return (
    <OuterStack.Navigator initialRouteName={Routes.MAIN_NAVIGATOR} {...stackNavigationConfig} screenOptions={defaultScreenStackOptions}>
      <OuterStack.Screen component={MainNavigator} name={Routes.MAIN_NAVIGATOR} />
    </OuterStack.Navigator>
  );
}

function BSNavigator() {
  const profilesEnabled = useExperimentalFlag(PROFILES);
  const { king_of_the_hill_tab_enabled } = useRemoteConfig('king_of_the_hill_tab_enabled');
  const showKingOfTheHillTab = (useExperimentalFlag(KING_OF_THE_HILL_TAB) || king_of_the_hill_tab_enabled) && !IS_TEST;

  return (
    <BSStack.Navigator>
      <BSStack.Screen component={MainOuterNavigator} name={Routes.MAIN_NAVIGATOR_WRAPPER} />
      <BSStack.Screen
        component={ShowcaseSheet}
        name={Routes.SHOWCASE_SHEET}
        options={{
          height: '95%',
        }}
      />
      <BSStack.Screen component={LearnWebViewScreen} name={Routes.LEARN_WEB_VIEW_SCREEN} {...learnWebViewScreenConfig} />
      <BSStack.Screen component={ExpandedAssetSheet} name={Routes.EXPANDED_ASSET_SHEET} />
      <BSStack.Screen component={PoapSheet} name={Routes.POAP_SHEET} />
      <BSStack.Screen component={MintSheet} name={Routes.MINT_SHEET} />
      <BSStack.Screen component={QRScannerScreen} name={Routes.QR_SCANNER_SCREEN} />
      <BSStack.Screen component={AddWalletNavigator} name={Routes.ADD_WALLET_NAVIGATOR} options={addWalletNavigatorPreset} />
      <BSStack.Screen
        component={PairHardwareWalletNavigator}
        name={Routes.PAIR_HARDWARE_WALLET_NAVIGATOR}
        options={{
          backdropOpacity: 1,
        }}
      />
      <BSStack.Screen
        component={HardwareWalletTxNavigator}
        name={Routes.HARDWARE_WALLET_TX_NAVIGATOR}
        options={hardwareWalletTxNavigatorPreset}
      />
      {showKingOfTheHillTab && <BSStack.Screen component={ProfileScreen} name={Routes.PROFILE_SCREEN} />}
      {profilesEnabled && (
        <>
          <BSStack.Screen component={ENSConfirmRegisterSheet} name={Routes.ENS_CONFIRM_REGISTER_SHEET} />
          <BSStack.Screen component={RegisterENSNavigator} name={Routes.REGISTER_ENS_NAVIGATOR} />
          <BSStack.Screen component={ENSAdditionalRecordsSheet} name={Routes.ENS_ADDITIONAL_RECORDS_SHEET} />
          <BSStack.Screen component={SelectENSSheet} name={Routes.SELECT_ENS_SHEET} />
          <BSStack.Screen component={ProfileSheet} name={Routes.PROFILE_SHEET} />
          <BSStack.Screen component={ProfileSheet} name={Routes.PROFILE_PREVIEW_SHEET} />
          <BSStack.Screen
            component={SelectUniqueTokenSheet}
            name={Routes.SELECT_UNIQUE_TOKEN_SHEET}
            options={{ ...bottomSheetPreset, height: '95%' }}
          />
          <BSStack.Screen component={SpeedUpAndCancelSheet} name={Routes.SPEED_UP_AND_CANCEL_BOTTOM_SHEET} />
        </>
      )}
      <BSStack.Screen component={RemotePromoSheet} name={Routes.REMOTE_PROMO_SHEET} options={bottomSheetPreset} />
      <BSStack.Screen component={NotificationsPromoSheet} name={Routes.NOTIFICATIONS_PROMO_SHEET} options={bottomSheetPreset} />
      <BSStack.Screen component={ExplainSheet} name={Routes.EXPLAIN_SHEET} options={bottomSheetPreset} />
      <BSStack.Screen component={ExternalLinkWarningSheet} name={Routes.EXTERNAL_LINK_WARNING_SHEET} options={bottomSheetPreset} />
      <BSStack.Screen component={ModalScreen} {...closeKeyboardOnClose} name={Routes.MODAL_SCREEN} />
      <BSStack.Screen component={SendConfirmationSheet} name={Routes.SEND_CONFIRMATION_SHEET} options={sheetPreset} />
      <BSStack.Screen
        component={ExpandedAssetSheet}
        name={Routes.CUSTOM_GAS_SHEET}
        options={{
          backdropOpacity: 1,
        }}
      />
      <BSStack.Screen
        component={BackupSheet}
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
      <BSStack.Screen component={WalletDiagnosticsSheet} name={Routes.DIAGNOSTICS_SHEET} options={{ ...bottomSheetPreset }} />
      <BSStack.Screen
        component={SettingsSheet}
        name={Routes.SETTINGS_SHEET}
        options={{
          ...bottomSheetPreset,
          height: deviceUtils.dimensions.height - CUSTOM_MARGIN_TOP_ANDROID,
        }}
      />
      <BSStack.Screen
        name={Routes.TRANSACTION_DETAILS}
        component={TransactionDetails}
        // @ts-ignore
        options={{ ...bottomSheetPreset, scrollEnabled: false }}
      />
      <BSStack.Screen name={Routes.OP_REWARDS_SHEET} component={RewardsSheet} options={{ ...bottomSheetPreset }} />
      <BSStack.Screen name={Routes.NFT_OFFERS_SHEET} component={NFTOffersSheet} options={{ ...bottomSheetPreset }} />
      <BSStack.Screen name={Routes.NFT_SINGLE_OFFER_SHEET} component={NFTSingleOfferSheet} options={nftSingleOfferSheetPreset} />
      <BSStack.Screen name={Routes.MINTS_SHEET} component={MintsSheet} />
      <BSStack.Screen component={SignTransactionSheet} name={Routes.CONFIRM_REQUEST} options={walletconnectBottomSheetPreset} />
      <BSStack.Screen component={ConsoleSheet} name={Routes.CONSOLE_SHEET} options={consoleSheetPreset} />
      <BSStack.Screen component={AppIconUnlockSheet} name={Routes.APP_ICON_UNLOCK_SHEET} options={appIconUnlockSheetPreset} />
      <BSStack.Screen component={ControlPanel} name={Routes.DAPP_BROWSER_CONTROL_PANEL} />
      <BSStack.Screen component={NetworkSelector} name={Routes.NETWORK_SELECTOR} />
      <BSStack.Screen component={ClaimRewardsPanel} name={Routes.CLAIM_REWARDS_PANEL} />
      <BSStack.Screen component={ClaimClaimablePanel} name={Routes.CLAIM_CLAIMABLE_PANEL} />
      <BSStack.Screen component={ChangeWalletSheet} name={Routes.CHANGE_WALLET_SHEET} options={{ ...bottomSheetPreset }} />
      <BSStack.Screen component={SwapScreen} name={Routes.SWAP} options={swapSheetPreset} />
      <BSStack.Screen component={SendSheet} name={Routes.SEND_SHEET_NAVIGATOR} options={expandedPresetWithSmallGestureResponseDistance} />
      <BSStack.Screen component={ExpandedAssetSheetV2} name={Routes.EXPANDED_ASSET_SHEET_V2} />
      <BSStack.Screen component={AirdropsSheet} name={Routes.AIRDROPS_SHEET} />
      <BSStack.Screen component={ClaimAirdropSheet} name={Routes.CLAIM_AIRDROP_SHEET} />
      <BSStack.Screen component={LogSheet} name={Routes.LOG_SHEET} />
      <BSStack.Screen component={TokenLauncherScreen} name={Routes.TOKEN_LAUNCHER_SCREEN} options={tokenLauncherSheetPreset} />
      <BSStack.Screen component={KingOfTheHillExplainSheet} name={Routes.KING_OF_THE_HILL_EXPLAIN_SHEET} />
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
      <AuthStack.Screen component={BSNavigator} name={Routes.MAIN_NATIVE_BOTTOM_SHEET_NAVIGATOR} />
      <AuthStack.Screen
        component={PinAuthenticationScreen}
        name={Routes.PIN_AUTHENTICATION_SCREEN}
        options={{ ...sheetPreset, gestureEnabled: false }}
      />
    </AuthStack.Navigator>
  );
}

const AppContainerWithAnalytics = React.forwardRef<NavigationContainerRef<RootStackParamList>, { onReady: () => void }>((props, ref) => (
  <NavigationContainer onReady={props.onReady} onStateChange={onNavigationStateChange} ref={ref}>
    <PointsProfileProvider>
      <AuthNavigator />
    </PointsProfileProvider>

    {/* NOTE: Internally, these use some navigational checks */}
    <CMPortal />
    <WalletLoadingListener />
  </NavigationContainer>
));

AppContainerWithAnalytics.displayName = 'AppContainerWithAnalytics';

export default React.memo(AppContainerWithAnalytics);
