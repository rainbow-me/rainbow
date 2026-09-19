import { createBaseStore } from '@storesjs/stores';

import { analytics } from '@/analytics';
import { logger, RainbowError } from '@/logger';

import { isPasskeyCancellation } from '../../../services/cashPasskeyService';
import { signInWithPhone } from '../../../services/cashSignInService';
import { createUserWithPhone, startRecovery, startSignupResume } from '../../../services/userClient';
import {
  useCashSetupSessionStore,
  type PhoneChallenge,
  type PhoneVerificationChallenge,
  type RecoveryPhoneChallenge,
} from '../../../stores/cashSetupSessionStore';
import { useVerifyPhoneFlowStore } from '../../../stores/verifyPhoneFlowStore';
import { getTelemetryErrorReason } from '../../../utils/getTelemetryErrorReason';
import { extractNationalDigits, NATIONAL_NUMBER_LENGTH } from '../../../utils/phoneNumber';

export type SubmitPhoneState = 'entry' | 'submitting' | 'error' | 'existingAccount' | 'signingIn';

export type SignInWithExistingPasskeyResult = 'signedIn' | 'cancelled' | 'failed';

type SubmitPhoneFlowStore = {
  state: SubmitPhoneState;
  digits: string;
  run: object | null;
  setDigits: (text: string) => void;
  submit: () => Promise<boolean>;
  signInWithExistingPasskey: () => Promise<SignInWithExistingPasskeyResult>;
  chooseRecovery: () => Promise<boolean>;
  reset: () => void;
};

async function startResume(
  nationalNumber: string
): Promise<{ challenge: Extract<PhoneVerificationChallenge, { kind: 'resume' }>; resendAfter: number }> {
  const { resumeId, resendAfter } = await startSignupResume({ nationalNumber });
  return { challenge: { kind: 'resume', resumeId }, resendAfter };
}

async function startAccountRecovery(nationalNumber: string): Promise<{ challenge: RecoveryPhoneChallenge; resendAfter: number }> {
  const { recoveryId, resendAfter } = await startRecovery({ nationalNumber });
  return { challenge: { kind: 'recovery', recoveryId }, resendAfter };
}

function clearPhoneAlreadyRegistered() {
  const sessionStore = useCashSetupSessionStore.getState();
  if (sessionStore.session.status === 'phoneAlreadyRegistered') sessionStore.reset();
}

// Starts a phone-verification challenge and advances the setup session to it, or falls back to 'error' state on failure.
async function advanceToChallenge(
  startChallenge: () => Promise<{ challenge: PhoneChallenge; resendAfter: number }>,
  digits: string,
  isStale: () => boolean,
  set: (partial: Partial<SubmitPhoneFlowStore>) => void
): Promise<boolean> {
  try {
    const { challenge, resendAfter } = await startChallenge();
    if (isStale()) return false;
    useCashSetupSessionStore.getState().setPhoneSubmitted({ challenge, phoneNationalNumber: digits, resendAfter });
    // A fresh code is on its way; drop any code/error left in the kept-mounted confirm step.
    useVerifyPhoneFlowStore.getState().reset();
    analytics.track(analytics.event.cashPhoneSubmitted, { mode: challenge.kind });
    set({ state: 'entry' });
    return true;
  } catch (e) {
    if (isStale()) return false;
    logger.error(new RainbowError('[useSubmitPhoneFlow]: Failed to start phone verification challenge', e));
    analytics.track(analytics.event.cashPhoneSubmitFailed, { reason: getTelemetryErrorReason(e) });
    set({ state: 'error' });
    return false;
  }
}

export const useSubmitPhoneFlowStore = createBaseStore<SubmitPhoneFlowStore>((set, get) => ({
  state: 'entry',
  digits: '',
  run: null,

  setDigits: text => {
    const { state } = get();
    if (state === 'submitting' || state === 'signingIn') return;
    clearPhoneAlreadyRegistered();
    set({ digits: extractNationalDigits(text), state: 'entry' });
  },

  submit: async () => {
    const { digits, state } = get();
    if (digits.length !== NATIONAL_NUMBER_LENGTH || state === 'submitting' || state === 'signingIn') return false;

    // A code is already out for this number, so advance to let the user enter it.
    // Re-submitting would send a second one, which the resend cooldown forbids.
    const { session } = useCashSetupSessionStore.getState();
    if (session.status === 'phoneSubmitted' && session.phoneNationalNumber === digits) {
      useVerifyPhoneFlowStore.getState().reset();
      return true;
    }

    clearPhoneAlreadyRegistered();
    const run = {};
    set({ run, state: 'submitting' });
    const isStale = () => get().run !== run;
    try {
      const result = await createUserWithPhone({ nationalNumber: digits });
      if (isStale()) return false;

      if (result.outcome === 'alreadyRegistered') {
        analytics.track(analytics.event.cashPhoneAlreadyRegistered, { outcome: result.outcome });
        useCashSetupSessionStore.getState().setPhoneAlreadyRegistered(digits);
        set({ state: 'entry' });
        return false;
      }

      // The account already exists behind a passkey: offer to sign in before falling back to recovery.
      if (result.outcome === 'registeredWithPasskey') {
        analytics.track(analytics.event.cashPhoneAlreadyRegistered, { outcome: result.outcome });
        set({ state: 'existingAccount' });
        return false;
      }

      const startChallenge =
        result.outcome === 'created'
          ? async () => ({
              challenge: { kind: 'signup', userId: result.userId } satisfies PhoneVerificationChallenge,
              resendAfter: result.resendAfter,
            })
          : () => startResume(digits);
      return await advanceToChallenge(startChallenge, digits, isStale, set);
    } catch (e) {
      if (isStale()) return false;
      logger.error(new RainbowError('[useSubmitPhoneFlow]: Failed to create user with phone', e));
      analytics.track(analytics.event.cashPhoneSubmitFailed, { reason: getTelemetryErrorReason(e) });
      set({ state: 'error' });
      return false;
    }
  },

  // Primary action on the existing-account prompt: try the passkey the account was registered with
  // instead of falling back to recovery. Cancelling or failing leaves the prompt in place so the
  // user can retry or explicitly choose recovery.
  signInWithExistingPasskey: async () => {
    const { digits, state } = get();
    if (state !== 'existingAccount') return 'failed';

    const run = {};
    set({ run, state: 'signingIn' });
    try {
      await signInWithPhone(digits, 'existingAccountPrompt');
      if (get().run !== run) return 'cancelled';
      return 'signedIn';
    } catch (e) {
      if (get().run !== run) return 'cancelled';
      if (isPasskeyCancellation(e)) {
        set({ state: 'existingAccount' });
        return 'cancelled';
      }
      logger.error(new RainbowError('[useSubmitPhoneFlow]: Failed to sign in with existing passkey', e));
      set({ state: 'existingAccount' });
      return 'failed';
    }
  },

  // Secondary action on the existing-account prompt: the user no longer has their passkey.
  chooseRecovery: async () => {
    const { digits, state } = get();
    if (state !== 'existingAccount') return false;

    analytics.track(analytics.event.cashExistingAccountRecoverySelected);
    const run = {};
    set({ run, state: 'submitting' });
    return advanceToChallenge(
      () => startAccountRecovery(digits),
      digits,
      () => get().run !== run,
      set
    );
  },

  reset: () => {
    clearPhoneAlreadyRegistered();
    set({ run: null, digits: '', state: 'entry' });
  },
}));
