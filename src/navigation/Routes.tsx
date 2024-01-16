import React, { useContext } from 'react';
// eslint-disable-next-line import/no-unresolved
import RouteNames from './routesNames';
import { createBottomSheetNavigator } from './bottom-sheet-navigator/createBottomSheetNavigator';
import ExplainSheet from '@/screens/ExplainSheet';
import ExpandedAssetSheet from '@/screens/ExpandedAssetSheet';
import SendSheet from '@/screens/SendSheet';
import { AddCashSheet } from '@/screens/AddCash';
// import AddTokenSheet from '@/screens/AddTokenSheet';
import BackupSheet from '@/screens/BackupSheet';
import ChangeWalletSheet from '@/screens/ChangeWalletSheet';
import { AddWalletNavigator } from './AddWalletNavigator';
import ModalScreen from '@/screens/ModalScreen';
import { AdaptiveBottomSheet } from '@/navigation/bottom-sheet-navigator/components/AdaptiveBottomSheet';

import { createStackNavigator } from '@react-navigation/stack';
import AvatarBuilder from '../screens/AvatarBuilder';
import ConnectedDappsSheet from '../screens/ConnectedDappsSheet';
import ENSAdditionalRecordsSheet from '../screens/ENSAdditionalRecordsSheet';
import ENSConfirmRegisterSheet from '../screens/ENSConfirmRegisterSheet';
import ExternalLinkWarningSheet from '../screens/ExternalLinkWarningSheet';
import ProfileSheet from '../screens/ProfileSheet';
import ReceiveModal from '../screens/ReceiveModal';
import { RestoreSheet } from '../screens/RestoreSheet';
import SelectENSSheet from '../screens/SelectENSSheet';
import SelectUniqueTokenSheet from '../screens/SelectUniqueTokenSheet';
import { SendConfirmationSheet } from '../screens/SendConfirmationSheet';
import { SettingsSheet } from '../screens/SettingsSheet';
import ShowcaseScreen from '../screens/ShowcaseSheet';
import { SignTransactionSheet } from '../screens/SignTransactionSheet';
import SpeedUpAndCancelSheet from '../screens/SpeedUpAndCancelSheet';
import NotificationsPromoSheet from '../screens/NotificationsPromoSheet';
import WalletConnectApprovalSheet from '../screens/WalletConnectApprovalSheet';
import WalletConnectRedirectSheet from '../screens/WalletConnectRedirectSheet';
import { WalletDiagnosticsSheet } from '../screens/Diagnostics';
import WelcomeScreen from '../screens/WelcomeScreen';
import { useTheme } from '../theme/ThemeContext';
import RegisterENSNavigator from './RegisterENSNavigator';
import { SwipeNavigator } from './SwipeNavigator';
import { defaultScreenStackOptions, nativeStackDefaultConfig, stackNavigationConfig } from './config';
import { emojiPreset, emojiPresetWallet } from './effects';
import { InitialRouteContext } from './initialRoute';
import { ExchangeModalNavigator } from './index';
import useExperimentalFlag, { PROFILES } from '@/config/experimentalHooks';
import createNativeStackNavigator from '@/react-native-cool-modals/createNativeStackNavigator';
import QRScannerScreen from '@/screens/QRScannerScreen';
import { PairHardwareWalletNavigator } from './PairHardwareWalletNavigator';
import LearnWebViewScreen from '@/screens/LearnWebViewScreen';
import { TransactionDetails } from '@/screens/transaction-details/TransactionDetails';
import { HardwareWalletTxNavigator } from './HardwareWalletTxNavigator';
import { RewardsSheet } from '@/screens/rewards/RewardsSheet';
import { Portal } from '@/screens/Portal';
import PoapSheet from '@/screens/mints/PoapSheet';
import { PositionSheet } from '@/screens/positions/PositionSheet';
import { NFTOffersSheet } from '@/screens/NFTOffersSheet';
import { NFTSingleOfferSheet } from '@/screens/NFTSingleOfferSheet';
import MintSheet from '@/screens/mints/MintSheet';
import { MintsSheet } from '@/screens/MintsSheet/MintsSheet';
import { RemotePromoSheet } from '@/components/remote-promo-sheet/RemotePromoSheet';
import { ConsoleSheet } from '@/screens/points/ConsoleSheet';
import { PointsProfileProvider } from '@/screens/points/contexts/PointsProfileContext';

const BottomSheet = createBottomSheetNavigator();

export function Routes() {
  const { colors, isDarkMode } = useTheme();
  const profilesEnabled = useExperimentalFlag(PROFILES);
  return (
    <BottomSheet.Navigator>
      <BottomSheet.Screen options={{ root: true }} component={NativeStackNavigator} name={RouteNames.ROOT_STACK} />
      <BottomSheet.Screen component={ExpandedAssetSheet} name={RouteNames.EXPANDED_ASSET_SHEET} />
      <BottomSheet.Screen component={ExpandedAssetSheet} name={RouteNames.SWAP_DETAILS_SHEET} />
      <BottomSheet.Screen component={ExpandedAssetSheet} name={RouteNames.TOKEN_INDEX_SHEET} />
      <BottomSheet.Screen component={ExplainSheet} name={RouteNames.EXPLAIN_SHEET} />
      <BottomSheet.Screen component={SendSheet} name={RouteNames.SEND_SHEET} />
      <BottomSheet.Screen component={AddCashSheet} name={RouteNames.ADD_CASH_SHEET} />
      <BottomSheet.Screen component={BackupSheet} name={RouteNames.BACKUP_SHEET} />
      <BottomSheet.Screen component={ChangeWalletSheet} name={RouteNames.CHANGE_WALLET_SHEET} />
      <BottomSheet.Screen component={AddWalletNavigator} name={RouteNames.ADD_WALLET_NAVIGATOR} />
      <BottomSheet.Screen component={ModalScreen} name={RouteNames.MODAL_SCREEN} />
      {/* <BottomSheet.Screen
        component={AddTokenSheet}
        name={RouteNames.ADD_TOKEN_SHEET}
      /> */}
    </BottomSheet.Navigator>
  );
}

const Stack = createStackNavigator();
const NativeStack = createNativeStackNavigator();

function MainNavigator() {
  const initialRoute = (useContext(InitialRouteContext) as unknown) as string;

  return (
    <Stack.Navigator initialRouteName={initialRoute} {...stackNavigationConfig} screenOptions={defaultScreenStackOptions}>
      <Stack.Screen component={SwipeNavigator} name={RouteNames.SWIPE_LAYOUT} />
      <Stack.Screen
        component={WelcomeScreen}
        name={RouteNames.WELCOME_SCREEN}
        options={{ animationEnabled: false, gestureEnabled: false }}
      />
      <Stack.Screen component={AvatarBuilder} name={RouteNames.AVATAR_BUILDER} options={emojiPreset} />
      <Stack.Screen component={AvatarBuilder} name={RouteNames.AVATAR_BUILDER_WALLET} options={emojiPresetWallet} />
    </Stack.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator
      initialRouteName={RouteNames.MAIN_NAVIGATOR_WRAPPER}
      {...stackNavigationConfig}
      screenOptions={defaultScreenStackOptions}
    >
      <Stack.Screen component={MainNavigator} name={RouteNames.MAIN_NAVIGATOR_WRAPPER} />
    </Stack.Navigator>
  );
}
export function withAdaptiveBottomSheet(Component) {
  return function WrappedComponent(props) {
    return (
      <AdaptiveBottomSheet style={{ paddingBottom: 16 }} fullWindowOverlay={false}>
        <Component {...props} />
      </AdaptiveBottomSheet>
    );
  };
}
function NativeStackNavigator() {
  const { colors, isDarkMode } = useTheme();
  const profilesEnabled = useExperimentalFlag(PROFILES);
  return (
    <BottomSheet.Navigator>
      <BottomSheet.Screen options={{ root: true }} component={MainStack} name={RouteNames.STACK} />
      <BottomSheet.Screen
        component={withAdaptiveBottomSheet(LearnWebViewScreen)}
        name={RouteNames.LEARN_WEB_VIEW_SCREEN}
        // {...learnWebViewScreenConfig}
      />
      <BottomSheet.Screen
        component={withAdaptiveBottomSheet(ReceiveModal)}
        name={RouteNames.RECEIVE_MODAL}
        // options={{
        //   backgroundColor: isDarkMode ? colors.offWhite : '#3B3E43',
        //   backgroundOpacity: 1,
        //   customStack: true,
        // }}
      />
      <BottomSheet.Screen
        component={withAdaptiveBottomSheet(SettingsSheet)}
        name={RouteNames.SETTINGS_SHEET}
        // {...settingsSheetConfig}
      />
      <BottomSheet.Screen
        component={withAdaptiveBottomSheet(ExchangeModalNavigator)}
        name={RouteNames.EXCHANGE_MODAL}
        options={{ ...nativeStackDefaultConfig, relevantScrollViewDepth: 2 }}
      />
      <BottomSheet.Screen
        component={withAdaptiveBottomSheet(PoapSheet)}
        name={RouteNames.POAP_SHEET}
        // {...expandedAssetSheetConfigWithLimit}
      />
      <BottomSheet.Screen
        component={withAdaptiveBottomSheet(MintSheet)}
        name={RouteNames.MINT_SHEET}
        // {...expandedAssetSheetConfigWithLimit}
      />
      <BottomSheet.Screen
        component={withAdaptiveBottomSheet(PositionSheet)}
        name={RouteNames.POSITION_SHEET}
        // {...positionSheetConfig}
      />
      <BottomSheet.Screen
        component={withAdaptiveBottomSheet(ShowcaseScreen)}
        name={RouteNames.SHOWCASE_SHEET}
        // options={{
        //   customStack: true,
        // }}
      />
      <BottomSheet.Screen
        component={withAdaptiveBottomSheet(SelectUniqueTokenSheet)}
        name={RouteNames.SELECT_UNIQUE_TOKEN_SHEET}
        // {...expandedAssetSheetConfigWithLimit}
      />
      <BottomSheet.Screen
        component={withAdaptiveBottomSheet(SpeedUpAndCancelSheet)}
        name={RouteNames.SPEED_UP_AND_CANCEL_SHEET}
        // options={{
        //   allowsDragToDismiss: true,
        //   backgroundOpacity: 0.6,
        //   customStack: true,
        //   headerHeight: 0,
        //   isShortFormEnabled: false,
        //   topOffset: 0,
        // }}
      />
      <BottomSheet.Screen
        component={withAdaptiveBottomSheet(SendConfirmationSheet)}
        name={RouteNames.SEND_CONFIRMATION_SHEET}
        // {...sendConfirmationSheetConfig}
      />
      {/* <BottomSheet.Screen 
        component={withAdaptiveBottomSheet(ExplainSheet)}
        name={RouteNames.EXPLAIN_SHEET}
        // {...explainSheetConfig}
      /> */}
      <BottomSheet.Screen
        component={withAdaptiveBottomSheet(RemotePromoSheet)}
        name={RouteNames.REMOTE_PROMO_SHEET}
        // {...promoSheetConfig}
      />
      <BottomSheet.Screen
        component={withAdaptiveBottomSheet(NotificationsPromoSheet)}
        name={RouteNames.NOTIFICATIONS_PROMO_SHEET}
        // {...promoSheetConfig}
      />
      <BottomSheet.Screen
        component={withAdaptiveBottomSheet(ExternalLinkWarningSheet)}
        name={RouteNames.EXTERNAL_LINK_WARNING_SHEET}
        // {...externalLinkWarningSheetConfig}
      />
      <BottomSheet.Screen
        component={withAdaptiveBottomSheet(WalletDiagnosticsSheet)}
        name={RouteNames.DIAGNOSTICS_SHEET}
        // {...walletDiagnosticsSheetConfig}
      />
      <BottomSheet.Screen
        component={withAdaptiveBottomSheet(ConnectedDappsSheet)}
        name={RouteNames.CONNECTED_DAPPS}
        // options={{
        //   allowsDragToDismiss: true,
        //   backgroundOpacity: 0.7,
        //   customStack: true,
        //   springDamping: 1,
        //   transitionDuration: 0.25,
        // }}
      />
      <BottomSheet.Screen
        component={withAdaptiveBottomSheet(RestoreSheet)}
        name={RouteNames.RESTORE_SHEET}
        // {...restoreSheetConfig}
      />
      <BottomSheet.Screen
        component={withAdaptiveBottomSheet(SignTransactionSheet)}
        name={RouteNames.CONFIRM_REQUEST}
        // {...signTransactionSheetConfig}
      />
      <BottomSheet.Screen
        component={withAdaptiveBottomSheet(ExpandedAssetSheet)}
        name={RouteNames.CUSTOM_GAS_SHEET}
        // {...customGasSheetConfig}
      />
      <BottomSheet.Screen
        component={withAdaptiveBottomSheet(ExpandedAssetSheet)}
        name={RouteNames.SWAP_SETTINGS_SHEET}
        // {...customGasSheetConfig}
      />
      <BottomSheet.Screen
        component={withAdaptiveBottomSheet(QRScannerScreen)}
        name={RouteNames.QR_SCANNER_SCREEN}
        // {...qrScannerConfig}
      />
      <BottomSheet.Screen
        component={withAdaptiveBottomSheet(PairHardwareWalletNavigator)}
        name={RouteNames.PAIR_HARDWARE_WALLET_NAVIGATOR}
        // {...pairHardwareWalletNavigatorConfig}
      />
      <BottomSheet.Screen
        component={withAdaptiveBottomSheet(HardwareWalletTxNavigator)}
        name={RouteNames.HARDWARE_WALLET_TX_NAVIGATOR}
        // {...hardwareWalletTxNavigatorConfig}
      />
      <BottomSheet.Screen
        component={withAdaptiveBottomSheet(Portal)}
        name={RouteNames.PORTAL}
        // {...portalSheetConfig}
      />
      {profilesEnabled && (
        <>
          <BottomSheet.Screen
            component={withAdaptiveBottomSheet(RegisterENSNavigator)}
            name={RouteNames.REGISTER_ENS_NAVIGATOR}
            // {...registerENSNavigatorConfig}
          />
          <BottomSheet.Screen
            component={withAdaptiveBottomSheet(ENSConfirmRegisterSheet)}
            name={RouteNames.ENS_CONFIRM_REGISTER_SHEET}
            // {...ensConfirmRegisterSheetConfig}
          />
          <BottomSheet.Screen
            component={withAdaptiveBottomSheet(ENSAdditionalRecordsSheet)}
            name={RouteNames.ENS_ADDITIONAL_RECORDS_SHEET}
            // {...ensAdditionalRecordsSheetConfig}
          />
          <BottomSheet.Screen
            component={withAdaptiveBottomSheet(ProfileSheet)}
            name={RouteNames.PROFILE_SHEET}
            // {...profileConfig}
          />
          <BottomSheet.Screen
            component={withAdaptiveBottomSheet(ProfileSheet)}
            name={RouteNames.PROFILE_PREVIEW_SHEET}
            // {...profilePreviewConfig}
          />
          <BottomSheet.Screen
            component={withAdaptiveBottomSheet(SelectENSSheet)}
            name={RouteNames.SELECT_ENS_SHEET}
            // options={{
            //   allowsDragToDismiss: true,
            //   backgroundOpacity: 0.7,
            //   customStack: true,
            //   springDamping: 1,
            //   transitionDuration: 0.3,
            // }}
          />
        </>
      )}
      <BottomSheet.Screen
        component={withAdaptiveBottomSheet(WalletConnectApprovalSheet)}
        name={RouteNames.WALLET_CONNECT_APPROVAL_SHEET}
        // {...basicSheetConfig}
      />
      <BottomSheet.Screen
        component={withAdaptiveBottomSheet(WalletConnectRedirectSheet)}
        name={RouteNames.WALLET_CONNECT_REDIRECT_SHEET}
        // {...basicSheetConfig}
      />
      <BottomSheet.Screen
        name={RouteNames.TRANSACTION_DETAILS}
        component={withAdaptiveBottomSheet(TransactionDetails)}
        // {...transactionDetailsConfig}
      />
      <BottomSheet.Screen
        name={RouteNames.OP_REWARDS_SHEET}
        component={withAdaptiveBottomSheet(RewardsSheet)}
        // {...opRewardsSheetConfig}
      />
      <BottomSheet.Screen
        name={RouteNames.NFT_OFFERS_SHEET}
        component={withAdaptiveBottomSheet(NFTOffersSheet)}
        // {...nftOffersSheetConfig}
      />
      <BottomSheet.Screen name={RouteNames.NFT_SINGLE_OFFER_SHEET} component={NFTSingleOfferSheet} />
      <BottomSheet.Screen
        name={RouteNames.MINTS_SHEET}
        component={withAdaptiveBottomSheet(MintsSheet)}
        // {...mintsSheetConfig}
      />
      <BottomSheet.Screen
        component={withAdaptiveBottomSheet(ConsoleSheet)}
        name={RouteNames.CONSOLE_SHEET}
        // {...consoleSheetConfig}
      />
    </BottomSheet.Navigator>
  );
}

const AppContainerWithAnalytics = React.forwardRef((props: { onReady: () => void }, ref) => (
  <PointsProfileProvider>
    <NativeStackNavigator />
  </PointsProfileProvider>
));

AppContainerWithAnalytics.displayName = 'AppContainerWithAnalytics';

export default React.memo(AppContainerWithAnalytics);
