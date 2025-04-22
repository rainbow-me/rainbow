import { createStackNavigator } from '@react-navigation/stack';
import Routes from '@/navigation/routesNames';
import { REGISTRATION_MODES } from '@/helpers/ens';
import { CampaignCheckResult } from '@/components/remote-promo-sheet/checkForRemotePromoSheet';
import { ParsedAddressAsset, PendingTransaction, RainbowTransaction, UniqueAsset } from '@/entities';
import { Claimable, RainbowClaimable } from '@/resources/addys/claimables/types';
import { RequestData, WalletconnectApprovalSheetRouteParams, WalletconnectResultType } from '@/walletConnect/types';
import { WalletConnectApprovalSheetType } from '@/helpers/walletConnectApprovalSheetTypes';
import { RainbowWallet } from '@/model/wallet';
import { RainbowPosition } from '@/resources/defi/types';
import { Address } from 'viem';
import { SharedValue } from 'react-native-reanimated';
import { ChainId } from '@/state/backendNetworks/types';
import { ExpandedSheetParamAsset } from '@/screens/expandedAssetSheet/context/ExpandedAssetSheetContext';
import { TextProps } from '@/design-system';
import { TokenColors } from '@/graphql/__generated__/metadata';
import { GasTrend } from '@/__swaps__/utils/meteorology';
import { RequestSource } from '@/utils/requestNavigationHandlers';
import { Checkbox } from '@/screens/SendConfirmationSheet';
import { ENSProfile } from '@/entities/ens';
import { SwapsParams } from '@/__swaps__/screens/Swap/navigateToSwaps';
import { BackupFile, CloudBackups } from '@/model/backup';
import walletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import { UserAssetFilter } from '@/__swaps__/types/assets';
import { NftOffer, PoapEvent, ReservoirCollection } from '@/graphql/__generated__/arc';
import { Contact } from '@/redux/contacts';
import { NavigatorScreenParams } from '@react-navigation/native';
import WalletBackupTypes from '@/helpers/walletBackupTypes';
import { LearnCardKey, LearnCategory } from '@/components/cards/utils/types';
import { CardType } from '@/components/cards/GenericCard';
import { MutableRefObject } from 'react';
import { ActiveTabRef } from '@/components/DappBrowser/types';
import { WalletNotificationSettings } from '@/notifications/settings';
import { LEDGER_ERROR_CODES } from '@/utils/ledger';
import { BigNumberish } from '@ethersproject/bignumber';
import { UnlockableAppIconKey } from '@/appIcons/appIcons';
import { ChartTime } from '@/hooks/charts/useChartInfo';
import { ScrollView } from 'react-native';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface RootParamList extends RootStackParamList {}
  }
}

export type PortalSheetProps = {
  sheetHeight?: number;
  children: React.FC;
};

export type PartialNavigatorConfigOptions = Pick<Partial<Parameters<ReturnType<typeof createStackNavigator>['Screen']>[0]>, 'options'>;

interface ExplainSheetBaseParams {
  onClose?: () => void;
}

export type ExplainSheetType =
  | 'network'
  | 'op_rewards_airdrop_timing'
  | 'op_rewards_amount_distributed'
  | 'op_rewards_bridge'
  | 'op_rewards_swap'
  | 'op_rewards_position'
  | 'output_disabled'
  | 'floor_price'
  | 'gas'
  | 'ens_primary_name'
  | 'ens_manager'
  | 'ens_owner'
  | 'ens_resolver'
  | 'ens_configuration'
  | 'ensOnChainDataWarning'
  | 'currentBaseFeeStable'
  | 'currentBaseFeeFalling'
  | 'currentBaseFeeRising'
  | 'currentBaseFeeSurging'
  | 'currentBaseFeeNotrend'
  | 'maxBaseFee'
  | 'minerTip'
  | 'sending_funds_to_contract'
  | 'verified'
  | 'unverified'
  | 'failed_wc_connection'
  | 'failed_wc_invalid_methods'
  | 'failed_wc_invalid_chains'
  | 'failed_wc_invalid_chain'
  | 'backup'
  | 'rainbow_fee'
  | 'f2cSemiSupportedAssetPurchased'
  | 'insufficientLiquidity'
  | 'feeOnTransfer'
  | 'noRouteFound'
  | 'noQuote'
  | 'crossChainGas'
  | 'availableNetworks'
  | 'obtainL2Assets'
  | 'routeSwaps'
  | 'slippage'
  | 'token_allocation';

interface ExplainSheetNativeAssetInfo {
  symbol?: string;
  icon_url?: string;
  iconURL?: string;
  colors?: TokenColors;
}

interface ExplainSheetCurrencyInfo {
  chainId: ChainId;
  symbol: string;
  icon_url?: string;
  iconURL?: string;
  colors?: TokenColors;
}

interface ExplainSheetTokenAllocationSection {
  title: string;
  value: string;
  description: string;
}

export interface CurrentBaseFeeParams {
  currentGasTrend: GasTrend;
  currentBaseFee: string;
}

export interface CurrentBaseFeeTypes {
  currentBaseFeeStable: CurrentBaseFeeParams;
  currentBaseFeeFalling: CurrentBaseFeeParams;
  currentBaseFeeRising: CurrentBaseFeeParams;
  currentBaseFeeSurging: CurrentBaseFeeParams;
  currentBaseFeeNotrend: CurrentBaseFeeParams;
}

export type CurrentBaseFeeTypeKey = keyof CurrentBaseFeeTypes;

export interface ExplainSheetParameterMap extends CurrentBaseFeeTypes {
  network: { chainId: ChainId };
  op_rewards_airdrop_timing: Record<string, never>;
  op_rewards_amount_distributed: Record<string, never>;
  op_rewards_bridge: { percent?: number };
  op_rewards_swap: { percent?: number };
  op_rewards_position: Record<string, never>;
  output_disabled: {
    inputToken: string | undefined;
    outputToken: string | undefined;
    isCrosschainSwap?: boolean;
    isBridgeSwap?: boolean;
    fromChainId?: ChainId;
    toChainId?: ChainId;
  };
  floor_price: Record<string, never>;
  gas: {
    chainId: ChainId;
    nativeAsset?: ExplainSheetNativeAssetInfo;
  };
  ens_primary_name: Record<string, never>;
  ens_manager: Record<string, never>;
  ens_owner: Record<string, never>;
  ens_resolver: Record<string, never>;
  ens_configuration: Record<string, never>;
  ensOnChainDataWarning: Record<string, never>;
  maxBaseFee: Record<string, never>;
  minerTip: Record<string, never>;
  sending_funds_to_contract: Record<string, never>;
  verified: Record<string, never>;
  unverified: { asset: ParsedAddressAsset | UniqueAsset };
  failed_wc_connection: Record<string, never>;
  failed_wc_invalid_methods: Record<string, never>;
  failed_wc_invalid_chains: Record<string, never>;
  failed_wc_invalid_chain: Record<string, never>;
  backup: Record<string, never>;
  rainbow_fee: { feePercentage?: number | string };
  f2cSemiSupportedAssetPurchased: Record<string, never>;
  insufficientLiquidity: Record<string, never>;
  feeOnTransfer: { inputCurrency: ExplainSheetCurrencyInfo };
  noRouteFound: Record<string, never>;
  noQuote: {
    inputCurrency?: ExplainSheetCurrencyInfo;
    outputCurrency?: ExplainSheetCurrencyInfo;
  };
  crossChainGas: {
    inputCurrency?: ExplainSheetCurrencyInfo;
    outputCurrency?: ExplainSheetCurrencyInfo;
  };
  availableNetworks: {
    tokenSymbol?: string;
    chainIds?: ChainId[];
  };
  obtainL2Assets: {
    chainId: ChainId;
    networkName?: string;
    assetName?: string;
  };
  routeSwaps: Record<string, never>;
  slippage: Record<string, never>;
  token_allocation: { sections: ExplainSheetTokenAllocationSection[] };
}

export type ExplainSheetParams<T extends ExplainSheetType> = ExplainSheetBaseParams & {
  type: T;
} & (ExplainSheetParameterMap[T] extends Record<string, never> ? object : ExplainSheetParameterMap[T]);

export type ExplainSheetRouteParams = {
  [K in ExplainSheetType]: ExplainSheetParams<K>;
}[ExplainSheetType];

type AddWalletNavigatorParams = {
  type?: 'import' | 'watch';
  isFirstWallet: boolean;
};

export type HardwareWalletTxParams = {
  submit: () => Promise<void> | void;
};

export type PairHardwareWalletNavigatorParams = {
  entryPoint?: typeof Routes.ADD_WALLET_SHEET | typeof Routes.IMPORT_OR_WATCH_WALLET_SHEET;
  isFirstWallet?: boolean;
};

export type ModalParams = {
  actionType?: 'Import' | 'Create';
  additionalPadding?: boolean;
  address?: string | undefined;
  asset?: (ParsedAddressAsset | UniqueAsset)[];
  color?: number | null;
  forceColor?: string | null;
  isNewProfile?: boolean;
  contact?: Contact | undefined;
  ens?: string | undefined;
  numWalletGroups?: number;
  nickname?: string | undefined;
  type: 'contact_profile' | 'wallet_profile' | 'send' | 'request' | 'new_wallet_group';
  onRefocusInput?: () => void;
  onCloseModal?: ({ color, name, image }: { color: number; name: string; image?: string }) => void;
  profile?: { image?: string; name: string; color?: number | null };
  withoutStatusBar?: boolean;
  isFromSettings?: boolean;
  onCancel?: () => void;
};

export type SignTransactionSheetParams = {
  transactionDetails: RequestData;
  onSuccess: (result: string) => Promise<void> | void;
  onCancel: (error?: Error) => Promise<void> | void;
  onCloseScreen: (canceled: boolean) => void;
  chainId: ChainId;
  address: string | undefined;
  source: RequestSource;
};

type UntypedRoutes = {
  [key: string]: undefined;
};

export type SettingsStackParams = {
  [Routes.SETTINGS_SECTION]: undefined;
  [Routes.SETTINGS_SECTION_APP_ICON]: undefined;
  [Routes.SETTINGS_SECTION_BACKUP]: {
    walletId?: string;
    initialRoute?: string;
  };
  [Routes.SETTINGS_SECTION_CURRENCY]: undefined;
  [Routes.SETTINGS_SECTION_DEV]: undefined;
  [Routes.SETTINGS_SECTION_LANGUAGE]: undefined;
  [Routes.SETTINGS_SECTION_NETWORK]: undefined;
  [Routes.SETTINGS_SECTION_NOTIFICATIONS]: undefined;
  [Routes.SETTINGS_SECTION_PRIVACY]: undefined;
  [Routes.SECRET_WARNING]: {
    title: string;
    walletId: string;
    privateKeyAddress?: string;
    isBackingUp?: boolean;
    backupType?: keyof typeof WalletBackupTypes;
  };
  [Routes.WALLET_NOTIFICATIONS_SETTINGS]: {
    address: string;
    title: string;
    notificationSettings: WalletNotificationSettings;
  };
};

export type SendParams = {
  asset?: ParsedAddressAsset | UniqueAsset;
  address?: string;
  nativeAmount?: string;
  fromProfile?: boolean;
  shouldShowChecks?: boolean;
};

export type WalletScreenParams = {
  initialized?: boolean;
  emptyWallet?: boolean;
};

export type SettingsSheetParams = {
  initialRoute?: keyof SettingsStackParams;
};

export type RootStackParamList = {
  [Routes.CHANGE_WALLET_SHEET]: {
    watchOnly?: boolean;
    currentAccountAddress?: string;
    onChangeWallet?: (address: Address, wallet: RainbowWallet) => void;
    hideReadOnlyWallets?: boolean;
  };
  [Routes.WALLET_NOTIFICATIONS_SETTINGS]: {
    address: string;
    title: string;
    notificationSettings: WalletNotificationSettings;
  };
  [Routes.SPEED_UP_AND_CANCEL_BOTTOM_SHEET]: {
    accentColor?: string;
    tx: PendingTransaction;
    type: 'speed_up' | 'cancel';
  };
  [Routes.SPEED_UP_AND_CANCEL_SHEET]: {
    accentColor?: string;
    tx: PendingTransaction;
    type: 'speed_up' | 'cancel';
  };
  [Routes.SWIPE_LAYOUT]: NavigatorScreenParams<{
    [Routes.WALLET_SCREEN]: WalletScreenParams;
  }>;
  [Routes.SETTINGS_SECTION_BACKUP]: {
    walletId?: string;
    initialRoute?: string;
  };
  [Routes.BACKUP_SHEET]: {
    isFromWalletReadyPrompt?: boolean;
    nativeScreen?: boolean;
    selectedBackup?: BackupFile;
    step: string;
    walletId?: string;
    onSuccess?: (password: string) => Promise<void>;
    onCancel?: () => Promise<void>;
  };
  [Routes.BACKUP_SCREEN]: {
    nativeScreen: boolean;
    step: string;
    walletId: string;
  };
  [Routes.SEND_CONFIRMATION_SHEET]: {
    amountDetails: {
      assetAmount: string;
      isSufficientBalance: boolean;
      nativeAmount: string;
    };
    asset: ParsedAddressAsset | UniqueAsset;
    callback: (...args: any[]) => Promise<boolean | undefined>;
    checkboxes: Checkbox[];
    ensProfile: ENSProfile;
    isENS: boolean;
    isL2: boolean;
    isNft: boolean;
    chainId: ChainId;
    profilesEnabled: boolean;
    to: string;
    toAddress: string;
  };
  [Routes.EXPLAIN_SHEET]: ExplainSheetRouteParams;
  [Routes.PORTAL]: PortalSheetProps;
  [Routes.WALLET_SCREEN]: WalletScreenParams;
  [Routes.ENS_CONFIRM_REGISTER_SHEET]: {
    externalAvatarUrl?: string | null;
    longFormHeight?: number;
    mode?: REGISTRATION_MODES;
    name?: string;
    ensName?: string;
  };
  [Routes.ENS_INTRO_SHEET]: {
    contentHeight?: number;
    onSearchForNewName?: () => void;
    onSelectExistingName?: () => void;
  };
  [Routes.SHOWCASE_SHEET]: {
    address: string;
    fromRoute: string;
  };
  [Routes.PROFILE_SHEET]: {
    address: string;
    fromRoute: string;
  };
  [Routes.PROFILE_PREVIEW_SHEET]: {
    address: string;
    descriptionProfilePreviewHeight: number;
    fromRoute: string;
  };
  [Routes.AVATAR_BUILDER_WALLET]: {
    initialAccountColor: number;
    initialAccountName: string;
  };
  [Routes.AVATAR_BUILDER]: {
    initialAccountColor: number;
    initialAccountName: string;
  };
  [Routes.TRANSACTION_DETAILS]: {
    transaction: RainbowTransaction;
    longFormHeight?: number;
  };
  [Routes.REGISTER_ENS_NAVIGATOR]: {
    ensName?: string;
    mode?: REGISTRATION_MODES;
    autoFocusKey?: string;
    externalAvatarUrl?: string | null;
    sheetRef?: MutableRefObject<ScrollView>;
  };
  [Routes.MINT_SHEET]: {
    collection: ReservoirCollection;
    pricePerMint: BigNumberish | undefined;
  };
  [Routes.SELECT_UNIQUE_TOKEN_SHEET]: {
    onSelect: (asset: UniqueAsset) => void;
    springDamping?: number;
    topOffset?: number;
  };
  [Routes.EXTERNAL_LINK_WARNING_SHEET]: {
    url: string;
    onClose?: () => void;
  };
  [Routes.APP_ICON_UNLOCK_SHEET]: {
    longFormHeight?: number;
    appIconKey: UnlockableAppIconKey;
  };
  [Routes.CUSTOM_GAS_SHEET]: {
    asset?: Partial<ParsedAddressAsset>;
    fallbackColor?: string;
    focusTo: string | null;
    openCustomOptions: (focusTo: string) => void;
    speeds: string[];
    type: 'custom_gas';
  };
  [Routes.REMOTE_PROMO_SHEET]: CampaignCheckResult;
  [Routes.CHECK_IDENTIFIER_SCREEN]: {
    step: (typeof walletBackupStepTypes)[keyof typeof walletBackupStepTypes];
    onSuccess: () => Promise<void>;
    onFailure: () => Promise<void>;
  };
  [Routes.SWAP]: SwapsParams & {
    action?: 'open_swap_settings';
  };
  [Routes.CLAIM_CLAIMABLE_PANEL]: {
    claimable: Claimable;
  };
  [Routes.WALLET_CONNECT_APPROVAL_SHEET]: WalletconnectApprovalSheetRouteParams & {
    type?: WalletConnectApprovalSheetType;
  };
  [Routes.WALLET_CONNECT_REDIRECT_SHEET]: {
    type: WalletconnectResultType;
    cb?: () => void;
  };
  [Routes.CONSOLE_SHEET]: {
    referralCode?: string;
    deeplinked?: boolean;
    viewWeeklyEarnings?: boolean;
  };
  [Routes.PIN_AUTHENTICATION_SCREEN]: {
    onCancel: () => void;
    onSuccess: (pin: string | undefined) => void;
    validPin: string | undefined;
  };
  [Routes.EXPANDED_ASSET_SHEET]: {
    longFormHeight?: number;
    type: 'unique_token';
    asset: ParsedAddressAsset | UniqueAsset;
    backgroundOpacity?: number;
    cornerRadius?: 'device' | 'small' | 'medium' | 'large';
    external?: boolean;
    springDamping?: number;
    topOffset?: number;
    transitionDuration?: number;
    focusTo?: 'focusToMinerTip';
    chartType?: ChartTime;
  };
  [Routes.EXPANDED_ASSET_SHEET_V2]: {
    address: string;
    chainId: ChainId;
    asset: ExpandedSheetParamAsset;
    hideClaimSection?: boolean;
    chartType?: ChartTime;
  };
  [Routes.POSITION_SHEET]: {
    position: RainbowPosition;
  };
  [Routes.NETWORK_SELECTOR]: {
    selected: SharedValue<ChainId> | SharedValue<ChainId | undefined> | SharedValue<UserAssetFilter | undefined> | ChainId | undefined;
    setSelected: (chainId: ChainId | undefined) => void;
    onClose?: VoidFunction;
    fillPinnedSection?: boolean;
    canSelect?: boolean;
    canEdit?: boolean;
    canSelectAllNetworks?: boolean;
    allowedNetworks?: ChainId[];
    goBackOnSelect?: boolean;
    title?: string;
    actionButton?: {
      color?: TextProps['color'];
      icon?: string;
      weight?: TextProps['weight'];
      label: string;
      onPress?: () => void;
    };
  };
  [Routes.CLAIM_AIRDROP_SHEET]: {
    claimable: RainbowClaimable;
    hideViewTokenButton?: boolean;
  };
  [Routes.LOG_SHEET]: {
    data: {
      title: string;
      message: string;
    }[];
  };
  [Routes.SEND_SHEET]: SendParams;
  [Routes.SEND_FLOW]:
    | NavigatorScreenParams<{
        [Routes.SEND_SHEET]: SendParams;
        [Routes.MODAL_SCREEN]: ModalParams;
      }>
    | SendParams;
  [Routes.PAIR_HARDWARE_WALLET_AGAIN_SHEET]: HardwareWalletTxParams;
  [Routes.HARDWARE_WALLET_TX_NAVIGATOR]:
    | HardwareWalletTxParams
    | NavigatorScreenParams<{
        [Routes.PAIR_HARDWARE_WALLET_ERROR_SHEET]: {
          errorType: LEDGER_ERROR_CODES;
          deviceId?: string;
        };
      }>;
  [Routes.PAIR_HARDWARE_WALLET_SIGNING_SHEET]: {
    shouldGoBack?: boolean;
  };
  [Routes.DIAGNOSTICS_SHEET]: {
    userPin?: string;
  };
  [Routes.SELECT_ENS_SHEET]: {
    onSelectENS: (ensName: string) => void;
  };
  [Routes.PAIR_HARDWARE_WALLET_ERROR_SHEET]: {
    errorType: LEDGER_ERROR_CODES;
    deviceId?: string;
  };
  [Routes.CONFIRM_REQUEST]: SignTransactionSheetParams;
  [Routes.SETTINGS_SHEET]: undefined | NavigatorScreenParams<SettingsStackParams>;
  [Routes.SECRET_WARNING]: {
    title: string;
    privateKeyAddress?: string;
    isBackingUp?: boolean;
    backupType?: keyof typeof WalletBackupTypes;
    walletId: string;
    secretText?: string;
  };
  [Routes.SHOW_SECRET]: {
    title: string;
    privateKeyAddress?: string;
    isBackingUp?: boolean;
    backupType?: keyof typeof WalletBackupTypes;
    walletId: string;
    secretText?: string;
  };
  [Routes.RESTORE_CLOUD_SHEET]: {
    selectedBackup: BackupFile;
  };

  [Routes.TOKEN_LAUNCHER_SCREEN]: {
    gestureEnabled?: boolean;
  };

  [Routes.LEARN_WEB_VIEW_SCREEN]: {
    category: LearnCategory;
    url: string;
    displayType: CardType;
    routeName: string;
    key: LearnCardKey;
  };

  [Routes.NFT_SINGLE_OFFER_SHEET]: {
    offer: NftOffer;
    longFormHeight?: number;
  };

  [Routes.VIEW_CLOUD_BACKUPS]: {
    backups: CloudBackups;
    title: string;
  };

  [Routes.VIEW_WALLET_BACKUP]: {
    imported?: boolean;
    title: string;
    walletId: string;
  };

  [Routes.RESTORE_SHEET]: {
    fromSettings?: boolean;
  };
  [Routes.PAIR_HARDWARE_WALLET_NAVIGATOR]:
    | NavigatorScreenParams<{
        [Routes.PAIR_HARDWARE_WALLET_SIGNING_SHEET]: { shouldGoBack?: boolean };
        [Routes.PAIR_HARDWARE_WALLET_INTRO_SHEET]: undefined;
      }>
    | PairHardwareWalletNavigatorParams;
  [Routes.PAIR_HARDWARE_WALLET_INTRO_SHEET]: PairHardwareWalletNavigatorParams;
  [Routes.ADD_WALLET_NAVIGATOR]:
    | NavigatorScreenParams<{
        [Routes.ADD_WALLET_SHEET]: AddWalletNavigatorParams;
        [Routes.IMPORT_OR_WATCH_WALLET_SHEET]: AddWalletNavigatorParams;
      }>
    | AddWalletNavigatorParams;
  [Routes.ADD_WALLET_SHEET]: AddWalletNavigatorParams;
  [Routes.IMPORT_OR_WATCH_WALLET_SHEET]: AddWalletNavigatorParams;
  [Routes.DAPP_BROWSER_SCREEN]: {
    url?: string;
  };
  [Routes.DAPP_BROWSER_CONTROL_PANEL]: {
    activeTabRef: MutableRefObject<ActiveTabRef | null>;
  };
  [Routes.CHOOSE_WALLET_GROUP]: undefined;
  [Routes.POAP_SHEET]: {
    event: PoapEvent;
  };
  [Routes.MODAL_SCREEN]: ModalParams;
} & UntypedRoutes;
