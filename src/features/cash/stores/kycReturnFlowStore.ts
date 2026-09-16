import { createBaseStore } from '@storesjs/stores';

import { logger } from '@/logger';

import { readKycOutcome, trackKycOutcome } from '../services/kycStatusService';
import { type KycOutcome } from '../services/userClient';
import { useCashAccountStore } from './cashAccountStore';
import { selectIsPhoneVerified, useCashSetupSessionStore } from './cashSetupSessionStore';

export type KycReturnState = 'idle' | 'checking' | KycOutcome;

export type KycReturnResult = 'outcome' | 'notSubmitted' | 'expired' | 'cancelled' | 'skipped';

type KycReturnFlowStore = {
  state: KycReturnState;
  // Identifies one check so a result from a dismissed Setup cannot write into
  // a later one. This module-level store outlives the setup screen.
  run: object | null;
  check: () => Promise<KycReturnResult>;
  reset: () => void;
};

export const useKycReturnFlowStore = createBaseStore<KycReturnFlowStore>((set, get) => ({
  state: 'idle',
  run: null,

  check: async () => {
    if (get().state !== 'idle') return 'skipped';
    const sessionStore = useCashSetupSessionStore.getState();
    const { session } = sessionStore;
    // A device that already recorded an account must not enrol a second one with a leftover token.
    if (session.status !== 'phoneVerified' || useCashAccountStore.getState().userId != null) return 'skipped';
    if (!selectIsPhoneVerified(sessionStore)) {
      sessionStore.reset();
      return 'expired';
    }

    const run = {};
    set({ run, state: 'checking' });
    const isStale = () => get().run !== run;

    let outcome: KycOutcome | null;
    try {
      outcome = await readKycOutcome(session.bootstrapToken);
    } catch (error) {
      if (isStale()) return 'cancelled';
      logger.warn('[kycReturnFlowStore]: KYC status check failed', { error });
      outcome = session.kycSubmission === 'submitted' ? 'reviewing' : null;
    }
    if (isStale()) return 'cancelled';

    if (outcome === null) {
      if (session.kycSubmission === 'notSubmitted') {
        set({ run: null, state: 'idle' });
        return 'notSubmitted';
      }
      outcome = 'reviewing';
    }
    trackKycOutcome(outcome, 'return');
    set({ state: outcome });
    return 'outcome';
  },

  reset: () => set({ run: null, state: 'idle' }),
}));

export function getShouldCheckKycOnReturn(): boolean {
  return useCashAccountStore.getState().userId == null && selectIsPhoneVerified(useCashSetupSessionStore.getState());
}
