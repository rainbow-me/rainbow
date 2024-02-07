import { captureException } from '@sentry/react-native';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setWalletBackedUp } from '../redux/wallets';
import WalletBackupTypes from '@/helpers/walletBackupTypes';
import logger from '@/utils/logger';

export default function useWalletManualBackup() {
  const dispatch = useDispatch();

  const onManuallyBackupWalletId = useCallback(
    async (walletId: string) => {
      try {
        await dispatch(setWalletBackedUp(walletId, WalletBackupTypes.manual));
      } catch (e) {
        logger.sentry(`error while trying to set walletId ${walletId} as manually backed up`);
        captureException(e);
      }
    },
    [dispatch]
  );

  return {
    onManuallyBackupWalletId,
  };
}
