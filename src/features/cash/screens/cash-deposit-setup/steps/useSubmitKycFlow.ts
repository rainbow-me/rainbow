import { createBaseStore, createStoreActions } from '@storesjs/stores';

import { analytics } from '@/analytics';
import { time } from '@/framework/core/utils/time';
import { logger, RainbowError } from '@/logger';
import { delay } from '@/utils/delay';

import { US_COUNTRY_CODE } from '../../../services/cashSetupIdentityService';
import { getUserStatus, KycStatus, submitOnboarding } from '../../../services/userClient';
import { useCashSetupSessionStore } from '../../../stores/cashSetupSessionStore';

export const KYC_POLL_INTERVAL_MS = time.seconds(3);
export const KYC_POLL_BUDGET_MS = time.seconds(30);

const KYC_POLL_ATTEMPTS = Math.floor(KYC_POLL_BUDGET_MS / KYC_POLL_INTERVAL_MS);

const KYC_FAILURE_REASONS: Record<Exclude<KycStatus, KycStatus.Approved>, string> = {
  [KycStatus.Unspecified]: 'unspecified',
  [KycStatus.Pending]: 'timeout',
  [KycStatus.Rejected]: 'rejected',
  [KycStatus.Review]: 'review',
};

export type SubmitKycState = 'entry' | 'submitting' | 'success' | 'error';

export type SubmitKycResult = 'approved' | 'failed' | 'skipped';

type SubmitKycFlowStore = {
  state: SubmitKycState;
  reset: () => void;
  submit: () => Promise<SubmitKycResult>;
};

export const useSubmitKycFlowStore = createBaseStore<SubmitKycFlowStore>((set, get) => ({
  state: 'entry',

  reset: () => set({ state: 'entry' }),

  submit: async () => {
    if (get().state === 'submitting') return 'skipped';
    const { session } = useCashSetupSessionStore.getState();
    if (session.status !== 'phoneVerified' || !session.identity || !session.governmentId) return 'skipped';

    set({ state: 'submitting' });
    analytics.track(analytics.event.cashKycSubmitted);
    try {
      const { bootstrapToken, identity, governmentId } = session;
      let { kycStatus } = await submitOnboarding({ bootstrapToken, countryCode: US_COUNTRY_CODE, identity, governmentId });

      for (let attempt = 0; kycStatus === KycStatus.Pending && attempt < KYC_POLL_ATTEMPTS; attempt++) {
        await delay(KYC_POLL_INTERVAL_MS);
        ({ kycStatus } = await getUserStatus({ bootstrapToken }));
      }

      if (kycStatus !== KycStatus.Approved) {
        const reason = KYC_FAILURE_REASONS[kycStatus];
        logger.error(new RainbowError(`[useSubmitKycFlow]: KYC not approved: ${reason}`));
        analytics.track(analytics.event.cashKycFailed, { reason });
        set({ state: 'error' });
        return 'failed';
      }

      analytics.track(analytics.event.cashKycApproved);
      set({ state: 'success' });
      return 'approved';
    } catch (e) {
      logger.error(new RainbowError('[useSubmitKycFlow]: Failed to submit KYC', e));
      analytics.track(analytics.event.cashKycFailed, { reason: e instanceof Error ? e.message : String(e) });
      set({ state: 'error' });
      return 'failed';
    }
  },
}));

const submitKycFlowActions = createStoreActions(useSubmitKycFlowStore);

export function useSubmitKycFlow(): {
  reset: () => void;
  state: SubmitKycState;
  submit: () => Promise<SubmitKycResult>;
} {
  const state = useSubmitKycFlowStore(state => state.state);

  return { reset: submitKycFlowActions.reset, state, submit: submitKycFlowActions.submit };
}
