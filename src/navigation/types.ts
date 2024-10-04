import { createStackNavigator } from '@react-navigation/stack';

import Routes from '@/navigation/routesNames';

import { PortalSheetProps } from '@/screens/Portal';
import { REGISTRATION_MODES } from '@/helpers/ens';
import { CampaignCheckResult } from '@/components/remote-promo-sheet/checkForRemotePromoSheet';
import { ParsedAddressAsset, UniqueAsset } from '@/entities';
import { Claimable } from '@/resources/addys/claimables/types';
import { WalletconnectApprovalSheetRouteParams, WalletconnectResultType } from '@/redux/walletconnect';
import { WalletConnectApprovalSheetType } from '@/helpers/walletConnectApprovalSheetTypes';

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
    watchOnly: boolean;
    currentAccountAddress: string;
    onChangeWallet: (address: string) => void;
  };
  [Routes.SPEED_UP_AND_CANCEL_BOTTOM_SHEET]: {
    accentColor?: string;
    tx: Record<string, any>;
    type: 'speed_up' | 'cancel';
  };
  [Routes.SPEED_UP_AND_CANCEL_SHEET]: {
    accentColor?: string;
    tx: Record<string, any>;
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
    shouldShowChecks: boolean;
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
  [Routes.SWAP_SETTINGS_SHEET]: any;
  [Routes.SWAP_DETAILS_SHEET]: any;
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
};
