import * as i18n from '@/languages';

export const WalletLoadingStates = {
  BACKING_UP_WALLET: i18n.t(i18n.l.loading.backing_up),
  CREATING_WALLET: i18n.t(i18n.l.loading.creating_wallet),
  IMPORTING_WALLET: i18n.t(i18n.l.loading.importing_wallet),
  RESTORING_WALLET: i18n.t(i18n.l.loading.restoring),
} as const;

export type WalletLoadingStates = (typeof WalletLoadingStates)[keyof typeof WalletLoadingStates];
