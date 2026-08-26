import { createBaseStore } from '@storesjs/stores';

import { analytics } from '@/analytics';
import { getRemoteConfig } from '@/features/config/stores/remoteConfig';
import { time } from '@/framework/core/utils/time';
import { logger, RainbowError } from '@/logger';
import { delay } from '@/utils/delay';

import { US_COUNTRY_CODE } from '../../../services/cashSetupIdentityService';
import {
  finishRecovery,
  getUserStatus,
  KycStatus,
  startRecovery,
  startSignupResume,
  submitOnboarding,
  type KycOutcome,
} from '../../../services/userClient';
import { useCashSetupSessionStore } from '../../../stores/cashSetupSessionStore';
import { OTP_LENGTH, useVerifyPhoneFlowStore } from '../../../stores/verifyPhoneFlowStore';
import { getTelemetryErrorReason } from '../../../utils/getTelemetryErrorReason';

export const KYC_POLL_INTERVAL_MS = time.seconds(3);

export type SubmitReviewState = 'entry' | 'submitting' | 'identityMismatch' | 'error' | 'locked' | KycOutcome;

type SubmitReviewResult =
  | 'approved'
  | 'rejected'
  | 'awaitingDecision'
  | 'recovered'
  | 'phoneCodeRequired'
  | 'failed'
  | 'cancelled'
  | 'skipped';

type SubmitReviewFlowStore = {
  state: SubmitReviewState;
  // Identifies one submission so an abandoned request or poll cannot write
  // into a later one. This module-level store outlives the setup screen.
  run: object | null;
  reset: () => void;
  submit: () => Promise<SubmitReviewResult>;
};

export const useSubmitReviewFlowStore = createBaseStore<SubmitReviewFlowStore>((set, get) => ({
  state: 'entry',
  run: null,

  reset: () => set({ run: null, state: 'entry' }),

  submit: async () => {
    const { state } = get();
    if (state === 'submitting' || state === 'reviewing' || state === 'locked') return 'skipped';

    const sessionStore = useCashSetupSessionStore.getState();
    const { session } = sessionStore;
    const identity = sessionStore.getIdentity();
    const governmentId = sessionStore.getGovernmentId();
    if (!identity || !governmentId) return 'skipped';

    const run = {};
    set({ run, state: 'submitting' });

    if (session.status === 'recovery') {
      const code = useVerifyPhoneFlowStore.getState().code;
      if (code.length !== OTP_LENGTH) {
        set({ run: null, state: 'entry' });
        return 'skipped';
      }

      const { challenge, phoneNationalNumber } = session;
      const isStale = () => get().run !== run || !sessionStore.getIsCurrentChallenge(challenge);

      try {
        const result = await finishRecovery({ recoveryId: challenge.recoveryId, code, identity, governmentId });
        if (isStale()) return 'cancelled';

        switch (result.outcome) {
          case 'recovered':
            sessionStore.setPhoneVerified(challenge, result);
            analytics.track(analytics.event.cashPhoneVerified, { mode: 'recovery' });
            set({ state: 'entry' });
            return 'recovered';

          case 'identityMismatch':
            set({ state: 'identityMismatch' });
            return 'failed';

          case 'codeInvalid':
            useVerifyPhoneFlowStore.getState().rejectCode();
            analytics.track(analytics.event.cashPhoneVerifyFailed, { mode: 'recovery', reason: 'client_error' });
            set({ state: 'entry' });
            return 'phoneCodeRequired';

          case 'accessBlocked':
            set({ state: 'locked' });
            return 'failed';

          case 'sessionInvalid': {
            const { recoveryId, resendAfter } = await startRecovery({ nationalNumber: phoneNationalNumber });
            if (isStale()) return 'cancelled';
            sessionStore.replaceRecoveryChallenge(challenge, { kind: 'recovery', recoveryId }, resendAfter);
            break;
          }

          case 'signupIncomplete': {
            const { resumeId, resendAfter } = await startSignupResume({ nationalNumber: phoneNationalNumber });
            if (isStale()) return 'cancelled';
            sessionStore.setPhoneSubmitted({
              challenge: { kind: 'resume', resumeId },
              phoneNationalNumber,
              resendAfter,
            });
            analytics.track(analytics.event.cashPhoneSubmitted, { mode: 'resume' });
            break;
          }
        }

        useVerifyPhoneFlowStore.getState().reset();
        set({ run: null, state: 'entry' });
        return 'phoneCodeRequired';
      } catch (error) {
        if (isStale()) return 'cancelled';
        logger.error(new RainbowError('[useSubmitReviewFlow]: Failed to recover account', error));
        set({ state: 'error' });
        return 'failed';
      }
    }

    if (session.status !== 'phoneVerified') {
      set({ run: null, state: 'entry' });
      return 'skipped';
    }
    const { bootstrapToken } = session;

    analytics.track(analytics.event.cashKycSubmitted);

    const isStale = () => get().run !== run;
    let trackedAwaitingDecision = false;
    const enterReviewing = () => {
      if (!trackedAwaitingDecision) {
        trackedAwaitingDecision = true;
        analytics.track(analytics.event.cashKycAwaitingDecision, { source: 'submit' });
      }
      set({ state: 'reviewing' });
    };

    let kycStatus: KycStatus;
    try {
      ({ kycStatus } = await submitOnboarding({ bootstrapToken, countryCode: US_COUNTRY_CODE, identity, governmentId }));
    } catch (error) {
      if (isStale()) return 'cancelled';
      logger.error(new RainbowError('[useSubmitReviewFlow]: Failed to submit KYC', error));
      analytics.track(analytics.event.cashKycFailed, { reason: getTelemetryErrorReason(error) });
      set({ state: 'error' });
      return 'failed';
    }
    if (isStale()) return 'cancelled';

    const reviewingAt = Date.now() + getRemoteConfig().cash_kyc_review_delay_ms;

    while (isAwaitingDecision(kycStatus)) {
      if (Date.now() >= reviewingAt) enterReviewing();
      await delay(KYC_POLL_INTERVAL_MS);
      if (isStale()) return 'cancelled';
      try {
        ({ kycStatus } = await getUserStatus({ bootstrapToken }));
      } catch (error) {
        if (isStale()) return 'cancelled';
        // The identity data is already with the provider, so a status we cannot
        // read is still an undecided one — never the retryable entry error.
        logger.warn('[useSubmitReviewFlow]: KYC status poll failed', { error });
        enterReviewing();
        return 'awaitingDecision';
      }
      if (isStale()) return 'cancelled';
    }

    if (kycStatus === KycStatus.Approved) {
      analytics.track(analytics.event.cashKycApproved);
      set({ state: 'approved' });
      return 'approved';
    }

    analytics.track(analytics.event.cashKycFailed, { reason: 'rejected' });
    set({ state: 'rejected' });
    return 'rejected';
  },
}));

// Unspecified included: after a successful submission any non-verdict means the
// provider has not answered, which is the same thing to the user as pending.
function isAwaitingDecision(status: KycStatus): boolean {
  return status !== KycStatus.Approved && status !== KycStatus.Rejected;
}
