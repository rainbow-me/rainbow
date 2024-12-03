import * as i18n from '@/languages';

export const WalletLoadingStates = {
  BACKING_UP_WALLET: i18n.t('loading.backing_up'),
  CREATING_WALLET: i18n.t('loading.creating_wallet'),
  IMPORTING_WALLET: i18n.t('loading.importing_wallet'),
  RESTORING_WALLET: i18n.t('loading.restoring'),
} as const;

export type WalletLoadingStates = (typeof WalletLoadingStates)[keyof typeof WalletLoadingStates];
