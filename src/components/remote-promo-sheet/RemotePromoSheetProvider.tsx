import React, {
  useEffect,
  createContext,
  PropsWithChildren,
  useRef,
} from 'react';
import { checkForCampaign } from './checkForCampaign';
import { InteractionManager } from 'react-native';
import { IS_TESTING } from 'react-native-dotenv';
import { REMOTE_PROMO_SHEETS, useExperimentalFlag } from '@/config';
import { logger } from '@/logger';
import { campaigns } from '@/storage';

interface WalletReadyContext {
  isWalletReady: boolean;
}

export const RemotePromoSheetContext = createContext<WalletReadyContext>({
  isWalletReady: false,
});

type WalletReadyProvider = PropsWithChildren & WalletReadyContext;

const REFETCH_INTERVAL = 30_000;
const TIMEOUT_BETWEEN_PROMOS = 5 * 60 * 1000; // 5 minutes in milliseconds

const timeBetweenPromoSheets = () => {
  const lastShownTimestamp = campaigns.get(['lastShownTimestamp']);

  if (!lastShownTimestamp) return TIMEOUT_BETWEEN_PROMOS;

  return Date.now() - lastShownTimestamp;
};

export const RemotePromoSheetProvider = ({
  isWalletReady = false,
  children,
}: WalletReadyProvider) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const remotePromoSheets = useExperimentalFlag(REMOTE_PROMO_SHEETS);

  useEffect(() => {
    const checkAndRun = async () => {
      const isCurrentlyShown = campaigns.get(['isCurrentlyShown']);
      if (isCurrentlyShown || !remotePromoSheets) return;

      // reset interval to be the time between promo sheets in order to save machine resources
      if (timeBetweenPromoSheets() < TIMEOUT_BETWEEN_PROMOS) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(
          checkAndRun,
          timeBetweenPromoSheets()
        );
        return;
      }

      return checkForCampaign();
    };

    const runChecks = async () => {
      if (!isWalletReady) return;

      InteractionManager.runAfterInteractions(() => {
        setTimeout(async () => {
          if (IS_TESTING === 'true') return;

          logger.info('Setting campaign check interval');
          checkAndRun();
          intervalRef.current = setInterval(checkAndRun, REFETCH_INTERVAL);
        }, 2_000);
      });
    };

    runChecks();

    return () => {
      campaigns.remove(['lastShownTimestamp']);
      campaigns.set(['isCurrentlyShown'], false);
    };
  }, [isWalletReady, remotePromoSheets]);

  return (
    <RemotePromoSheetContext.Provider value={{ isWalletReady }}>
      {children}
    </RemotePromoSheetContext.Provider>
  );
};
