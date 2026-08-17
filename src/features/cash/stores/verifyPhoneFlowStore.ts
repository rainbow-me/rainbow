import { createBaseStore } from '@storesjs/stores';

import { analytics } from '@/analytics';
import { time } from '@/framework/core/utils/time';
import { logger, RainbowError } from '@/logger';
import { delay } from '@/utils/delay';

import {
  finishSignupResume,
  getUserStatus,
  KycStatus,
  resendPhoneCode,
  startSignupResume,
  verifyPhone,
  type KycOutcome,
} from '../services/userClient';
import { useCashSetupSessionStore, type PhoneChallenge } from './cashSetupSessionStore';

export const OTP_LENGTH = 6;

export type VerifyPhoneState = 'entry' | 'verifying' | 'verified' | 'error';

export type VerifyPhoneResult = 'verified' | 'verifiedKycOutcome' | 'failed' | 'signupAlreadyComplete';

// Null means the wizard proceeds to the KYC steps: either nothing was ever
// submitted, or the status could not be read and a redundant pass is the safe
// guess — showing "we're reviewing" to someone who never submitted strands them.
function toKycOutcome(status: KycStatus): KycOutcome | null {
  switch (status) {
    case KycStatus.Approved:
      return 'approved';
    case KycStatus.Rejected:
      return 'rejected';
    case KycStatus.Pending:
    case KycStatus.Review:
      return 'reviewing';
    case KycStatus.Unspecified:
      return null;
  }
}

// Best-effort: failing only costs the user a redundant pass through KYC entry,
// so a transient status failure gets one delayed retry.
async function getResumeKycOutcome(bootstrapToken: string): Promise<KycOutcome | null> {
  const check = async () => toKycOutcome((await getUserStatus({ bootstrapToken })).kycStatus);
  return check()
    .catch(() => delay(time.seconds(2)).then(check))
    .catch(() => null);
}

type VerifyPhoneFlowStore = {
  state: VerifyPhoneState;
  code: string;
  kycOutcome: KycOutcome | null;
  resending: PhoneChallenge | null;
  setCode: (code: string) => void;
  submit: () => Promise<VerifyPhoneResult>;
  resend: () => Promise<void>;
  clearKycOutcome: () => void;
  reset: () => void;
};

export const useVerifyPhoneFlowStore = createBaseStore<VerifyPhoneFlowStore>((set, get) => ({
  state: 'entry',
  code: '',
  kycOutcome: null,
  resending: null,

  setCode: code => {
    const { state } = get();
    if (state === 'verifying' || state === 'verified') return;
    set({ code, state: state === 'error' ? 'entry' : state });
  },

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
      // A resumed account may have submitted KYC in an earlier signup attempt.
      const kycOutcome = challenge.kind === 'resume' ? await getResumeKycOutcome(result.bootstrapToken) : null;
      if (kycOutcome === 'approved') analytics.track(analytics.event.cashKycApproved);
      else if (kycOutcome === 'reviewing') analytics.track(analytics.event.cashKycAwaitingDecision, { source: 'resume' });
      else if (kycOutcome === 'rejected') analytics.track(analytics.event.cashKycFailed, { reason: 'rejected' });
      // Terminal, and deliberately not 'verifying': Setup's submission lock reads
      // that state, so lingering there would disable every exit for the rest of
      // the flow. Screen cleanup or a fresh phone submission resets the store.
      set({ kycOutcome, state: 'verified' });
      return kycOutcome ? 'verifiedKycOutcome' : 'verified';
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
    const { resending, state } = get();
    if (resending !== null || state === 'verifying' || state === 'verified') return;
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

  // Dismiss the outcome without undoing the session's completed phone verification.
  clearKycOutcome: () => set({ kycOutcome: null }),

  reset: () => set({ code: '', kycOutcome: null, resending: null, state: 'entry' }),
}));
