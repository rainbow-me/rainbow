import React, { useEffect, createContext, PropsWithChildren, useCallback, useContext } from 'react';
import { IS_TESTING } from 'react-native-dotenv';
import { InteractionManager } from 'react-native';
import { noop } from 'lodash';

import { REMOTE_PROMO_SHEETS, useExperimentalFlag } from '@/config';
import { logger } from '@/logger';
import { campaigns } from '@/storage';
import { checkForCampaign } from '@/components/remote-promo-sheet/checkForCampaign';
import { runFeatureUnlockChecks } from '@/handlers/walletReadyEvents';
import { runLocalCampaignChecks } from './localCampaignChecks';
import { useRemoteConfig } from '@/model/remoteConfig';

interface WalletReadyContext {
  isWalletReady: boolean;
  runChecks: () => void;
}

export const RemotePromoSheetContext = createContext<WalletReadyContext>({
  isWalletReady: false,
  runChecks: noop,
});

type WalletReadyProvider = PropsWithChildren & WalletReadyContext;

export const RemotePromoSheetProvider = ({ isWalletReady = false, children }: Omit<WalletReadyProvider, 'runChecks'>) => {
  // const { remote_promo_enabled } = useRemoteConfig();
  const remotePromoSheets = useExperimentalFlag(REMOTE_PROMO_SHEETS);

  const runChecks = useCallback(async () => {
    if (!isWalletReady) return;

    InteractionManager.runAfterInteractions(async () => {
      setTimeout(async () => {
        if (IS_TESTING === 'true') return;

        // Stop checking for promo sheets if the exp. flag is toggled off
        if (!remotePromoSheets) {
          logger.info('Campaigns: remote promo sheets is disabled');
          return;
        }

        const showedFeatureUnlock = await runFeatureUnlockChecks();
        if (showedFeatureUnlock) return;

        const showedLocalPromo = await runLocalCampaignChecks();
        if (showedLocalPromo) return;

        checkForCampaign();
      }, 2_000);
    });
  }, [isWalletReady, remotePromoSheets]);

  useEffect(() => {
    runChecks();

    return () => {
      campaigns.remove(['lastShownTimestamp']);
      campaigns.set(['isCurrentlyShown'], false);
    };
  }, [runChecks]);

  return <RemotePromoSheetContext.Provider value={{ isWalletReady, runChecks }}>{children}</RemotePromoSheetContext.Provider>;
};

export const useRemotePromoSheetContext = () => useContext(RemotePromoSheetContext);
