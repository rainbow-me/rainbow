import { createBaseStore } from '@storesjs/stores';

import { analytics } from '@/analytics';
import { time } from '@/framework/core/utils/time';
import { logger, RainbowError } from '@/logger';
import { delay } from '@/utils/delay';

import { finishSignupResume, getUserStatus, KycStatus, resendPhoneCode, startSignupResume, verifyPhone } from '../services/userClient';
import { useCashSetupSessionStore, type PhoneChallenge } from './cashSetupSessionStore';

export const OTP_LENGTH = 6;

export type VerifyPhoneState = 'entry' | 'verifying' | 'verified' | 'error';

export type VerifyPhoneResult = 'verified' | 'verifiedKycApproved' | 'failed' | 'signupAlreadyComplete';

// Best-effort: failing only costs an approved user a redundant pass through
// KYC entry, so a transient status failure gets one delayed retry.
async function getIsKycApproved(bootstrapToken: string): Promise<boolean> {
  const check = async () => (await getUserStatus({ bootstrapToken })).kycStatus === KycStatus.Approved;
  return check()
    .catch(() => delay(time.seconds(2)).then(check))
    .catch(() => false);
}

type VerifyPhoneFlowStore = {
  state: VerifyPhoneState;
  code: string;
  resending: PhoneChallenge | null;
  setCode: (code: string) => void;
  submit: () => Promise<VerifyPhoneResult>;
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
    if (code.length !== OTP_LENGTH || state === 'verifying' || state === 'verified') return 'failed';
    const sessionStore = useCashSetupSessionStore.getState();
    const { session } = sessionStore;
    if (session.status !== 'phoneSubmitted') return 'failed';
    const { challenge } = session;

    set({ state: 'verifying' });
    try {
      const result =
        challenge.kind === 'signup'
          ? { outcome: 'verified' as const, ...(await verifyPhone({ userId: challenge.userId, code })) }
          : await finishSignupResume({ resumeId: challenge.resumeId, code });
      if (!sessionStore.getIsCurrentChallenge(challenge)) {
        set(state => (state.state === 'verifying' ? { code: '', state: 'entry' } : state));
        return 'failed';
      }

      if (result.outcome === 'signupAlreadyComplete') {
        analytics.track(analytics.event.cashPhoneAlreadyRegistered, { outcome: 'signupAlreadyComplete' });
        sessionStore.setPhoneAlreadyRegistered(session.phoneNationalNumber);
        set({ code: '', state: 'entry' });
        return 'signupAlreadyComplete';
      }

      sessionStore.setPhoneVerified(challenge, { bootstrapToken: result.bootstrapToken, expiresAt: result.expiresAt });
      analytics.track(analytics.event.cashPhoneVerified, { mode: challenge.kind });
      // A resumed account may have completed KYC in an earlier signup attempt.
      const skipKyc = challenge.kind === 'resume' && (await getIsKycApproved(result.bootstrapToken));
      set({ state: 'verified' });
      return skipKyc ? 'verifiedKycApproved' : 'verified';
    } catch (e) {
      if (!sessionStore.getIsCurrentChallenge(challenge)) {
        set(state => (state.state === 'verifying' ? { code: '', state: 'entry' } : state));
        return 'failed';
      }
      logger.error(new RainbowError('[useVerifyPhoneFlow]: Failed to verify phone', e));
      analytics.track(analytics.event.cashPhoneVerifyFailed, {
        reason: e instanceof Error ? e.message : String(e),
        mode: challenge.kind,
      });
      set({ code: '', state: 'error' });
      return 'failed';
    }
  },

  resend: async () => {
    if (get().resending !== null) return;
    const sessionStore = useCashSetupSessionStore.getState();
    const { session } = sessionStore;
    if (session.status !== 'phoneSubmitted' || Date.now() < session.resendAfter) return;
    const { challenge, phoneNationalNumber } = session;

    set(({ state }) => ({ resending: challenge, state: state === 'error' ? 'entry' : state }));
    try {
      if (challenge.kind === 'signup') {
        const { resendAfter } = await resendPhoneCode({ userId: challenge.userId });
        sessionStore.setResendAfter(challenge, resendAfter);
      } else {
        // Resume has no resend endpoint; re-arming the OTP means a fresh
        // StartSignupResume, whose resumeId replaces the current challenge.
        const { resumeId, resendAfter } = await startSignupResume({ nationalNumber: phoneNationalNumber });
        if (!sessionStore.getIsCurrentChallenge(challenge)) return;
        sessionStore.setPhoneSubmitted({ challenge: { kind: 'resume', resumeId }, phoneNationalNumber, resendAfter });
      }
    } catch (e) {
      if (!sessionStore.getIsCurrentChallenge(challenge)) return;
      logger.error(new RainbowError('[useVerifyPhoneFlow]: Failed to resend code', e));
    } finally {
      set(state => (state.resending === challenge ? { resending: null } : state));
    }
  },

  reset: () => set({ code: '', resending: null, state: 'entry' }),
}));
