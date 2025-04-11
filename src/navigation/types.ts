import { createStackNavigator } from '@react-navigation/stack';
import Routes from '@/navigation/routesNames';
import { PortalSheetProps } from '@/screens/Portal';
import { REGISTRATION_MODES } from '@/helpers/ens';
import { CampaignCheckResult } from '@/components/remote-promo-sheet/checkForRemotePromoSheet';
import { ParsedAddressAsset, PendingTransaction, UniqueAsset } from '@/entities';
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

export interface ExplainSheetParameterMap extends CurrentBaseFeeTypes {
  network: { chainId: ChainId };
  op_rewards_airdrop_timing: Record<string, never>;
  op_rewards_amount_distributed: Record<string, never>;
  op_rewards_bridge: { percent?: number };
  op_rewards_swap: { percent?: number };
  op_rewards_position: Record<string, never>;
  output_disabled: {
    inputToken: string;
    outputToken: string;
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

type ExplainSheetParams<T extends ExplainSheetType> = ExplainSheetBaseParams & {
  type: T;
} & (ExplainSheetParameterMap[T] extends Record<string, never> ? object : ExplainSheetParameterMap[T]);

export type ExplainSheetRouteParams = {
  [K in ExplainSheetType]: ExplainSheetParams<K>;
}[ExplainSheetType];

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface RootParamList extends RootStackParamList {}
  }
}

export type RootStackParamList = {
  [Routes.SEND_SHEET]: {
    asset?: ParsedAddressAsset | UniqueAsset;
    address?: string;
    nativeAmount?: string;
    fromProfile?: boolean;
  };
  [Routes.CHANGE_WALLET_SHEET]: {
    watchOnly?: boolean;
    currentAccountAddress?: string;
    onChangeWallet?: (address: string | Address, wallet?: RainbowWallet) => void;
    hideReadOnlyWallets?: boolean;
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
  [Routes.BACKUP_SHEET]: {
    nativeScreen: boolean;
    step: string;
    walletId: string;
    onSuccess: (password: string) => Promise<void>;
    onCancel: () => Promise<void>;
  };
  [Routes.BACKUP_SCREEN]: {
    nativeScreen: boolean;
    step: string;
    walletId: string;
  };
  [Routes.SETTINGS_BACKUP_VIEW]: undefined;
  [Routes.SEND_CONFIRMATION_SHEET]: {
    shouldShowChecks: boolean;
  };
  [Routes.EXPLAIN_SHEET]: ExplainSheetRouteParams;
  [Routes.PORTAL]: PortalSheetProps;
  [Routes.WALLET_SCREEN]: {
    initialized?: boolean;
    emptyWallet?: boolean;
  };
  [Routes.PROFILE_SCREEN]: undefined;
  [Routes.WELCOME_SCREEN]: undefined;
  [Routes.ENS_CONFIRM_REGISTER_SHEET]: undefined;
  [Routes.PROFILE_SHEET]: {
    address: string;
    fromRoute: string;
  };
  [Routes.REGISTER_ENS_NAVIGATOR]: {
    ensName: string;
    mode: REGISTRATION_MODES;
  };
  [Routes.REMOTE_PROMO_SHEET]: CampaignCheckResult;
  [Routes.CHECK_IDENTIFIER_SCREEN]: {
    onSuccess: () => Promise<void>;
    onFailure: () => Promise<void>;
  };
  [Routes.SWAP]: {
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
  };
  [Routes.EXPANDED_ASSET_SHEET]: {
    longFormHeight: number;
    type: 'token' | 'unique_token';
    asset: ParsedAddressAsset | UniqueAsset;
  };
  [Routes.EXPANDED_ASSET_SHEET_V2]: {
    address: string;
    chainId: ChainId;
    asset: ExpandedSheetParamAsset;
    hideClaimSection?: boolean;
  };
  [Routes.POSITION_SHEET]: {
    position: RainbowPosition;
  };
  [Routes.NETWORK_SELECTOR]: {
    selected: SharedValue<ChainId | undefined> | ChainId | undefined;
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
  [Routes.ADD_CASH_SHEET]: undefined;
  [Routes.SEND_FLOW]: {
    asset?: ParsedAddressAsset | UniqueAsset;
    address?: string;
    nativeAmount?: string;
    fromProfile?: boolean;
  };
  [Routes.HARDWARE_WALLET_TX_NAVIGATOR]: {
    submit: () => Promise<void>;
  };
  [Routes.CONFIRM_REQUEST]: {
    transactionDetails: RequestData;
    onSuccess: (result: string) => Promise<void> | void;
    onCancel: () => Promise<void> | void;
    onCloseScreen: (canceled: boolean) => void;
    chainId: ChainId;
    address: string | undefined;
    source: RequestSource;
  };

  // Catch-all for any other route not explicitly defined
  [key: string]: Record<string, any> | undefined;
};
