import { useCallback, useState } from 'react';
import { performanceTracking, TimeToSignOperation } from '@/state/performance/performance';
import Routes from '@/navigation/routesNames';
import { Navigation } from '@/navigation';
import { RequestSource } from '@/utils/requestNavigationHandlers';
import { SCREEN_FOR_REQUEST_SOURCE } from '@/components/Transactions/constants';
import { logger, RainbowError } from '@/logger';

export const useTransactionSubmission = ({
  isMessageRequest,
  isBalanceEnough,
  accountInfo,
  onConfirm,
  source,
}: {
  isMessageRequest: boolean;
  isBalanceEnough: boolean | undefined;
  accountInfo: { isHardwareWallet: boolean };
  onConfirm: () => Promise<void>;
  source: RequestSource;
}) => {
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const onPressSend = useCallback(async () => {
    if (isAuthorizing) return;
    try {
      setIsAuthorizing(true);
      await onConfirm();
    } catch (error) {
      logger.error(new RainbowError(`[useTransactionSubmission]: Error while sending transaction: ${error}`));
    } finally {
      setIsAuthorizing(false);
    }
  }, [isAuthorizing, onConfirm, setIsAuthorizing]);

  const submitFn = useCallback(
    () =>
      performanceTracking.getState().executeFn({
        fn: async () => {
          if (!isBalanceEnough && !isMessageRequest) {
            return Navigation.handleAction(Routes.ADD_CASH_SHEET);
          }

          if (accountInfo.isHardwareWallet) {
            return Navigation.handleAction(Routes.HARDWARE_WALLET_TX_NAVIGATOR, { submit: onPressSend });
          }

          return onPressSend();
        },
        operation: TimeToSignOperation.CallToAction,
        screen: SCREEN_FOR_REQUEST_SOURCE[source],
      })(),
    [accountInfo.isHardwareWallet, isBalanceEnough, isMessageRequest, onPressSend, source]
  );

  return { submitFn, isAuthorizing };
};
