import WalletBackupTypes from '@/helpers/walletBackupTypes';
import { logger, RainbowError } from '@/logger';
import { useCallback } from 'react';
import { setWalletBackedUp } from '../redux/wallets';

export default function useWalletManualBackup() {
  const onManuallyBackupWalletId = useCallback(async (walletId: string) => {
    try {
      setWalletBackedUp(walletId, WalletBackupTypes.manual);
    } catch (e) {
      logger.error(new RainbowError(`[useWalletManualBackup]: error while trying to set walletId ${walletId} as manually backed up: ${e}`));
    }
  }, []);

  return {
    onManuallyBackupWalletId,
  };
}
