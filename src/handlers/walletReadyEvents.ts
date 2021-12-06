import { filter, find } from 'lodash';
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
import { IS_TESTING } from 'react-native-dotenv';
import { triggerOnSwipeLayout } from '../navigation/onNavigationStateChange';
import { getKeychainIntegrityState } from './localstorage/globalSettings';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/walletBack... Remove this comment to see the full error message
import WalletBackupStepTypes from '@rainbow-me/helpers/walletBackupStepTypes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/walletType... Remove this comment to see the full error message
import WalletTypes from '@rainbow-me/helpers/walletTypes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { Navigation } from '@rainbow-me/navigation';

// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/store' or it... Remove this comment to see the full error message
import store from '@rainbow-me/redux/store';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/wallets' or ... Remove this comment to see the full error message
import { checkKeychainIntegrity } from '@rainbow-me/redux/wallets';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
import logger from 'logger';

const BACKUP_SHEET_DELAY_MS = 3000;

export const runKeychainIntegrityChecks = async () => {
  const keychainIntegrityState = await getKeychainIntegrityState();
  if (!keychainIntegrityState) {
    await store.dispatch(checkKeychainIntegrity());
  }
};

export const runWalletBackupStatusChecks = () => {
  const { selected, wallets } = store.getState().wallets;

  // count how many visible, non-imported and non-readonly wallets are not backed up
  const rainbowWalletsNotBackedUp = filter(wallets, wallet => {
    const hasVisibleAccount = find(
      wallet.addresses,
      account => account.visible
    );
    return (
      !wallet.imported &&
      hasVisibleAccount &&
      wallet.type !== WalletTypes.readOnly &&
      !wallet.backedUp
    );
  });

  if (!rainbowWalletsNotBackedUp.length) return;

  logger.log('there is a rainbow wallet not backed up');
  const hasSelectedWallet = find(
    rainbowWalletsNotBackedUp,
    notBackedUpWallet => notBackedUpWallet.id === selected.id
  );

  logger.log(
    'rainbow wallet not backed up that is selected?',
    hasSelectedWallet
  );

  // if one of them is selected, show the default BackupSheet
  if (selected && hasSelectedWallet && IS_TESTING !== 'true') {
    logger.log('showing default BackupSheet');
    setTimeout(() => {
      triggerOnSwipeLayout(() =>
        Navigation.handleAction(Routes.BACKUP_SHEET, { single: true })
      );
    }, BACKUP_SHEET_DELAY_MS);
    return;
  }

  // otherwise, show the BackupSheet redirecting to the WalletSelectionList
  IS_TESTING !== 'true' &&
    setTimeout(() => {
      logger.log('showing BackupSheet with existing_user step');
      triggerOnSwipeLayout(() =>
        Navigation.handleAction(Routes.BACKUP_SHEET, {
          single: true,
          step: WalletBackupStepTypes.existing_user,
        })
      );
    }, BACKUP_SHEET_DELAY_MS);
  return;
};
