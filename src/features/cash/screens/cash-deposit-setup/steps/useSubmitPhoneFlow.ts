import { useCallback } from 'react';

import { createBaseStore, createStoreActions } from '@storesjs/stores';

import { analytics } from '@/analytics';
import { logger, RainbowError } from '@/logger';

import { createUserWithPhone, startSignupResume, US_COUNTRY_CALLING_CODE } from '../../../services/userClient';
import { useCashSetupSessionStore, type PhoneChallenge } from '../../../stores/cashSetupSessionStore';
import { useVerifyPhoneFlowStore } from '../../../stores/verifyPhoneFlowStore';
import { useCashDepositSetupNavigation } from '../useCashDepositSetupNavigation';

export const NATIONAL_NUMBER_LENGTH = 10;

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

// Pasted or AutoFilled values may carry the +1 country code on top of the 10 national digits.
function extractNationalDigits(text: string): string {
  let digits = text.replace(/\D/g, '');
  if (digits.length > NATIONAL_NUMBER_LENGTH && digits.startsWith(US_COUNTRY_CALLING_CODE)) {
    digits = digits.slice(US_COUNTRY_CALLING_CODE.length);
  }
  return digits.slice(0, NATIONAL_NUMBER_LENGTH);
}

function clearPhoneAlreadyRegistered() {
  const sessionStore = useCashSetupSessionStore.getState();
  if (sessionStore.session.status === 'phoneAlreadyRegistered') sessionStore.reset();
}

export const useSubmitPhoneFlowStore = createBaseStore<SubmitPhoneFlowStore>((set, get) => ({
  state: 'entry',
  digits: '',

  setDigits: text => {
    clearPhoneAlreadyRegistered();
    set(({ state }) => ({ digits: extractNationalDigits(text), state: state === 'submitting' ? state : 'entry' }));
  },

  submit: async () => {
    const { digits, state } = get();
    if (digits.length !== NATIONAL_NUMBER_LENGTH || state === 'submitting') return false;

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
      set({ state: 'error' });
      return false;
    }
  },

  reset: () => {
    clearPhoneAlreadyRegistered();
    set({ digits: '', state: 'entry' });
  },
}));

const submitPhoneFlowActions = createStoreActions(useSubmitPhoneFlowStore);

export function useSubmitPhoneFlow(): Pick<SubmitPhoneFlowStore, 'state' | 'digits' | 'setDigits'> & { submit: () => Promise<void> } {
  const { next } = useCashDepositSetupNavigation();
  const state = useSubmitPhoneFlowStore(s => s.state);
  const digits = useSubmitPhoneFlowStore(s => s.digits);

  const submit = useCallback(async () => {
    if (await submitPhoneFlowActions.submit()) next();
  }, [next]);

  return { state, digits, setDigits: submitPhoneFlowActions.setDigits, submit };
}
