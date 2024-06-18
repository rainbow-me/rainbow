import { IS_TEST } from '@/env';
import { runFeatureUnlockChecks } from '@/handlers/walletReadyEvents';
import { logger } from '@/logger';
import { runLocalCampaignChecks } from './localCampaignChecks';
import { checkForCampaign } from './checkForCampaign';
import { useCallback, useEffect } from 'react';
import { InteractionManager } from 'react-native';
import { useRemoteConfig } from '@/model/remoteConfig';
import { REMOTE_PROMO_SHEETS, useExperimentalFlag } from '@/config';

export const useRunChecks = (runChecksOnMount = true) => {
  const { remote_promo_enabled } = useRemoteConfig();
  const remotePromoSheets = useExperimentalFlag(REMOTE_PROMO_SHEETS) || remote_promo_enabled;

  const runChecks = useCallback(() => {
    InteractionManager.runAfterInteractions(async () => {
      if (IS_TEST || !remotePromoSheets) {
        logger.debug('Campaigns: remote promo sheets is disabled');
        return;
      }

      const showedFeatureUnlock = await runFeatureUnlockChecks();
      if (showedFeatureUnlock) return;

      const showedLocalPromo = await runLocalCampaignChecks();
      if (showedLocalPromo) return;

      checkForCampaign();
    });
  }, [remotePromoSheets]);

  useEffect(() => {
    if (runChecksOnMount) {
      setTimeout(runChecks, 10_000);
    }
  }, [runChecks, runChecksOnMount]);

  return {
    runChecks,
  };
};
