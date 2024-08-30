import { useCallback, useState } from 'react';
import { performanceTracking, TimeToSignOperation } from '@/state/performance/performance';
import Routes from '@/navigation/routesNames';
import { useNavigation } from '@/navigation';
import { RequestSource } from '@/utils/requestNavigationHandlers';
import { SCREEN_FOR_REQUEST_SOURCE } from '@/components/Transactions/constants';
import { logger, RainbowError } from '@/logger';

export const useTransactionSubmission = ({
  isBalanceEnough,
  accountInfo,
  onConfirm,
  source,
}: {
  isBalanceEnough: boolean | undefined;
  accountInfo: { isHardwareWallet: boolean };
  onConfirm: () => Promise<void>;
  source: RequestSource;
}) => {
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const { navigate } = useNavigation();

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
  }, [isAuthorizing, onConfirm]);

  const submitFn = useCallback(
    () =>
      performanceTracking.getState().executeFn({
        fn: async () => {
          if (!isBalanceEnough) {
            navigate(Routes.ADD_CASH_SHEET);
            return;
          }
          if (accountInfo.isHardwareWallet) {
            navigate(Routes.HARDWARE_WALLET_TX_NAVIGATOR, { submit: onPressSend });
          } else {
            await onPressSend();
          }
        },
        operation: TimeToSignOperation.CallToAction,
        screen: SCREEN_FOR_REQUEST_SOURCE[source],
      })(),
    [accountInfo.isHardwareWallet, isBalanceEnough, navigate, onPressSend, source]
  );

  return { submitFn, isAuthorizing };
};
