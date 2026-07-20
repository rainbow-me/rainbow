import { useCallback, useEffect, useState } from 'react';

import { createBaseStore, createStoreActions } from '@storesjs/stores';

import { analytics } from '@/analytics';
import { time } from '@/framework/core/utils/time';
import { logger, RainbowError } from '@/logger';

import { resendPhoneCode, verifyPhone } from '../../../services/userClient';
import { selectResendAfter, useCashSetupSessionStore } from '../../../stores/cashSetupSessionStore';
import { useCashDepositSetupNavigation } from '../useCashDepositSetupNavigation';

export const OTP_LENGTH = 6;

export type VerifyPhoneState = 'entry' | 'verifying' | 'error';

type VerifyPhoneFlowStore = {
  state: VerifyPhoneState;
  code: string;
  resending: boolean;
  setCode: (code: string) => void;
  submit: () => Promise<boolean>;
  resend: () => Promise<void>;
  reset: () => void;
};

export const useVerifyPhoneFlowStore = createBaseStore<VerifyPhoneFlowStore>((set, get) => ({
  state: 'entry',
  code: '',
  resending: false,

  setCode: code => set(({ state }) => ({ code, state: state === 'error' ? 'entry' : state })),

  submit: async () => {
    const { code, state } = get();
    if (code.length !== OTP_LENGTH || state === 'verifying') return false;
    const { session } = useCashSetupSessionStore.getState();
    if (session.status !== 'phoneSubmitted') return false;

    set({ state: 'verifying' });
    try {
      const { bootstrapToken, expiresAt } = await verifyPhone({ userId: session.userId, code });
      const { session: current } = useCashSetupSessionStore.getState();
      if (current.status !== 'phoneSubmitted' || current.userId !== session.userId) return false;
      useCashSetupSessionStore.getState().setPhoneVerified({
        userId: session.userId,
        phoneNationalNumber: session.phoneNationalNumber,
        token: bootstrapToken,
        expiresAt,
      });
      analytics.track(analytics.event.cashPhoneVerified);
      set({ code: '', state: 'entry' });
      return true;
    } catch (e) {
      logger.error(new RainbowError('[useVerifyPhoneFlow]: Failed to verify phone', e));
      analytics.track(analytics.event.cashPhoneVerifyFailed, { reason: e instanceof Error ? e.message : String(e) });
      set({ code: '', state: 'error' });
      return false;
    }
  },

  resend: async () => {
    if (get().resending) return;
    const { session } = useCashSetupSessionStore.getState();
    if (session.status !== 'phoneSubmitted' || Date.now() < session.resendAfter) return;

    set({ resending: true });
    try {
      const result = await resendPhoneCode({ userId: session.userId });
      const { session: current } = useCashSetupSessionStore.getState();
      if (current.status === 'phoneSubmitted' && current.userId === session.userId) {
        useCashSetupSessionStore.getState().setResendAfter(result.resendAfter);
      }
    } catch (e) {
      logger.error(new RainbowError('[useVerifyPhoneFlow]: Failed to resend code', e));
    } finally {
      set({ resending: false });
    }
  },

  reset: () => set({ code: '', resending: false, state: 'entry' }),
}));

const verifyPhoneFlowActions = createStoreActions(useVerifyPhoneFlowStore);

export function useVerifyPhoneFlow(): Pick<VerifyPhoneFlowStore, 'state' | 'code' | 'setCode' | 'resend' | 'resending'> & {
  submit: () => Promise<void>;
  resendCooldownSeconds: number;
} {
  const { next } = useCashDepositSetupNavigation();
  const state = useVerifyPhoneFlowStore(s => s.state);
  const code = useVerifyPhoneFlowStore(s => s.code);
  const resending = useVerifyPhoneFlowStore(s => s.resending);
  const resendAfter = useCashSetupSessionStore(selectResendAfter);
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState(0);

  const submit = useCallback(async () => {
    if (await verifyPhoneFlowActions.submit()) next();
  }, [next]);

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
