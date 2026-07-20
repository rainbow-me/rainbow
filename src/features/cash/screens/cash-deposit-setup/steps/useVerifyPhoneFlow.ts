import { useCallback, useEffect, useState } from 'react';

import { createBaseStore, createStoreActions } from '@storesjs/stores';

import { analytics } from '@/analytics';
import { time } from '@/framework/core/utils/time';
import { logger, RainbowError } from '@/logger';

import { resendPhoneCode, verifyPhone } from '../../../services/userClient';
import { selectResendAfter, useCashSetupSessionStore, type PhoneChallenge } from '../../../stores/cashSetupSessionStore';
import { useCashDepositSetupNavigation } from '../useCashDepositSetupNavigation';

export const OTP_LENGTH = 6;

export type VerifyPhoneState = 'entry' | 'verifying' | 'error';

type VerifyPhoneFlowStore = {
  state: VerifyPhoneState;
  code: string;
  resending: PhoneChallenge | null;
  setCode: (code: string) => void;
  submit: () => Promise<boolean>;
  resend: () => Promise<void>;
  reset: () => void;
};

export const useVerifyPhoneFlowStore = createBaseStore<VerifyPhoneFlowStore>((set, get) => ({
  state: 'entry',
  code: '',
  resending: null,

  setCode: code => set(({ state }) => ({ code, state: state === 'error' ? 'entry' : state })),

  submit: async () => {
    const { code, state } = get();
    if (code.length !== OTP_LENGTH || state === 'verifying') return false;
    const sessionStore = useCashSetupSessionStore.getState();
    const { session } = sessionStore;
    if (session.status !== 'phoneSubmitted') return false;
    const { challenge } = session;

    set({ state: 'verifying' });
    try {
      const credential = await verifyPhone({ userId: challenge.userId, code });
      if (!sessionStore.getIsCurrentChallenge(challenge)) return false;
      sessionStore.setPhoneVerified(challenge, credential);
      analytics.track(analytics.event.cashPhoneVerified);
      set({ code: '', state: 'entry' });
      return true;
    } catch (e) {
      if (!sessionStore.getIsCurrentChallenge(challenge)) return false;
      logger.error(new RainbowError('[useVerifyPhoneFlow]: Failed to verify phone', e));
      analytics.track(analytics.event.cashPhoneVerifyFailed, { reason: e instanceof Error ? e.message : String(e) });
      set({ code: '', state: 'error' });
      return false;
    }
  },

  resend: async () => {
    if (get().resending !== null) return;
    const sessionStore = useCashSetupSessionStore.getState();
    const { session } = sessionStore;
    if (session.status !== 'phoneSubmitted' || Date.now() < session.resendAfter) return;
    const { challenge } = session;

    set(({ state }) => ({ resending: challenge, state: state === 'error' ? 'entry' : state }));
    try {
      const { resendAfter } = await resendPhoneCode({ userId: challenge.userId });
      sessionStore.setResendAfter(challenge, resendAfter);
    } catch (e) {
      if (!sessionStore.getIsCurrentChallenge(challenge)) return;
      logger.error(new RainbowError('[useVerifyPhoneFlow]: Failed to resend code', e));
    } finally {
      set(state => (state.resending === challenge ? { resending: null } : state));
    }
  },

  reset: () => set({ code: '', resending: null, state: 'entry' }),
}));

const verifyPhoneFlowActions = createStoreActions(useVerifyPhoneFlowStore);

export function useVerifyPhoneFlow(): Pick<VerifyPhoneFlowStore, 'state' | 'code' | 'setCode' | 'resend'> & {
  submit: () => Promise<void>;
  resending: boolean;
  resendCooldownSeconds: number;
} {
  const { next } = useCashDepositSetupNavigation();
  const state = useVerifyPhoneFlowStore(s => s.state);
  const code = useVerifyPhoneFlowStore(s => s.code);
  const resending = useVerifyPhoneFlowStore(s => s.resending !== null);
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
