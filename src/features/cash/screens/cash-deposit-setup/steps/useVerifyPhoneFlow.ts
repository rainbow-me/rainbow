import { useCallback, useEffect, useState } from 'react';

import { createStoreActions } from '@storesjs/stores';

import { time } from '@/framework/core/utils/time';
import Routes from '@/navigation/routesNames';

import { type KycOutcome } from '../../../services/userClient';
import { selectResendAfter, useCashSetupSessionStore } from '../../../stores/cashSetupSessionStore';
import { useVerifyPhoneFlowStore, type VerifyPhoneState } from '../../../stores/verifyPhoneFlowStore';
import { CashDepositSetupNavigation } from '../cashDepositSetupNavigator';
import { useCashDepositSetupNavigation } from '../useCashDepositSetupNavigation';

const verifyPhoneFlowActions = createStoreActions(useVerifyPhoneFlowStore);

export function useVerifyPhoneFlow(): {
  state: VerifyPhoneState;
  code: string;
  kycOutcome: KycOutcome | null;
  continueAfterKyc: () => void;
  setCode: (code: string) => void;
  submit: () => Promise<void>;
  resend: () => Promise<void>;
  resending: boolean;
  resendCooldownSeconds: number;
} {
  const { next, back } = useCashDepositSetupNavigation();
  const state = useVerifyPhoneFlowStore(s => s.state);
  const code = useVerifyPhoneFlowStore(s => s.code);
  const kycOutcome = useVerifyPhoneFlowStore(s => s.kycOutcome);
  const resending = useVerifyPhoneFlowStore(s => s.resending !== null);
  const resendAfter = useCashSetupSessionStore(selectResendAfter);
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState(0);

  const submit = useCallback(async () => {
    const result = await verifyPhoneFlowActions.submit();
    if (result === 'verified') next();
    if (result === 'signupAlreadyComplete') back();
  }, [back, next]);

  const continueAfterKyc = useCallback(() => {
    CashDepositSetupNavigation.navigate(Routes.CASH_SETUP_PASSKEY);
    verifyPhoneFlowActions.clearKycOutcome();
  }, []);

  useEffect(() => {
    if (resendAfter == null || state === 'verifying' || state === 'verified') {
      setResendCooldownSeconds(0);
      return;
    }

    const update = () => {
      const seconds = Math.max(0, Math.ceil((resendAfter - Date.now()) / 1000));
      setResendCooldownSeconds(seconds);
      if (seconds <= 0) clearInterval(id);
    };
    const id = setInterval(update, time.seconds(1));
    update();
    return () => clearInterval(id);
  }, [resendAfter, state]);

  return {
    state,
    code,
    kycOutcome,
    continueAfterKyc,
    setCode: verifyPhoneFlowActions.setCode,
    submit,
    resend: verifyPhoneFlowActions.resend,
    resending,
    resendCooldownSeconds,
  };
}
