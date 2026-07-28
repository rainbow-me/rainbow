import { useCallback } from 'react';
import { Alert } from 'react-native';

import { createBaseStore, createStoreActions } from '@storesjs/stores';

import { analytics } from '@/analytics';
import { logger, RainbowError } from '@/logger';

import { createUserWithPhone, US_COUNTRY_CALLING_CODE } from '../../../services/userClient';
import { useCashSetupSessionStore } from '../../../stores/cashSetupSessionStore';
import { useCashDepositSetupNavigation } from '../useCashDepositSetupNavigation';
import { useVerifyPhoneFlowStore } from './useVerifyPhoneFlow';

export const NATIONAL_NUMBER_LENGTH = 10;

export type SubmitPhoneState = 'entry' | 'submitting' | 'error';

type SubmitPhoneFlowStore = {
  state: SubmitPhoneState;
  digits: string;
  setDigits: (text: string) => void;
  submit: () => Promise<boolean>;
  reset: () => void;
};

// Pasted or AutoFilled values may carry the +1 country code on top of the 10 national digits.
function extractNationalDigits(text: string): string {
  let digits = text.replace(/\D/g, '');
  if (digits.length > NATIONAL_NUMBER_LENGTH && digits.startsWith(US_COUNTRY_CALLING_CODE)) {
    digits = digits.slice(US_COUNTRY_CALLING_CODE.length);
  }
  return digits.slice(0, NATIONAL_NUMBER_LENGTH);
}

function formatError(error: unknown): string {
  if (!(error instanceof Error)) {
    try {
      return JSON.stringify(error, null, 2) ?? String(error);
    } catch {
      return String(error);
    }
  }

  try {
    return JSON.stringify(
      {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause,
        ...error,
      },
      null,
      2
    );
  } catch {
    return `${error.name}: ${error.message}\n\n${error.stack ?? ''}`;
  }
}

export const useSubmitPhoneFlowStore = createBaseStore<SubmitPhoneFlowStore>((set, get) => ({
  state: 'entry',
  digits: '',

  setDigits: text => set(({ state }) => ({ digits: extractNationalDigits(text), state: state === 'error' ? 'entry' : state })),

  submit: async () => {
    const { digits, state } = get();
    if (digits.length !== NATIONAL_NUMBER_LENGTH || state === 'submitting') return false;

    set({ state: 'submitting' });
    try {
      const { userId, resendAfter } = await createUserWithPhone({ nationalNumber: digits });
      useCashSetupSessionStore.getState().setPhoneSubmitted({ userId, phoneNationalNumber: digits, resendAfter });
      // A fresh code is on its way; drop any code/error left in the kept-mounted confirm step.
      useVerifyPhoneFlowStore.getState().reset();
      analytics.track(analytics.event.cashPhoneSubmitted);
      set({ state: 'entry' });
      return true;
    } catch (e) {
      logger.error(new RainbowError('[useSubmitPhoneFlow]: Failed to create user with phone', e));
      Alert.alert('Create user error', formatError(e));
      set({ state: 'error' });
      return false;
    }
  },

  reset: () => set({ digits: '', state: 'entry' }),
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
