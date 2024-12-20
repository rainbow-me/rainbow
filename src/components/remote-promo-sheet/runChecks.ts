import { IS_TEST } from '@/env';
import { runFeaturesLocalCampaignAndBackupChecks } from '@/handlers/walletReadyEvents';
import { logger } from '@/logger';
import { checkForRemotePromoSheet } from '@/components/remote-promo-sheet/checkForRemotePromoSheet';
import { useCallback, useEffect } from 'react';
import { InteractionManager } from 'react-native';
import { useRemoteConfig } from '@/model/remoteConfig';
import { REMOTE_PROMO_SHEETS, useExperimentalFlag } from '@/config';

export const useRunChecks = ({ runChecksOnMount = true, walletReady }: { runChecksOnMount?: boolean; walletReady: boolean }) => {
  const { remote_promo_enabled } = useRemoteConfig();
  const remotePromoSheets = useExperimentalFlag(REMOTE_PROMO_SHEETS) || remote_promo_enabled;

  const runChecks = useCallback(() => {
    InteractionManager.runAfterInteractions(async () => {
      if (IS_TEST) {
        logger.debug('[useRunChecks]: running checks in disabled in test mode');
        return;
      }

      if (await runFeaturesLocalCampaignAndBackupChecks()) return;

      if (!remotePromoSheets) {
        logger.debug('[useRunChecks]: remote promo sheets is disabled');
        return;
      }

      checkForRemotePromoSheet();
    });
  }, [remotePromoSheets]);

  useEffect(() => {
    if (runChecksOnMount && walletReady) {
      runChecks();
    }
  }, [runChecks, runChecksOnMount, walletReady]);

  return {
    runChecks,
  };
};
