import { createStackNavigator } from '@react-navigation/stack';
import Routes from '@/navigation/routesNames';
import { PortalSheetProps } from '@/screens/Portal';
import { REGISTRATION_MODES } from '@/helpers/ens';
import { CampaignCheckResult } from '@/components/remote-promo-sheet/checkForRemotePromoSheet';
import { ParsedAddressAsset, PendingTransaction, UniqueAsset } from '@/entities';
import { Claimable, RainbowClaimable } from '@/resources/addys/claimables/types';
import { WalletconnectApprovalSheetRouteParams, WalletconnectResultType } from '@/walletConnect/types';
import { WalletConnectApprovalSheetType } from '@/helpers/walletConnectApprovalSheetTypes';
import { RainbowWallet } from '@/model/wallet';
import { RainbowPosition } from '@/resources/defi/types';
import { Address } from 'viem';
import { SharedValue } from 'react-native-reanimated';
import { ChainId } from '@/state/backendNetworks/types';
import { ExpandedSheetParamAsset } from '@/screens/expandedAssetSheet/context/ExpandedAssetSheetContext';
import { TextProps } from '@/design-system';
import { Checkbox } from '@/screens/SendConfirmationSheet';
import { ENSProfile } from '@/entities/ens';

export type PartialNavigatorConfigOptions = Pick<Partial<Parameters<ReturnType<typeof createStackNavigator>['Screen']>[0]>, 'options'>;

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
  [Routes.SETTINGS_BACKUP_VIEW]: any;
  [Routes.SEND_CONFIRMATION_SHEET]: {
    amountDetails: {
      assetAmount: string;
      isSufficientBalance: boolean;
      nativeAmount: string;
    };
    asset: ParsedAddressAsset | UniqueAsset;
    callback: (...args: unknown[]) => Promise<boolean>;
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
  [Routes.EXPLAIN_SHEET]: {
    type: string;
    [key: string]: any;
  };
  [Routes.PORTAL]: PortalSheetProps;
  [Routes.WALLET_SCREEN]: {
    initialized?: boolean;
    emptyWallet?: boolean;
  };
  [Routes.PROFILE_SCREEN]: any;
  [Routes.WELCOME_SCREEN]: any;
  [Routes.ENS_CONFIRM_REGISTER_SHEET]: any;
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
    type: WalletConnectApprovalSheetType;
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
  [Routes.SHOWCASE_SHEET]: {
    address: string;
  };
};
