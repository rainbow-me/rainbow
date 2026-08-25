import { createBaseStore } from '@storesjs/stores';

import { analytics } from '@/analytics';
import { logger, RainbowError } from '@/logger';

import { createUserWithPhone, startSignupResume } from '../../../services/userClient';
import { useCashSetupSessionStore, type PhoneChallenge } from '../../../stores/cashSetupSessionStore';
import { useVerifyPhoneFlowStore } from '../../../stores/verifyPhoneFlowStore';
import { getTelemetryErrorReason } from '../../../utils/getTelemetryErrorReason';
import { extractNationalDigits, NATIONAL_NUMBER_LENGTH } from '../../../utils/phoneNumber';

export type SubmitPhoneState = 'entry' | 'submitting' | 'error';

type SubmitPhoneFlowStore = {
  state: SubmitPhoneState;
  digits: string;
  setDigits: (text: string) => void;
  submit: () => Promise<boolean>;
  reset: () => void;
};

async function startResume(nationalNumber: string): Promise<{ challenge: PhoneChallenge; resendAfter: number }> {
  const { resumeId, resendAfter } = await startSignupResume({ nationalNumber });
  return { challenge: { kind: 'resume', resumeId }, resendAfter };
}

function clearPhoneAlreadyRegistered() {
  const sessionStore = useCashSetupSessionStore.getState();
  if (sessionStore.session.status === 'phoneAlreadyRegistered') sessionStore.reset();
}

export const useSubmitPhoneFlowStore = createBaseStore<SubmitPhoneFlowStore>((set, get) => ({
  state: 'entry',
  digits: '',

  setDigits: text => {
    if (get().state === 'submitting') return;
    clearPhoneAlreadyRegistered();
    set({ digits: extractNationalDigits(text), state: 'entry' });
  },

  submit: async () => {
    const { digits, state } = get();
    if (digits.length !== NATIONAL_NUMBER_LENGTH || state === 'submitting') return false;

    // A code is already out for this number, so advance to let the user enter it.
    // Re-submitting would send a second one, which the resend cooldown forbids.
    const { session } = useCashSetupSessionStore.getState();
    if (session.status === 'phoneSubmitted' && session.phoneNationalNumber === digits) {
      useVerifyPhoneFlowStore.getState().reset();
      return true;
    }

    clearPhoneAlreadyRegistered();
    set({ state: 'submitting' });
    try {
      const result = await createUserWithPhone({ nationalNumber: digits });

      if (result.outcome === 'registeredWithPasskey' || result.outcome === 'alreadyRegistered') {
        analytics.track(analytics.event.cashPhoneAlreadyRegistered, { outcome: result.outcome });
        useCashSetupSessionStore.getState().setPhoneAlreadyRegistered(digits);
        set({ state: 'entry' });
        return false;
      }

      const { challenge, resendAfter } =
        result.outcome === 'created'
          ? { challenge: { kind: 'signup', userId: result.userId } satisfies PhoneChallenge, resendAfter: result.resendAfter }
          : await startResume(digits);
      useCashSetupSessionStore.getState().setPhoneSubmitted({ challenge, phoneNationalNumber: digits, resendAfter });
      // A fresh code is on its way; drop any code/error left in the kept-mounted confirm step.
      useVerifyPhoneFlowStore.getState().reset();
      analytics.track(analytics.event.cashPhoneSubmitted, { mode: challenge.kind });
      set({ state: 'entry' });
      return true;
    } catch (e) {
      logger.error(new RainbowError('[useSubmitPhoneFlow]: Failed to create user with phone', e));
      analytics.track(analytics.event.cashPhoneSubmitFailed, { reason: getTelemetryErrorReason(e) });
      set({ state: 'error' });
      return false;
    }
  },

  reset: () => {
    clearPhoneAlreadyRegistered();
    set({ digits: '', state: 'entry' });
  },
}));
