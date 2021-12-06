import { captureException } from '@sentry/react-native';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setWalletBackedUp } from '../redux/wallets';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/walletBack... Remove this comment to see the full error message
import WalletBackupTypes from '@rainbow-me/helpers/walletBackupTypes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
import logger from 'logger';

export default function useWalletManualBackup() {
  const dispatch = useDispatch();

  const onManuallyBackupWalletId = useCallback(
    async walletId => {
      try {
        await dispatch(setWalletBackedUp(walletId, WalletBackupTypes.manual));
      } catch (e) {
        logger.sentry(
          `error while trying to set walletId ${walletId} as manually backed up`
        );
        captureException(e);
      }
    },
    [dispatch]
  );

  return {
    onManuallyBackupWalletId,
  };
}
