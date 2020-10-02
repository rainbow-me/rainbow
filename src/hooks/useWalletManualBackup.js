import { captureException } from '@sentry/react-native';
import { useCallback } from 'react';
import { setWalletBackedUp } from '../redux/wallets';
import WalletBackupTypes from '@rainbow-me/helpers/walletBackupTypes';
import { useDispatch } from '@rainbow-me/react-redux';
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
