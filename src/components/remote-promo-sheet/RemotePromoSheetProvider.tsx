import React, {
  useEffect,
  createContext,
  PropsWithChildren,
  useRef,
  useState,
} from 'react';
import { IS_TESTING } from 'react-native-dotenv';
import { InteractionManager } from 'react-native';
import { REMOTE_PROMO_SHEETS, useExperimentalFlag } from '@/config';
import { logger } from '@/logger';
import { campaigns } from '@/storage';
import { checkForCampaign } from '@/components/remote-promo-sheet/checkForCampaign';
import { runFeatureUnlockChecks } from '@/handlers/walletReadyEvents';

interface WalletReadyContext {
  isWalletReady: boolean;
}

export const RemotePromoSheetContext = createContext<WalletReadyContext>({
  isWalletReady: false,
});

type WalletReadyProvider = PropsWithChildren & WalletReadyContext;

const REFETCH_INTERVAL = 60_000;
export const RemotePromoSheetProvider = ({
  isWalletReady = false,
  children,
}: WalletReadyProvider) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const remotePromoSheets = useExperimentalFlag(REMOTE_PROMO_SHEETS);
  const [hasRunFeatureUnlockChecks, setHasRunFeatureUnlockChecks] = useState(
    false
  );

  useEffect(() => {
    const runChecks = async () => {
      if (!isWalletReady) return;

      InteractionManager.runAfterInteractions(async () => {
        setTimeout(async () => {
          if (IS_TESTING === 'true') return;

          // Stop checking for promo sheets if the exp. flag is toggled off
          if (!remotePromoSheets) {
            logger.info('Campaigns: remote promo sheets is disabled');
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }

            return;
          }

          // only run the check for feature unlocks once
          if (!hasRunFeatureUnlockChecks) {
            await runFeatureUnlockChecks();
            setHasRunFeatureUnlockChecks(true);
          }

          if (!intervalRef.current) {
            logger.info('Campaigns: Setting campaign check interval');
            checkForCampaign();
            intervalRef.current = setInterval(
              checkForCampaign,
              REFETCH_INTERVAL
            );
          }
        }, 2_000);
      });
    };

    runChecks();

    return () => {
      campaigns.remove(['lastShownTimestamp']);
      campaigns.set(['isCurrentlyShown'], false);
    };
  }, [isWalletReady, remotePromoSheets, hasRunFeatureUnlockChecks]);

  return (
    <RemotePromoSheetContext.Provider value={{ isWalletReady }}>
      {children}
    </RemotePromoSheetContext.Provider>
  );
};
