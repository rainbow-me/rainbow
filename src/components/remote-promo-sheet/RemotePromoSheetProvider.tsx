import React, {
  useEffect,
  createContext,
  PropsWithChildren,
  useRef,
} from 'react';
import { MMKV } from 'react-native-mmkv';
import { checkForCampaign } from './checkForCampaign';
import { InteractionManager } from 'react-native';
import { IS_TESTING } from 'react-native-dotenv';
import { STORAGE_IDS } from '@/model/mmkv';
import { REMOTE_PROMO_SHEETS, useExperimentalFlag } from '@/config';
import { logger } from '@/logger';

const mmkv = new MMKV();

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
  const lastPromoSheetShown = mmkv.getNumber(
    STORAGE_IDS.LAST_PROMO_SHEET_TIMESTAMP
  );
  if (!lastPromoSheetShown) return TIMEOUT_BETWEEN_PROMOS;

  return Date.now() - lastPromoSheetShown;
};

export const RemotePromoSheetProvider = ({
  isWalletReady = false,
  children,
}: WalletReadyProvider) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const remotePromoSheets = useExperimentalFlag(REMOTE_PROMO_SHEETS);

  useEffect(() => {
    const checkAndRun = async () => {
      const isPromoCurrentlyShown = mmkv.getBoolean(
        STORAGE_IDS.PROMO_CURRENTLY_SHOWN
      );

      if (isPromoCurrentlyShown || !remotePromoSheets) return;

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

          logger.log('Setting campaign check interval');
          checkAndRun();
          intervalRef.current = setInterval(checkAndRun, REFETCH_INTERVAL);
        }, 2_000);
      });
    };

    runChecks();

    return () => {
      mmkv.delete(STORAGE_IDS.LAST_PROMO_SHEET_TIMESTAMP);
      mmkv.set(STORAGE_IDS.PROMO_CURRENTLY_SHOWN, false);
    };
  }, [isWalletReady, remotePromoSheets]);

  return (
    <RemotePromoSheetContext.Provider value={{ isWalletReady }}>
      {children}
    </RemotePromoSheetContext.Provider>
  );
};
