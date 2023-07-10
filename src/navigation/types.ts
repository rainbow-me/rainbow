import { createStackNavigator } from '@react-navigation/stack';

import Routes from '@/navigation/routesNames';

import { PortalSheetProps } from '@/screens/Portal';
import { REGISTRATION_MODES } from '@/helpers/ens';

export type PartialNavigatorConfigOptions = Pick<
  Partial<Parameters<ReturnType<typeof createStackNavigator>['Screen']>[0]>,
  'options'
>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface RootParamList extends RootStackParamList {}
  }
}

export type RootStackParamList = {
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
    stemp: string;
    walletId: string;
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
  [Routes.WALLET_SCREEN]: any;
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
};
