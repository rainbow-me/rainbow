import { useCallback, useState } from 'react';
import Routes from '@/navigation/routesNames';
import { useNavigation } from '@/navigation';
import { RequestSource } from '@/utils/requestNavigationHandlers';
import { logger, RainbowError } from '@/logger';
import { startTimeToSignTracking } from '@/state/performance/performance';
import { SCREEN_FOR_REQUEST_SOURCE } from '@/components/Transactions/constants';

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
  }, [isAuthorizing, onConfirm, setIsAuthorizing]);

  const submitFn = useCallback(() => {
    if (!isBalanceEnough && !isMessageRequest) {
      return navigate(Routes.ADD_CASH_SHEET);
    }

    if (accountInfo.isHardwareWallet) {
      return navigate(Routes.HARDWARE_WALLET_TX_NAVIGATOR, { submit: onPressSend });
    }

    startTimeToSignTracking();
    onPressSend();
  }, [accountInfo.isHardwareWallet, isBalanceEnough, isMessageRequest, navigate, onPressSend]);

  return { submitFn, isAuthorizing };
};
