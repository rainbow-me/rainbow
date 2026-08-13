import { createBaseStore } from '@storesjs/stores';

import { analytics } from '@/analytics';
import { getRemoteConfig } from '@/features/config/stores/remoteConfig';
import { time } from '@/framework/core/utils/time';
import { logger, RainbowError } from '@/logger';
import { delay } from '@/utils/delay';

import { US_COUNTRY_CODE } from '../../../services/cashSetupIdentityService';
import { getUserStatus, KycStatus, submitOnboarding, type KycOutcome } from '../../../services/userClient';
import { useCashSetupSessionStore } from '../../../stores/cashSetupSessionStore';

export const KYC_POLL_INTERVAL_MS = time.seconds(3);

export type SubmitKycState = 'entry' | 'submitting' | 'error' | KycOutcome;

export type SubmitKycResult = 'approved' | 'rejected' | 'awaitingDecision' | 'failed' | 'cancelled' | 'skipped';

// Unspecified included: after a successful submission any non-verdict means the
// provider has not answered, which is the same thing to the user as pending.
function isAwaitingDecision(status: KycStatus): boolean {
  return status !== KycStatus.Approved && status !== KycStatus.Rejected;
}

type SubmitKycFlowStore = {
  state: SubmitKycState;
  // Identifies one submission so a poll loop the user walked away from cannot
  // write into a later one — these stores outlive the screen.
  run: object | null;
  reset: () => void;
  submit: () => Promise<SubmitKycResult>;
};

export const useSubmitKycFlowStore = createBaseStore<SubmitKycFlowStore>((set, get) => ({
  state: 'entry',
  run: null,

  reset: () => set({ run: null, state: 'entry' }),

  submit: async () => {
    const { state } = get();
    if (state === 'submitting' || state === 'reviewing') return 'skipped';
    const sessionStore = useCashSetupSessionStore.getState();
    const { session } = sessionStore;
    const identity = sessionStore.getIdentity();
    const governmentId = sessionStore.getGovernmentId();
    if (session.status !== 'phoneVerified' || !identity || !governmentId) return 'skipped';
    const { bootstrapToken } = session;

    const run = {};
    set({ run, state: 'submitting' });
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
    } catch (e) {
      if (isStale()) return 'cancelled';
      logger.error(new RainbowError('[useSubmitKycFlow]: Failed to submit KYC', e));
      analytics.track(analytics.event.cashKycFailed, { reason: e instanceof Error ? e.message : String(e) });
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
      } catch (e) {
        if (isStale()) return 'cancelled';
        // The identity data is already with the provider, so a status we cannot
        // read is still an undecided one — never the retryable entry error.
        logger.warn('[useSubmitKycFlow]: KYC status poll failed', { error: e });
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
