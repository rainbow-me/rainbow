import { createBaseStore } from '@storesjs/stores';

import { analytics } from '@/analytics';
import { logger, RainbowError } from '@/logger';

import { isCashUserServiceNetworkPolicyError } from '../services/cashUserServiceNetworkPolicy';
import { readKycOutcome, trackKycOutcome } from '../services/kycStatusService';
import {
  finishSignupResume,
  resendPhoneCode,
  startRecovery,
  startSignupResume,
  verifyPhone,
  type KycOutcome,
} from '../services/userClient';
import { getTelemetryErrorReason } from '../utils/getTelemetryErrorReason';
import { useCashSetupSessionStore, type PhoneChallenge } from './cashSetupSessionStore';

export const OTP_LENGTH = 6;

export type VerifyPhoneState = 'entry' | 'verifying' | 'submitted' | 'error';

export type VerifyPhoneResult = 'verified' | 'verifiedKycOutcome' | 'failed' | 'recoveryCodeAccepted' | 'recoveryStarted';

type ResumeCredential = { bootstrapToken: string; expiresAt: number };
type PendingResumeStatus = {
  challenge: Extract<PhoneChallenge, { kind: 'resume' }>;
  credential: ResumeCredential;
};

type VerifyPhoneFlowStore = {
  state: VerifyPhoneState;
  code: string;
  kycOutcome: KycOutcome | null;
  pendingResumeStatus: PendingResumeStatus | null;
  resending: PhoneChallenge | null;
  setCode: (code: string) => void;
  submit: () => Promise<VerifyPhoneResult>;
  resend: () => Promise<void>;
  rejectCode: () => void;
  clearKycOutcome: () => void;
  reset: () => void;
};

let activeKycCheck: object | null = null;

export const useVerifyPhoneFlowStore = createBaseStore<VerifyPhoneFlowStore>((set, get) => ({
  state: 'entry',
  code: '',
  kycOutcome: null,
  pendingResumeStatus: null,
  resending: null,

  setCode: code => {
    const { state } = get();
    if (state === 'verifying' || state === 'submitted') return;
    set({ code, state: state === 'error' ? 'entry' : state });
  },

  submit: async () => {
    const { code, pendingResumeStatus, resending, state } = get();
    if (code.length !== OTP_LENGTH || resending !== null || state === 'verifying' || state === 'submitted') return 'failed';
    const sessionStore = useCashSetupSessionStore.getState();
    const { session } = sessionStore;
    if (session.status !== 'phoneSubmitted' && session.status !== 'recovery') return 'failed';

    if (session.status === 'recovery') {
      set({ state: 'submitted' });
      return 'recoveryCodeAccepted';
    }
    const { challenge } = session;
    const kycCheck = {};
    activeKycCheck = kycCheck;
    let resumeCredential =
      challenge.kind === 'resume' && pendingResumeStatus?.challenge === challenge && pendingResumeStatus.credential.expiresAt > Date.now()
        ? pendingResumeStatus.credential
        : null;

    set({ pendingResumeStatus: resumeCredential ? pendingResumeStatus : null, state: 'verifying' });
    try {
      const result =
        challenge.kind === 'signup'
          ? { outcome: 'verified' as const, ...(await verifyPhone({ userId: challenge.userId, code })) }
          : resumeCredential
            ? { outcome: 'verified' as const, ...resumeCredential }
            : await finishSignupResume({ resumeId: challenge.resumeId, code });
      if (!sessionStore.getIsCurrentChallenge(challenge)) {
        set(state => (state.state === 'verifying' ? { code: '', state: 'entry' } : state));
        return 'failed';
      }

      if (result.outcome === 'signupAlreadyComplete') {
        const { recoveryId, resendAfter } = await startRecovery({ nationalNumber: session.phoneNationalNumber });
        if (!sessionStore.getIsCurrentChallenge(challenge)) {
          set(state => (state.state === 'verifying' ? { code: '', state: 'entry' } : state));
          return 'failed';
        }
        sessionStore.setPhoneSubmitted({
          challenge: { kind: 'recovery', recoveryId },
          phoneNationalNumber: session.phoneNationalNumber,
          resendAfter,
        });
        analytics.track(analytics.event.cashPhoneSubmitted, { mode: 'recovery' });
        set({ code: '', state: 'entry' });
        return 'recoveryStarted';
      }

      // A resumed account may have submitted KYC in an earlier signup attempt.
      if (challenge.kind === 'resume') resumeCredential = result;
      const kycOutcome = resumeCredential
        ? await readKycOutcome(resumeCredential.bootstrapToken).catch(error => {
            if (isCashUserServiceNetworkPolicyError(error)) throw error;
            return null;
          })
        : null;
      if (activeKycCheck !== kycCheck) return 'failed';
      activeKycCheck = null;
      if (!sessionStore.getIsCurrentChallenge(challenge)) {
        set(state => (state.state === 'verifying' ? { code: '', state: 'entry' } : state));
        return 'failed';
      }
      sessionStore.setPhoneVerified(challenge, { bootstrapToken: result.bootstrapToken, expiresAt: result.expiresAt });
      analytics.track(analytics.event.cashPhoneVerified, { mode: challenge.kind });
      if (kycOutcome) {
        sessionStore.markKycSubmitted(result.bootstrapToken);
        trackKycOutcome(kycOutcome, 'resume');
      }
      // Keep the retained OTP input disabled without leaving setup controls loading.
      set({ kycOutcome, pendingResumeStatus: null, state: 'submitted' });
      return kycOutcome ? 'verifiedKycOutcome' : 'verified';
    } catch (e) {
      if (activeKycCheck !== kycCheck) return 'failed';
      activeKycCheck = null;
      if (!sessionStore.getIsCurrentChallenge(challenge)) {
        set(state => (state.state === 'verifying' ? { code: '', state: 'entry' } : state));
        return 'failed';
      }
      if (isCashUserServiceNetworkPolicyError(e)) {
        set({
          pendingResumeStatus: challenge.kind === 'resume' && resumeCredential ? { challenge, credential: resumeCredential } : null,
          state: 'entry',
        });
        return 'failed';
      }
      logger.error(new RainbowError('[useVerifyPhoneFlow]: Failed to verify phone', e));
      analytics.track(analytics.event.cashPhoneVerifyFailed, {
        reason: getTelemetryErrorReason(e),
        mode: challenge.kind,
      });
      set({ code: '', state: 'error' });
      return 'failed';
    }
  },

  resend: async () => {
    const { resending, state } = get();
    if (resending !== null || state === 'verifying' || state === 'submitted') return;
    const sessionStore = useCashSetupSessionStore.getState();
    const { session } = sessionStore;
    if ((session.status !== 'phoneSubmitted' && session.status !== 'recovery') || Date.now() < session.resendAfter) return;
    const { challenge, phoneNationalNumber } = session;

    set(({ state }) => ({ resending: challenge, state: state === 'error' ? 'entry' : state }));
    try {
      if (challenge.kind === 'signup') {
        const { resendAfter } = await resendPhoneCode({ userId: challenge.userId });
        if (!sessionStore.getIsCurrentChallenge(challenge)) return;
        sessionStore.setResendAfter(challenge, resendAfter);
      } else if (challenge.kind === 'resume') {
        // Resume has no resend endpoint; re-arming the OTP means a fresh
        // StartSignupResume, whose resumeId replaces the current challenge.
        const { resumeId, resendAfter } = await startSignupResume({ nationalNumber: phoneNationalNumber });
        if (!sessionStore.getIsCurrentChallenge(challenge)) return;
        sessionStore.setPhoneSubmitted({ challenge: { kind: 'resume', resumeId }, phoneNationalNumber, resendAfter });
      } else {
        const { recoveryId, resendAfter } = await startRecovery({ nationalNumber: phoneNationalNumber });
        if (!sessionStore.getIsCurrentChallenge(challenge)) return;
        sessionStore.replaceRecoveryChallenge(challenge, { kind: 'recovery', recoveryId }, resendAfter);
      }
      set({ code: '', pendingResumeStatus: null });
    } catch (e) {
      if (!sessionStore.getIsCurrentChallenge(challenge)) return;
      if (isCashUserServiceNetworkPolicyError(e)) return;
      logger.error(new RainbowError('[useVerifyPhoneFlow]: Failed to resend code', e));
      analytics.track(analytics.event.cashPhoneResendFailed, { reason: getTelemetryErrorReason(e), mode: challenge.kind });
    } finally {
      set(state => (state.resending === challenge ? { resending: null } : state));
    }
  },

  rejectCode: () => set({ code: '', state: 'error' }),

  // Dismiss the outcome without undoing the session's completed phone verification.
  clearKycOutcome: () => set({ kycOutcome: null }),

  reset: () => {
    activeKycCheck = null;
    set({ code: '', kycOutcome: null, pendingResumeStatus: null, resending: null, state: 'entry' });
  },
}));
