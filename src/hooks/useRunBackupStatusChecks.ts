import { useEffect } from 'react';
import { logger } from '@/logger';
import { runWalletBackupStatusChecks } from '@/handlers/walletReadyEvents';

type UseRunBackupStatusChecksProps = {
  walletReady: boolean;
};

export function useRunBackupStatusChecks({ walletReady }: UseRunBackupStatusChecksProps) {
  useEffect(() => {
    if (walletReady) {
      logger.info('✅ Wallet ready!');
      runWalletBackupStatusChecks();
    }
  }, [walletReady]);
}
