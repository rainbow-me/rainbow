import { useCallback, useEffect, useState } from 'react';

import { createStoreActions } from '@storesjs/stores';

import { time } from '@/framework/core/utils/time';

import { selectResendAfter, useCashSetupSessionStore } from '../../../stores/cashSetupSessionStore';
import { useVerifyPhoneFlowStore, type VerifyPhoneState } from '../../../stores/verifyPhoneFlowStore';
import { useCashDepositSetupNavigation } from '../useCashDepositSetupNavigation';

const verifyPhoneFlowActions = createStoreActions(useVerifyPhoneFlowStore);

export function useVerifyPhoneFlow(): {
  state: VerifyPhoneState;
  code: string;
  setCode: (code: string) => void;
  submit: () => Promise<void>;
  resend: () => Promise<void>;
  resending: boolean;
  resendCooldownSeconds: number;
} {
  const { next, back } = useCashDepositSetupNavigation();
  const state = useVerifyPhoneFlowStore(s => s.state);
  const code = useVerifyPhoneFlowStore(s => s.code);
  const resending = useVerifyPhoneFlowStore(s => s.resending !== null);
  const resendAfter = useCashSetupSessionStore(selectResendAfter);
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState(0);

  const submit = useCallback(async () => {
    const result = await verifyPhoneFlowActions.submit();
    if (result === 'verified') next();
    if (result === 'signupAlreadyComplete') back();
  }, [back, next]);

  useEffect(() => {
    if (resendAfter == null) {
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
  }, [resendAfter]);

  return {
    state,
    code,
    setCode: verifyPhoneFlowActions.setCode,
    submit,
    resend: verifyPhoneFlowActions.resend,
    resending,
    resendCooldownSeconds,
  };
}
